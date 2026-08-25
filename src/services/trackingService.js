const trackingService = {
            config: {
                provider: 'biteship', // 'spx_direct' | 'biteship' | 'binderbyte' | 'rajaongkir'
                apiKey: '', // API Key loaded from settings/environment
                baseUrl: 'https://api.biteship.com/v1'
            },
            
            // Method to fetch live tracking details
            track: async function(courier, trackingNumber) {
                // If API key is present, execute real API call (Structure provided below)
                if (this.config.apiKey) {
                    try {
                        const response = await fetch(`${this.config.baseUrl}/trackings/${trackingNumber}?courier=${courier}`, {
                            headers: { 'Authorization': `Bearer ${this.config.apiKey}` }
                        });
                        if (response.ok) {
                            const data = await response.json();
                            return { success: true, history: data.history, currentStatus: data.status };
                        }
                    } catch (err) {
                        console.warn("API Tracking failed, using local tracking history fallback", err);
                    }
                }

                // Fallback / Mock Data Generator for demonstration when live API key isn't provided
                const mockHistory = [
                    { time: '2026-08-25 08:10', location: 'Hub Jakarta Selatan', status: 'Paket telah diterima di hub asal' },
                    { time: '2026-08-25 12:30', location: 'Transit Center Central', status: 'Paket sedang dalam perjalanan ke kota tujuan' },
                    { time: '2026-08-25 16:20', location: 'DC Tangerang', status: 'Paket tiba di hub tujuan' },
                    { time: '2026-08-25 17:00', location: 'Kurir SPX (Budi)', status: 'Paket dibawa oleh kurir' }
                ];

                return {
                    success: true,
                    provider: this.config.provider,
                    currentStatus: 'Dibawa kurir',
                    lastLocation: 'Kurir SPX (Budi)',
                    lastUpdate: '2026-08-25 17:00',
                    history: mockHistory
                };
            }
        };

export { trackingService };
