import React from 'react';
import StatCard from '../components/common/StatCard';
import FinanceCard from '../components/common/FinanceCard';
import StatusBadge from '../components/common/StatusBadge';

function DashboardView({ stats, packages, shopeeAccounts, helpers, onViewDetail, onQuickNew, onNavigateTab }) {
            return (
                <div className="space-y-6">
                    {/* Welcome Banner */}
                    <div className="bg-gradient-to-r from-rose-400 via-rose-500 to-pink-500 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                        <div className="relative z-10 max-w-xl">
                            <h2 className="text-xl md:text-2xl font-bold">Halo, Selamat Datang di YN Paket! 👋</h2>
                            <p className="text-rose-100 text-sm mt-1">Kelola stok belanja Shopee, pantau resi SPX, dan catat pembayaran COD dalam satu dashboard.</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button onClick={onQuickNew} className="bg-white text-rose-600 font-semibold px-4 py-2 rounded-xl text-xs hover:bg-rose-50 shadow-sm transition-all">
                                    + Tambah Pembelian Baru
                                </button>
                                <button onClick={() => onNavigateTab('cod')} className="bg-rose-600/60 hover:bg-rose-600 text-white font-medium px-4 py-2 rounded-xl text-xs backdrop-blur-sm border border-white/20">
                                    Lihat COD Pending
                                </button>
                            </div>
                        </div>
                        <div className="absolute -right-6 -bottom-10 opacity-20 text-9xl select-none pointer-events-none">📦</div>
                    </div>

                    {/* Stats Grid 1: Status Paket */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-slate-800 text-base">Statistik Paket Aktif</h3>
                            <button onClick={() => onNavigateTab('packages')} className="text-xs text-rose-600 font-semibold hover:underline">Lihat Semua Paket →</button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                            <StatCard title="Total Paket" value={stats.totalPackages} color="bg-slate-100 text-slate-800" icon="📦" />
                            <StatCard title="Menunggu Dikirim" value={stats.waitingShip} color="bg-amber-50 text-amber-700 border-amber-200" icon="⏳" />
                            <StatCard title="Sudah Dikirim" value={stats.shipped} color="bg-blue-50 text-blue-700 border-blue-200" icon="🚚" />
                            <StatCard title="Dalam Perjalanan" value={stats.inTransit} color="bg-sky-50 text-sky-700 border-sky-200" icon="🛣️" />
                            <StatCard title="Dibawa Kurir" value={stats.withCourier} color="bg-indigo-50 text-indigo-700 border-indigo-200" icon="🛵" />
                            <StatCard title="Sudah Diterima" value={stats.delivered} color="bg-emerald-50 text-emerald-700 border-emerald-200" icon="✅" />
                            <StatCard title="Bermasalah / Retur" value={stats.failedOrProblem} color="bg-red-50 text-red-700 border-red-200" icon="❌" />
                        </div>
                    </div>

                    {/* Stats Grid 2: Keuangan & Belanja */}
                    <div>
                        <h3 className="font-bold text-slate-800 text-base mb-3">Statistik Keuangan Bulan Ini</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <FinanceCard label="Total Modal Belanja" amount={`Rp${stats.totalModal.toLocaleString('id-ID')}`} subtitle="Total Harga Pesanan + Fee Jasa CO" bg="bg-emerald-500" icon="💰" />
                            <FinanceCard label="Total Fee Jasa CO" amount={`Rp${stats.totalFeeJasaCo.toLocaleString('id-ID')}`} subtitle="Akumulasi fee jasa checkout" bg="bg-blue-500" icon="🧾" />
                            <FinanceCard label="COD Belum Dibayar" amount={`Rp${stats.codUnpaid.toLocaleString('id-ID')}`} subtitle="Perlu siapkan uang tunai" bg="bg-amber-500" icon="💵" />
                        </div>
                    </div>

                    {/* Recent Active Packages Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">Paket Terbaru & Dalam Pengiriman</h3>
                            <button onClick={() => onNavigateTab('packages')} className="text-xs text-rose-600 font-semibold hover:underline">Semua Paket →</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 text-xs font-medium uppercase tracking-wider">
                                    <tr>
                                        <th className="p-3">ID / Tgl</th>
                                        <th className="p-3">Akun Shopee</th>
                                        <th className="p-3">Kurir & Resi</th>
                                        <th className="p-3">Penerima</th>
                                        <th className="p-3">COD</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {packages.slice(0, 5).map(pkg => (
                                        <tr key={pkg.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-3">
                                                <div className="font-bold text-slate-800">{pkg.id}</div>
                                                <div className="text-xs text-slate-400">{pkg.checkoutDate}</div>
                                            </td>
                                            <td className="p-3">
                                                <span className="inline-block px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded-md font-medium">
                                                    {shopeeAccounts.find(a=>a.id===pkg.shopeeAccountId)?.label || 'Shopee'}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <div className="font-medium text-slate-800">{pkg.shipping.courier}</div>
                                                <div className="text-xs text-slate-500 font-mono">{pkg.shipping.resi || 'Belum ada resi'}</div>
                                            </td>
                                            <td className="p-3 text-xs text-slate-600 max-w-[120px] truncate">{pkg.recipient.name}</td>
                                            <td className="p-3">
                                                {pkg.financials.metodePembayaran === 'COD' ? (
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                                        pkg.financials.codStatus === 'Sudah dibayar' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                    }`}>
                                                        Rp{(pkg.financials.totalModal/1000).toFixed(0)}k ({pkg.financials.codStatus})
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400">Non-COD</span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <StatusBadge status={pkg.shipping.status} />
                                            </td>
                                            <td className="p-3 text-right">
                                                <button 
                                                    onClick={() => onViewDetail(pkg)}
                                                    className="text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg font-medium transition-colors"
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

export default DashboardView;
