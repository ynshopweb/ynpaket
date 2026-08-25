import React from 'react';

function HelpersView({ helpers, packages, onAddHelper }) {
            return (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-bold text-slate-900 text-xl">Helper Checkout</h2>
                            <p className="text-slate-500 text-sm">Orang yang membantu melakukan checkout pesanan Shopee.</p>
                        </div>
                        <button onClick={onAddHelper} className="bg-rose-500 hover:bg-rose-600 text-white font-medium text-xs px-3.5 py-2 rounded-xl">
                            + Tambah Helper
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {helpers.map(hlp => {
                            const hlpPackages = packages.filter(p => p.helperId === hlp.id);
                            const totalSpent = hlpPackages.reduce((sum, p) => sum + p.financials.totalShopeePayment, 0);

                            return (
                                <div key={hlp.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                                    <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs">
                                        👤
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-sm">{hlp.name}</h3>
                                    <p className="text-xs text-slate-400">{hlp.phone || 'No HP -'}</p>
                                    <p className="text-xs text-slate-500 italic">{hlp.note}</p>
                                    <div className="pt-2 border-t border-slate-100 text-xs">
                                        <span className="text-slate-400">Total Dibantu:</span>
                                        <p className="font-bold text-slate-800">{hlpPackages.length} Checkout (Rp{totalSpent.toLocaleString('id-ID')})</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

export default HelpersView;
