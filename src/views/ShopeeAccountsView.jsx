import React from 'react';

function ShopeeAccountsView({ accounts, packages, onAddAccount }) {
            return (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-bold text-slate-900 text-xl">Daftar Akun Shopee</h2>
                            <p className="text-slate-500 text-sm">Pencatatan label akun Shopee yang digunakan untuk checkout stok.</p>
                        </div>
                        <button onClick={onAddAccount} className="bg-rose-500 hover:bg-rose-600 text-white font-medium text-xs px-3.5 py-2 rounded-xl">
                            + Tambah Akun Shopee
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {accounts.map(acc => {
                            const accPackages = packages.filter(p => p.shopeeAccountId === acc.id);
                            const activePkgs = accPackages.filter(p => p.shipping.status !== 'Berhasil diterima').length;
                            const totalSpent = accPackages.reduce((sum, p) => sum + p.financials.totalModal, 0);

                            return (
                                <div key={acc.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                                            🛍️
                                        </div>
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">{acc.status}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-base">{acc.label}</h3>
                                        <p className="text-xs text-slate-500 font-mono">@{acc.username}</p>
                                    </div>
                                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">{acc.note || 'Tidak ada catatan.'}</p>
                                    <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-slate-400">Paket Aktif:</span>
                                            <p className="font-bold text-slate-800">{activePkgs} Paket</p>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">Total Belanja:</span>
                                            <p className="font-bold text-rose-600">Rp{totalSpent.toLocaleString('id-ID')}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

export default ShopeeAccountsView;
