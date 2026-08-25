import React, { useState } from 'react';

function SettingsView({ trackingConfig, setTrackingConfig, showToast }) {
            const [provider, setProvider] = useState(trackingConfig.provider);
            const [apiKey, setApiKey] = useState(trackingConfig.apiKey);

            const handleSave = () => {
                setTrackingConfig({ provider, apiKey });
                showToast('Pengaturan API Tracking berhasil disimpan!');
            };

            return (
                <div className="space-y-6 max-w-2xl">
                    <div>
                        <h2 className="font-bold text-slate-900 text-xl">Pengaturan Integration Tracking API</h2>
                        <p className="text-slate-500 text-sm">Konfigurasi provider tracking otomatis (SPX Express, Biteship, BinderByte, RajaOngkir).</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Pilih Provider Tracking API</label>
                            <select 
                                value={provider}
                                onChange={(e) => setProvider(e.target.value)}
                                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-400"
                            >
                                <option value="biteship">Biteship Aggregator API (Rekomendasi SPX)</option>
                                <option value="binderbyte">BinderByte Tracking API</option>
                                <option value="rajaongkir">RajaOngkir PRO Tracking</option>
                                <option value="spx_direct">Direct SPX Express Official API</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">API Key Provider</label>
                            <input 
                                type="password" 
                                placeholder="Masukkan API Key dari Dashboard Provider"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-400"
                            />
                            <p className="text-[11px] text-slate-400 mt-1">API key tersimpan di browser secara lokal. Bila kosong, sistem akan menggunakan simulator tracking resi.</p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex justify-end">
                            <button onClick={handleSave} className="bg-rose-500 hover:bg-rose-600 text-white font-medium text-xs px-5 py-2.5 rounded-xl shadow-sm">
                                Simpan Pengaturan
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

export default SettingsView;
