const trackingService = {
    config: {
        provider: 'biteship',
        // Secret is kept on Vercel server. Never put it in the browser.
        baseUrl: '/api/tracking'
    },

    track: async function(courier, trackingNumber) {
        const resi = String(trackingNumber || '').trim();
        const courierName = String(courier || '').trim();

        if (!resi) return { success: false, error: 'Nomor resi belum tersedia.' };
        if (!courierName) return { success: false, error: 'Kurir belum dipilih.' };

        const response = await fetch(this.config.baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courier: courierName, trackingNumber: resi })
        });

        let data = null;
        try { data = await response.json(); } catch (_) {}

        if (!response.ok || !data?.success) {
            return {
                success: false,
                error: data?.error || 'Tracking sedang tidak tersedia. Coba lagi beberapa saat.'
            };
        }

        return {
            success: true,
            provider: data.provider || 'biteship',
            // PENTING: jangan pakai fallback string di sini. currentStatus harus
            // tetap null apa adanya kalau backend tidak bisa memetakan status ke
            // salah satu dari 7 status baku — App.jsx mengandalkan nilai null ini
            // untuk MEMUTUSKAN TIDAK menimpa status paket. Kalau di-fallback jadi
            // string ("Status tidak tersedia"), App.jsx akan mengira ini status
            // valid dan menuliskannya ke database (mencemari status baku).
            currentStatus: data.currentStatus || null,
            rawStatus: data.rawStatus || '', // teks asli dari kurir, untuk ditampilkan ke user
            lastLocation: data.lastLocation || '',
            lastUpdate: data.lastUpdate || '',
            history: Array.isArray(data.history) ? data.history : []
        };
    }
};

export { trackingService };
