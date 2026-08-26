/**
 * Vercel Serverless Function: YN Paket -> Binderbyte
 *
 * SISTEM CACHING:
 * Supaya nomor resi yang sama tidak memanggil API Binderbyte berulang kali
 * dalam jeda waktu yang sangat singkat (misal user klik "Update Tracking"
 * beberapa kali beruntun, atau beberapa komponen di frontend nge-trigger
 * tracking untuk resi yang sama hampir bersamaan), function ini memakai
 * dua lapis penghematan panggilan API:
 *
 *   1. Cache hasil (TTL) — hasil tracking per (kurir + resi) disimpan
 *      sebentar (default 5 menit, bisa diatur lewat env var
 *      TRACKING_CACHE_TTL_MS). Selama belum kedaluwarsa, request
 *      berikutnya untuk resi yang sama langsung dijawab dari cache
 *      tanpa memanggil Binderbyte sama sekali.
 *   2. Dedupe request bersamaan (in-flight) — kalau ada beberapa
 *      request untuk resi yang sama datang HAMPIR BERSAMAAN (sebelum
 *      request pertama selesai), request-request berikutnya menumpang
 *      hasil dari request pertama yang sedang berjalan, bukan memicu
 *      panggilan API baru.
 *
 * CATATAN: cache ini disimpan di memori (module-level, `Map`), bukan di
 * database eksternal. Artinya cache hanya "hidup" selama serverless
 * function instance-nya masih warm (khas perilaku Vercel — bisa efektif
 * beberapa menit hingga puluhan menit tergantung trafik), dan TIDAK
 * dijamin sama antar-instance jika Vercel menjalankan banyak instance
 * paralel. Ini sudah cukup untuk mencegah panggilan berulang dalam jeda
 * singkat (kasus yang diminta), tapi bukan cache terpusat/global. Kalau
 * ke depannya butuh cache yang benar-benar konsisten lintas instance,
 * ini bisa di-upgrade ke Vercel KV / Upstash Redis tanpa mengubah
 * kontrak API di file ini.
 */
const BASE_URL = 'https://api.binderbyte.com/v1';

// --- Konfigurasi cache ---
const CACHE_TTL_MS = Number(process.env.TRACKING_CACHE_TTL_MS) || 5 * 60 * 1000; // default 5 menit
const MAX_CACHE_ENTRIES = 500; // batas aman supaya memori instance tidak membengkak

const cache = new Map();            // key -> { data, expiresAt }
const pendingRequests = new Map();  // key -> Promise (dedupe request yang bersamaan)

function getCacheKey(courierCode, resi) {
    return `${courierCode}::${resi.toUpperCase()}`;
}

function pruneCache() {
    const now = Date.now();
    for (const [key, entry] of cache) {
        if (entry.expiresAt <= now) cache.delete(key);
    }
    if (cache.size > MAX_CACHE_ENTRIES) {
        const excess = cache.size - MAX_CACHE_ENTRIES;
        const oldestKeys = Array.from(cache.keys()).slice(0, excess);
        oldestKeys.forEach((k) => cache.delete(k));
    }
}

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
        delivered: 'Berhasil Diterima',
        'on-delivery': 'Dibawa Kurir',
        'on process': 'Dikirim',
        'in transit': 'Dikirim',
        pending: 'Dikemas',
        returned: 'Retur',
        cancelled: 'Retur'
    };
    const key = String(status || '').toLowerCase().trim();
    return map[key] || status || 'Status tidak tersedia';
}

function normalizeHistory(history) {
    if (!Array.isArray(history)) return [];
    return history.map(item => ({
        time: item?.date || item?.timestamp || '',
        location: item?.location || '',
        status: item?.desc || item?.description || ''
    }));
}

/** Panggil API Binderbyte yang sesungguhnya. Melempar Error dengan
 *  `httpStatus` + `publicMessage` kalau gagal, supaya bisa dipetakan
 *  ke response HTTP yang sesuai oleh handler. */
async function fetchFromBinderbyte(apiKey, courierCode, resi) {
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
        const error = new Error(message);

        if (statusCode === 400 || statusCode === 404) {
            error.httpStatus = 404;
            error.publicMessage = 'Nomor resi tidak ditemukan atau kode kurir salah.';
        } else if (statusCode === 401 || statusCode === 403) {
            error.httpStatus = 401;
            error.publicMessage = 'API Key Binderbyte salah atau kuota habis.';
        } else {
            error.httpStatus = 400;
            error.publicMessage = message;
        }
        throw error;
    }

    const data = payload.data || {};
    const summary = data.summary || {};
    const rawHistory = data.history || [];
    const history = normalizeHistory(rawHistory);
    const last = history[0];

    return {
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
    };
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

        const cacheKey = getCacheKey(courierCode, resi);
        pruneCache();

        // 2. Cache hit -> langsung jawab dari cache, TIDAK memanggil Binderbyte sama sekali
        const cached = cache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            return res.status(200).json({ ...cached.data, cached: true });
        }

        // 3. Ada request identik yang masih berjalan -> tumpangi hasilnya
        //    (mencegah dua panggilan API paralel untuk resi yang sama)
        if (pendingRequests.has(cacheKey)) {
            try {
                const result = await pendingRequests.get(cacheKey);
                return res.status(200).json({ ...result, cached: true });
            } catch (err) {
                // Request yang ditumpangi gagal -> lanjut coba fresh di bawah
            }
        }

        // 4. Cache miss -> baru panggil Binderbyte. Promise-nya disimpan dulu
        //    supaya request lain yang datang hampir bersamaan bisa numpang (langkah 3).
        const requestPromise = fetchFromBinderbyte(apiKey, courierCode, resi);
        pendingRequests.set(cacheKey, requestPromise);

        try {
            const result = await requestPromise;
            cache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
            return res.status(200).json(result);
        } finally {
            pendingRequests.delete(cacheKey);
        }
    } catch (error) {
        if (error && error.httpStatus) {
            return res.status(error.httpStatus).json({ success: false, error: error.publicMessage });
        }
        // Mencegah Serverless Function mengembalikan error HTTP 500 Uncaught
        console.error('Uncaught Serverless Exception:', error);
        return res.status(502).json({
            success: false,
            error: 'Terjadi kesalahan internal pada serverless function: ' + error.message
        });
    }
}
