/**
 * Vercel Serverless Function: YN Paket -> Binderbyte
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
    const key = String(status || '').toLowerCase().trim();
    
    const map = {
        'delivered': 'Berhasil Diterima',
        'berhasil diterima': 'Berhasil Diterima',
        'on-delivery': 'Dibawa Kurir',
        'dibawa kurir': 'Dibawa Kurir',
        'on process': 'Dikirim',
        'in transit': 'Dikirim',
        'dalam perjalanan': 'Dikirim',
        'sudah dikirim': 'Dikirim',
        'transit': 'Dikirim',
        'picked_up': 'Dikirim',
        'pending': 'Draft',
        'draft': 'Draft',
        'dikemas': 'Dikemas',
        'failure': 'Gagal Antar',
        'gagal antar': 'Gagal Antar',
        'returned': 'Retur',
        'retur': 'Retur',
        'cancelled': 'Retur'
    };
    
    return map[key] || 'Dikirim';
}

function normalizeHistory(history) {
    if (!Array.isArray(history)) return [];
    return history.map(item => ({
        time: item?.date || item?.timestamp || '',
        location: item?.location || '',
        status: item?.desc || item?.description || ''
    }));
}

export default async function handler(req, res) {
    // 1. Pastikan CORS & Method valid
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method tidak diizinkan.' });
    }

    try {
        // Ambil API key (Mendukung nama variabel BINDERBYTE_API_KEY atau VITE_BINDERBYTE_API_KEY)
        const apiKey = process.env.BINDERBYTE_API_KEY || process.env.VITE_BINDERBYTE_API_KEY;
        
        if (!apiKey) {
            console.error('BINDERBYTE_API_KEY tidak ditemukan di process.env');
            return res.status(503).json({
                success: false,
                error: 'API Key Binderbyte belum dikonfigurasi di Vercel.'
            });
        }

        const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
        const { courier, trackingNumber } = body;
        const resi = String(trackingNumber || '').trim();
        const courierCode = normalizeCourier(courier);

        if (!resi) return res.status(400).json({ success: false, error: 'Nomor resi belum tersedia.' });
        if (!courierCode) return res.status(400).json({ success: false, error: 'Kurir belum dipilih.' });

        // Request ke Binderbyte
        const url = `${BASE_URL}/track?api_key=${apiKey}&courier=${encodeURIComponent(courierCode)}&awb=${encodeURIComponent(resi)}`;
        const response = await fetch(url);

        let payload = null;
        try {
            payload = await response.json();
        } catch (e) {
            console.error('Gagal parse JSON dari Binderbyte:', e);
        }

        if (!response.ok || !payload || payload.status !== 200) {
            const statusCode = payload?.status || response.status;
            const message = payload?.message || 'Gagal melacak resi';

            if (statusCode === 400 || statusCode === 404) {
                return res.status(404).json({ success: false, error: 'Nomor resi tidak ditemukan atau kode kurir salah.' });
            }
            if (statusCode === 401 || statusCode === 403) {
                return res.status(401).json({ success: false, error: 'API Key Binderbyte salah atau kuota habis.' });
            }
            return res.status(400).json({ success: false, error: message });
        }

        const data = payload.data || {};
        const summary = data.summary || {};
        const rawHistory = data.history || [];
        const history = normalizeHistory(rawHistory);
        const last = history[0];

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
        // Mencegah Serverless Function mengembalikan error HTTP 500 Uncaught
        console.error('Uncaught Serverless Exception:', error);
        return res.status(502).json({ 
            success: false, 
            error: 'Terjadi kesalahan internal pada serverless function: ' + error.message 
        });
    }
}