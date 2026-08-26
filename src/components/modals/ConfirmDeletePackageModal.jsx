import React, { useState } from 'react';

function ConfirmDeletePackageModal({ pkg, onClose, onConfirm }) {
            const [deleting, setDeleting] = useState(false);

            const handleConfirm = async () => {
                setDeleting(true);
                await onConfirm();
            };

            return (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 text-xs text-center">
                        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-2xl mx-auto">
                            🗑️
                        </div>
                        <h3 className="font-bold text-slate-900 text-base">Hapus Paket Ini?</h3>
                        <p className="text-slate-600">
                            Paket <strong className="text-slate-900">{pkg.id}</strong> (Order: {pkg.shopeeOrderId}) akan dihapus permanen beserta rincian isi paket, riwayat tracking, dan data COD yang menempel padanya. Aksi ini <strong className="text-rose-600">tidak bisa dibatalkan</strong>.
                        </p>
                        {pkg.shipping?.resi && (
                            <div className="bg-slate-50 p-2.5 rounded-xl border text-slate-700">
                                No. Resi: <span className="font-mono font-semibold">{pkg.shipping.resi}</span>
                            </div>
                        )}
                        <div className="flex justify-center space-x-3 pt-2">
                            <button
                                onClick={onClose}
                                disabled={deleting}
                                className="px-4 py-2 border rounded-xl font-medium disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={deleting}
                                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm disabled:opacity-50"
                            >
                                {deleting ? 'Menghapus...' : 'Ya, Hapus Paket'}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

export default ConfirmDeletePackageModal;
