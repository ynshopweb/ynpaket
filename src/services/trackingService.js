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
            currentStatus: data.currentStatus || 'Status tidak tersedia',
            lastLocation: data.lastLocation || '',
            lastUpdate: data.lastUpdate || '',
            history: Array.isArray(data.history) ? data.history : []
        };
    }
};

export { trackingService };
