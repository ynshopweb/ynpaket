/**
 * Vercel Serverless Function: YN Paket -> Biteship
 * Required Vercel Environment Variable: BITESHIP_API_KEY
 */
const BASE_URL = 'https://api.biteship.com/v1';

function normalizeCourier(value) {
    const raw = String(value || '').trim().toLowerCase();
    const aliases = {
        'spx express': 'spx',
        'spx': 'spx',
        'jne': 'jne',
        'j&t': 'jnt',
        'jnt': 'jnt',
        'jet': 'jnt',
        'sicepat': 'sicepat',
        'si cepat': 'sicepat',
        'ninja': 'ninja',
        'ninja xpress': 'ninja',
        'anteraja': 'anteraja',
        'id express': 'idexpress',
        'idexpress': 'idexpress'
    };
    return aliases[raw] || raw.replace(/[^a-z0-9]/g, '');
}

function formatStatus(status) {
    const map = {
        pending: 'Menunggu dikirim',
        picked_up: 'Sudah dikirim',
        in_transit: 'Dalam perjalanan',
        on_delivery: 'Dibawa kurir',
        delivered: 'Berhasil diterima',
        cancelled: 'Dibatalkan',
        returned: 'Retur',
        failure: 'Gagal antar',
        exception: 'Bermasalah'
    };
    const key = String(status || '').toLowerCase();
    return map[key] || status || 'Status tidak tersedia';
}

function normalizeHistory(history) {
    if (!Array.isArray(history)) return [];
    return history.map(item => ({
        time: item.updated_at || item.timestamp || item.time || item.created_at || '',
        location: item.location || item.city || '',
        status: item.note || item.description || item.status || ''
    }));
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method tidak diizinkan.' });
    }

    const apiKey = process.env.BITESHIP_API_KEY;
    if (!apiKey) {
        return res.status(503).json({
            success: false,
            error: 'Tracking otomatis belum dikonfigurasi. Tambahkan BITESHIP_API_KEY di Environment Variables Vercel.'
        });
    }

    const { courier, trackingNumber } = req.body || {};
    const resi = String(trackingNumber || '').trim();
    const courierCode = normalizeCourier(courier);

    if (!resi) return res.status(400).json({ success: false, error: 'Nomor resi belum tersedia.' });
    if (!courierCode) return res.status(400).json({ success: false, error: 'Kurir belum dipilih.' });

    try {
        const url = `${BASE_URL}/trackings/${encodeURIComponent(resi)}?courier_code=${encodeURIComponent(courierCode)}`;
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                Accept: 'application/json'
            }
        });

        let payload = null;
        try { payload = await response.json(); } catch (_) {}

        if (!response.ok) {
            console.error('Biteship tracking error:', response.status, payload);
            if (response.status === 404) return res.status(404).json({ success: false, error: 'Nomor resi tidak ditemukan.' });
            if (response.status === 401 || response.status === 403) {
                return res.status(502).json({ success: false, error: 'API key Biteship tidak valid atau tidak memiliki akses tracking.' });
            }
            return res.status(502).json({ success: false, error: 'Server tracking sedang mengalami gangguan.' });
        }

        const history = normalizeHistory(payload?.history);
        const last = history[history.length - 1];

        return res.status(200).json({
            success: true,
            provider: 'biteship',
            currentStatus: formatStatus(payload?.status || payload?.tracking?.status || payload?.data?.status),
            lastLocation: payload?.last_location || payload?.location || last?.location || '',
            lastUpdate: payload?.updated_at || payload?.last_update || last?.time || new Date().toISOString(),
            history
        });
    } catch (error) {
        console.error('Tracking proxy error:', error);
        return res.status(502).json({ success: false, error: 'Gagal terhubung ke server tracking.' });
    }
}
