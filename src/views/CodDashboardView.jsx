import React from 'react';

function CodDashboardView({ packages, stats, onMarkCodPaid, onViewDetail }) {
            return (
                <div className="space-y-6">
                    <div>
                        <h2 className="font-bold text-slate-900 text-xl">Dashboard Pembayaran COD Shopee</h2>
                        <p className="text-slate-500 text-sm">Monitoring tagihan COD pembelian stok barang di Shopee.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl">
                            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">COD Belum Dibayar</p>
                            <h3 className="text-2xl font-bold text-rose-900 mt-1">Rp{stats.codUnpaid.toLocaleString('id-ID')}</h3>
                            <p className="text-xs text-rose-700 mt-1">Siapkan uang tunai saat kurir datang.</p>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
                            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">COD Sudah Lunas</p>
                            <h3 className="text-2xl font-bold text-emerald-900 mt-1">Rp{stats.codPaid.toLocaleString('id-ID')}</h3>
                            <p className="text-xs text-emerald-700 mt-1">Pembayaran COD selesai di kurir.</p>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
                            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">COD Bermasalah</p>
                            <h3 className="text-2xl font-bold text-amber-900 mt-1">Rp{stats.codProblem.toLocaleString('id-ID')}</h3>
                            <p className="text-xs text-amber-700 mt-1">Kendala pengantaran / retur.</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800">Daftar Paket COD</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase">
                                    <tr>
                                        <th className="p-3">ID Paket</th>
                                        <th className="p-3">Penerima Alamat</th>
                                        <th className="p-3">Kurir & Resi</th>
                                        <th className="p-3">Nominal COD</th>
                                        <th className="p-3">Status COD</th>
                                        <th className="p-3 text-right">Tindakan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {packages.map(pkg => (
                                        <tr key={pkg.id} className="hover:bg-slate-50">
                                            <td className="p-3 font-bold text-slate-800">{pkg.id}</td>
                                            <td className="p-3">
                                                <div className="text-slate-800 font-medium">{pkg.recipient.name}</div>
                                                <div className="text-xs text-slate-400">{pkg.recipient.phone}</div>
                                            </td>
                                            <td className="p-3">
                                                <div className="font-medium text-slate-800">{pkg.shipping.courier}</div>
                                                <div className="text-xs font-mono text-slate-500">{pkg.shipping.resi || '-'}</div>
                                            </td>
                                            <td className="p-3 font-bold text-slate-900">
                                                Rp{pkg.financials.totalShopeePayment.toLocaleString('id-ID')}
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                    pkg.financials.codStatus === 'Sudah dibayar' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                                }`}>
                                                    {pkg.financials.codStatus}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right space-x-2">
                                                {pkg.financials.codStatus !== 'Sudah dibayar' && (
                                                    <button 
                                                        onClick={() => onMarkCodPaid(pkg.id)}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                                                    >
                                                        ✓ Tandai Sudah Dibayar
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => onViewDetail(pkg)}
                                                    className="text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1"
                                                >
                                                    Detail
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            );
        }

export default CodDashboardView;
