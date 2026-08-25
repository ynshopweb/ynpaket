import React from 'react';

function ReportsView({ packages, shopeeAccounts, helpers }) {
            return (
                <div className="space-y-6">
                    <div>
                        <h2 className="font-bold text-slate-900 text-xl">Laporan Rekap Belanja Stok</h2>
                        <p className="text-slate-500 text-sm">Analisis pengeluaran modal per akun Shopee dan Helper.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Report Per Shopee Account */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 text-base mb-3">Rekap per Akun Shopee</h3>
                            <div className="space-y-3">
                                {shopeeAccounts.map(acc => {
                                    const accPkgs = packages.filter(p => p.shopeeAccountId === acc.id);
                                    const totalSpent = accPkgs.reduce((sum, p) => sum + p.financials.totalShopeePayment, 0);
                                    return (
                                        <div key={acc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
                                            <div>
                                                <div className="font-bold text-slate-800">{acc.label}</div>
                                                <div className="text-slate-400">{accPkgs.length} kali checkout</div>
                                            </div>
                                            <div className="font-bold text-rose-600 text-sm">
                                                Rp{totalSpent.toLocaleString('id-ID')}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Report Per Helper */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 text-base mb-3">Rekap per Helper Checkout</h3>
                            <div className="space-y-3">
                                {helpers.map(hlp => {
                                    const hlpPkgs = packages.filter(p => p.helperId === hlp.id);
                                    const totalSpent = hlpPkgs.reduce((sum, p) => sum + p.financials.totalShopeePayment, 0);
                                    return (
                                        <div key={hlp.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
                                            <div>
                                                <div className="font-bold text-slate-800">{hlp.name}</div>
                                                <div className="text-slate-400">{hlpPkgs.length} kali dibantu</div>
                                            </div>
                                            <div className="font-bold text-slate-800 text-sm">
                                                Rp{totalSpent.toLocaleString('id-ID')}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

export default ReportsView;
