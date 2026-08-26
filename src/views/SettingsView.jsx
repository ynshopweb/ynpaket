import React, { useState } from 'react';

function SettingsView({ trackingConfig, setTrackingConfig, showToast }) {
    const [provider, setProvider] = useState(trackingConfig.provider || 'biteship');

    const handleSave = () => {
        setTrackingConfig({ provider, baseUrl: '/api/tracking' });
        showToast('Provider tracking berhasil disimpan. API key aman di server Vercel.');
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h2 className="font-bold text-slate-900 text-xl">Pengaturan Integrasi Tracking API</h2>
                <p className="text-slate-500 text-sm">
                    Tracking live berjalan melalui server YN Paket sehingga API key tidak terekspos di browser.
                </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Pilih Provider Tracking API
                    </label>
                    <select value={provider} onChange={(e) => setProvider(e.target.value)}
                        className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-400">
                        <option value="biteship">Biteship Aggregator API</option>
                    </select>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                    <div className="font-bold mb-1">🔐 API key tidak dimasukkan di sini</div>
                    <div>
                        Tambahkan <code className="font-mono font-bold">BITESHIP_API_KEY</code> pada
                        Vercel → Project → Settings → Environment Variables, lalu lakukan redeploy.
                        Jangan menaruh API key di source code, localStorage, atau Firestore.
                    </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button onClick={handleSave}
                        className="bg-rose-500 hover:bg-rose-600 text-white font-medium text-xs px-5 py-2.5 rounded-xl shadow-sm">
                        Simpan Pengaturan
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SettingsView;
