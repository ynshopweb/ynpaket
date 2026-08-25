import React from 'react';
import StatusBadge from '../components/common/StatusBadge';

function PackagesListView({ 
            packages, statusFilter, setStatusFilter, accountFilter, setAccountFilter, 
            shopeeAccounts, helpers, onViewDetail, onMarkCodPaid, onSyncStock, onUpdateTracking, copyToClipboard 
        }) {
            const statusOptions = ['Semua', 'Draft', 'Menunggu dikirim', 'Sudah dikirim', 'Dalam perjalanan', 'Transit', 'Dibawa kurir', 'Berhasil diterima', 'Gagal antar', 'Retur'];

            return (
                <div className="space-y-4">
                    {/* Filters Header */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <h2 className="font-bold text-slate-800 text-lg">Semua Daftar Paket</h2>
                            <div className="flex flex-wrap items-center gap-2">
                                <label className="text-xs text-slate-500 font-medium">Akun Shopee:</label>
                                <select 
                                    value={accountFilter}
                                    onChange={(e) => setAccountFilter(e.target.value)}
                                    className="text-xs bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-400"
                                >
                                    <option value="Semua">Semua Akun</option>
                                    {shopeeAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Status Pills */}
                        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
                            {statusOptions.map(st => (
                                <button
                                    key={st}
                                    onClick={() => setStatusFilter(st)}
                                    className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all ${
                                        statusFilter === st ? 'bg-rose-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="p-3.5">ID Paket / Tgl</th>
                                        <th className="p-3.5">Akun & Helper</th>
                                        <th className="p-3.5">Kurir & No. Resi</th>
                                        <th className="p-3.5">Produk Isi Paket</th>
                                        <th className="p-3.5">COD / Modal</th>
                                        <th className="p-3.5">Status Pengiriman</th>
                                        <th className="p-3.5 text-center">Aksi & Tracking</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {packages.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="p-8 text-center text-slate-400">
                                                Tidak ada data paket yang sesuai filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        packages.map(pkg => {
                                            const acc = shopeeAccounts.find(a => a.id === pkg.shopeeAccountId);
                                            const hlp = helpers.find(h => h.id === pkg.helperId);
                                            return (
                                                <tr key={pkg.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="p-3.5">
                                                        <div className="font-bold text-slate-900">{pkg.id}</div>
                                                        <div className="text-xs text-slate-400">{pkg.checkoutDate}</div>
                                                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">Order: {pkg.shopeeOrderId}</div>
                                                    </td>
                                                    <td className="p-3.5">
                                                        <div className="text-xs font-medium text-slate-800">{acc ? acc.label : '-'}</div>
                                                        <div className="text-xs text-slate-500">Dibantu: <span className="font-medium text-slate-700">{hlp ? hlp.name : '-'}</span></div>
                                                    </td>
                                                    <td className="p-3.5">
                                                        <div className="font-semibold text-slate-800">{pkg.shipping.courier}</div>
                                                        {pkg.shipping.resi ? (
                                                            <div className="flex items-center space-x-1 mt-0.5">
                                                                <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{pkg.shipping.resi}</span>
                                                                <button 
                                                                    onClick={() => copyToClipboard(pkg.shipping.resi, 'Nomor Resi')}
                                                                    className="text-[10px] text-rose-600 hover:text-rose-800"
                                                                    title="Copy Resi"
                                                                >
                                                                    📋
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-amber-600 italic">Belum ada resi</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3.5 max-w-xs">
                                                        <div className="text-xs text-slate-800 font-medium">
                                                            {pkg.items[0]?.name} {pkg.items.length > 1 && <span className="text-rose-600 font-bold">(+{pkg.items.length - 1} barang)</span>}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400 truncate">
                                                            {pkg.items.map(i => `${i.qty}x ${i.variant}`).join(', ')}
                                                        </div>
                                                    </td>
                                                    <td className="p-3.5">
                                                        <div className="font-bold text-slate-900">Rp{pkg.financials.totalShopeePayment.toLocaleString('id-ID')}</div>
                                                        <div className="text-xs mt-0.5">
                                                            {pkg.financials.paymentMethod === 'COD' ? (
                                                                <button 
                                                                    onClick={() => pkg.financials.codStatus !== 'Sudah dibayar' && onMarkCodPaid(pkg.id)}
                                                                    className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                                                                        pkg.financials.codStatus === 'Sudah dibayar' 
                                                                            ? 'bg-emerald-100 text-emerald-700 cursor-default' 
                                                                            : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                                                    }`}
                                                                >
                                                                    COD: {pkg.financials.codStatus}
                                                                </button>
                                                            ) : (
                                                                <span className="text-slate-400">{pkg.financials.paymentMethod}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-3.5">
                                                        <StatusBadge status={pkg.shipping.status} />
                                                        <div className="text-[11px] text-slate-400 mt-1 max-w-[130px] truncate" title={pkg.shipping.lastLocation}>
                                                            📍 {pkg.shipping.lastLocation || 'Proses'}
                                                        </div>
                                                    </td>
                                                    <td className="p-3.5 text-center space-y-1">
                                                        <button 
                                                            onClick={() => onViewDetail(pkg)}
                                                            className="w-full text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-1 px-2.5 rounded-lg transition-colors"
                                                        >
                                                            🔍 Detail
                                                        </button>
                                                        {pkg.shipping.resi && (
                                                            <button 
                                                                onClick={() => onUpdateTracking(pkg)}
                                                                className="w-full text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium py-1 px-2.5 rounded-lg transition-colors"
                                                            >
                                                                🔄 Track Resi
                                                            </button>
                                                        )}
                                                        {pkg.shipping.status === 'Berhasil diterima' && (
                                                            <button 
                                                                onClick={() => onSyncStock(pkg)}
                                                                disabled={pkg.stockSynced}
                                                                className={`w-full text-xs font-medium py-1 px-2.5 rounded-lg transition-colors ${
                                                                    pkg.stockSynced ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                                                }`}
                                                            >
                                                                {pkg.stockSynced ? '✓ Stok Synced' : '+ Masuk Stok'}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            );
        }

export default PackagesListView;
