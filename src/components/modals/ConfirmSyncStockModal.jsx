import React from 'react';

function ConfirmSyncStockModal({ pkg, onClose, onConfirm }) {
            return (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 text-xs text-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mx-auto">
                            📥
                        </div>
                        <h3 className="font-bold text-slate-900 text-base">Masukkan ke Stok Rumah?</h3>
                        <p className="text-slate-600">
                            Barang dalam paket <strong className="text-slate-900">{pkg.id}</strong> akan ditambahkan ke jumlah inventaris stok rumah Anda.
                        </p>
                        <div className="bg-slate-50 p-3 rounded-xl border text-left text-slate-700 space-y-1">
                            {pkg.items.map((i, idx) => (
                                <div key={idx} className="flex justify-between font-semibold">
                                    <span>{i.name} ({i.variant})</span>
                                    <span className="text-emerald-600">+{i.qty} Pcs</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-center space-x-3 pt-2">
                            <button onClick={onClose} className="px-4 py-2 border rounded-xl font-medium">Batal</button>
                            <button onClick={onConfirm} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm">
                                Ya, Masukkan Stok
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

export default ConfirmSyncStockModal;
