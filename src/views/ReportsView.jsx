import React, { useState, useMemo } from 'react';

function monthKeyToLabel(monthKey) {
    // "2026-10" -> "Oktober 2026"
    const [year, month] = monthKey.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

function getCurrentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function ReportsView({ packages, shopeeAccounts, jasaCoList = [] }) {
            const currentMonthKey = getCurrentMonthKey();
            const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);

            // PENTING: filter dilakukan di SINI, sebelum data masuk ke breakdown
            // per Akun Shopee maupun per Jasa CO — inilah perbaikan utamanya.
            // Sebelumnya seluruh breakdown menjumlahkan SEMUA paket sepanjang waktu,
            // sehingga "Total Modal Belanja" ikut menumpuk dari bulan-bulan sebelumnya
            // walaupun sedang melihat rekap bulan tertentu.
            const packagesBulanIni = useMemo(
                () => packages.filter(p => (p.checkoutDate || '').startsWith(selectedMonth)),
                [packages, selectedMonth]
            );

            const totalModalBulanIni = packagesBulanIni.reduce((sum, p) => sum + (p.financials.totalModal || 0), 0);
            const totalFeeJasaCoBulanIni = packagesBulanIni.reduce((sum, p) => sum + (p.financials.feeJasaCo || 0), 0);

            return (
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="font-bold text-slate-900 text-xl">Laporan Rekap Belanja Stok (Bulanan)</h2>
                            <p className="text-slate-500 text-sm">Analisis pengeluaran modal per akun Shopee dan Jasa CO — dihitung khusus untuk bulan yang dipilih.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-slate-500">Pilih Bulan:</label>
                            <input
                                type="month"
                                value={selectedMonth}
                                max={currentMonthKey}
                                onChange={e => setSelectedMonth(e.target.value || currentMonthKey)}
                                className="border rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 bg-white"
                            />
                            {selectedMonth !== currentMonthKey && (
                                <button
                                    onClick={() => setSelectedMonth(currentMonthKey)}
                                    className="text-xs font-semibold text-rose-600 hover:underline whitespace-nowrap"
                                >
                                    Kembali ke Bulan Ini
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Ringkasan Bulan Terpilih — angka ini HANYA dari checkoutDate di bulan
                        yang sedang dipilih, tidak lagi tercampur bulan lain. */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Rekap {monthKeyToLabel(selectedMonth)}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                            <div>
                                <p className="text-xs text-slate-400">Total Modal Belanja</p>
                                <p className="text-2xl font-bold text-emerald-600">Rp{totalModalBulanIni.toLocaleString('id-ID')}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Total Fee Jasa CO</p>
                                <p className="text-2xl font-bold text-blue-600">Rp{totalFeeJasaCoBulanIni.toLocaleString('id-ID')}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Jumlah Transaksi</p>
                                <p className="text-2xl font-bold text-slate-800">{packagesBulanIni.length}</p>
                            </div>
                        </div>
                        {packagesBulanIni.length === 0 && (
                            <p className="text-xs text-slate-400 mt-3 italic">Belum ada transaksi tercatat untuk bulan ini.</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Report Per Shopee Account — difilter ke bulan terpilih */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 text-base mb-3">Rekap per Akun Shopee</h3>
                            <div className="space-y-3">
                                {shopeeAccounts.map(acc => {
                                    const accPkgs = packagesBulanIni.filter(p => p.shopeeAccountId === acc.id);
                                    const totalSpent = accPkgs.reduce((sum, p) => sum + p.financials.totalModal, 0);
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

                        {/* Report Per Jasa CO — difilter ke bulan terpilih */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 text-base mb-3">Rekap per Jasa CO</h3>
                            <div className="space-y-3">
                                {jasaCoList.map(j => {
                                    const jPkgs = packagesBulanIni.filter(p => p.jasaCoId === j.id);
                                    const totalSpent = jPkgs.reduce((sum, p) => sum + p.financials.totalModal, 0);
                                    return (
                                        <div key={j.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
                                            <div>
                                                <div className="font-bold text-slate-800">{j.nama}</div>
                                                <div className="text-slate-400">{jPkgs.length} kali dibantu</div>
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
