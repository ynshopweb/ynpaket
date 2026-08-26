/**
 * Vercel Serverless Function: YN Paket -> Binderbyte
 * Required Vercel Environment Variable: BINDERBYTE_API_KEY
 */
const BASE_URL = 'https://api.binderbyte.com/v1';

function normalizeCourier(value) {
    const raw = String(value || '').trim().toLowerCase();
    const aliases = {
        'spx express': 'spx',
        'spx': 'spx',
        'shopee express': 'spx',
        'shopee': 'spx',
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
        'idexpress': 'idexpress',
        'pos': 'pos',
        'tiki': 'tiki',
        'wahana': 'wahana'
    };
    return aliases[raw] || raw.replace(/[^a-z0-9]/g, '');
}

function formatStatus(status) {
    const map = {
        delivered: 'Berhasil diterima',
        on-delivery: 'Dibawa kurir',
        on process: 'Dalam perjalanan',
        in transit: 'Dalam perjalanan',
        pending: 'Menunggu dikirim',
        returned: 'Retur',
        cancelled: 'Dibatalkan'
    };
    const key = String(status || '').toLowerCase().trim();
    return map[key] || status || 'Status tidak tersedia';
}

function normalizeHistory(history) {
    if (!Array.isArray(history)) return [];
    return history.map(item => ({
        time: item.date || item.timestamp || '',
        location: item.location || '',
        status: item.desc || item.description || ''
    }));
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method tidak diizinkan.' });
    }

    const apiKey = process.env.BINDERBYTE_API_KEY;
    if (!apiKey) {
        return res.status(503).json({
            success: false,
            error: 'Tracking otomatis belum dikonfigurasi. Tambahkan BINDERBYTE_API_KEY di Environment Variables Vercel.'
        });
    }

    const { courier, trackingNumber } = req.body || {};
    const resi = String(trackingNumber || '').trim();
    const courierCode = normalizeCourier(courier);

    if (!resi) return res.status(400).json({ success: false, error: 'Nomor resi belum tersedia.' });
    if (!courierCode) return res.status(400).json({ success: false, error: 'Kurir belum dipilih.' });

    try {
        const url = `${BASE_URL}/track?api_key=${apiKey}&courier=${encodeURIComponent(courierCode)}&awb=${encodeURIComponent(resi)}`;
        const response = await fetch(url);

        let payload = null;
        try { payload = await response.json(); } catch (_) {}

        // Tangani jika HTTP status / Binderbyte status bernilai tidak sukses (bukan 200)
        if (!response.ok || payload?.status !== 200) {
            console.error('Binderbyte tracking error:', response.status, payload);
            
            const statusCode = payload?.status || response.status;
            const message = payload?.message || '';

            if (statusCode === 400 || statusCode === 404 || message.toLowerCase().includes('not found')) {
                return res.status(404).json({ success: false, error: 'Nomor resi tidak ditemukan atau kurir tidak sesuai.' });
            }
            if (statusCode === 401 || statusCode === 403) {
                return res.status(502).json({ success: false, error: 'API key Binderbyte tidak valid atau kuota telah habis.' });
            }
            return res.status(502).json({ success: false, error: message || 'Server tracking sedang mengalami gangguan.' });
        }

        const data = payload.data || {};
        const summary = data.summary || {};
        const rawHistory = data.history || [];
        const history = normalizeHistory(rawHistory);
        const last = history[0]; // Binderbyte mengurutkan history terbaru di indeks paling atas [0]

        return res.status(200).json({
            success: true,
            provider: 'binderbyte',
            currentStatus: formatStatus(summary.status),
            lastLocation: last?.location || summary.destination || '',
            lastUpdate: summary.date || last?.time || new Date().toISOString(),
            detail: {
                shipper: data.detail?.shipper || '',
                receiver: data.detail?.receiver || '',
                origin: summary.origin || '',
                destination: summary.destination || ''
            },
            history
        });
    } catch (error) {
        console.error('Tracking proxy error:', error);
        return res.status(502).json({ success: false, error: 'Gagal terhubung ke server tracking.' });
    }
}