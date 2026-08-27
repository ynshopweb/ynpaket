import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import { PACKAGE_STATUSES } from '../../constants/packageStatus';

function PackageDetailModal({
            pkg, shopeeAccounts, jasaCoList = [], onClose, onMarkCodPaid, onSyncStock, onUpdateTracking,
            onDeletePackage, onEditPackage, onManualStatusChange, onApplyPendingApiStatus, onDismissPendingApiStatus,
            copyToClipboard
        }) {
            const acc = shopeeAccounts.find(a=>a.id === pkg.shopeeAccountId);
            const jasaCo = jasaCoList.find(j=>j.id === pkg.jasaCoId);

            const [selectedStatus, setSelectedStatus] = useState('');
            const [statusNote, setStatusNote] = useState('');
            const [savingStatus, setSavingStatus] = useState(false);

            const isManual = pkg.shipping.statusSource === 'manual';
            const hasPendingApi = !!pkg.shipping.pendingApiStatus;

            const handleSaveStatus = async () => {
                if (!selectedStatus || !onManualStatusChange) return;
                setSavingStatus(true);
                try {
                    await onManualStatusChange({ status: selectedStatus, note: statusNote.trim() });
                    setSelectedStatus('');
                    setStatusNote('');
                } finally {
                    setSavingStatus(false);
                }
            };

            return (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
                        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-base">Detail Paket {pkg.id}</h3>
                                <p className="text-xs text-slate-400">Order Shopee: {pkg.shopeeOrderId}</p>
                            </div>
                            <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                            {/* Summary header */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <div>
                                    <span className="text-slate-400">Akun Shopee:</span>
                                    <div className="font-bold text-slate-800">{acc ? acc.label : '-'}</div>
                                </div>
                                <div>
                                    <span className="text-slate-400">Jasa CO:</span>
                                    <div className="font-bold text-slate-800">{jasaCo ? jasaCo.nama : (pkg.financials.jasaCoNama || '-')}</div>
                                </div>
                                <div>
                                    <span className="text-slate-400">Status Pengiriman:</span>
                                    <div className="mt-0.5"><StatusBadge status={pkg.shipping.status} source={pkg.shipping.statusSource} /></div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                        {isManual
                                            ? `Diubah manual oleh ${pkg.shipping.manualStatusBy || 'admin'}${pkg.shipping.manualStatusAt ? ` · ${pkg.shipping.manualStatusAt}` : ''}`
                                            : 'Sumber: Otomatis (Tracking API)'}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-slate-400">Metode Bayar:</span>
                                    <div className="font-bold text-rose-600">{pkg.financials.metodePembayaran} ({pkg.financials.codStatus})</div>
                                </div>
                            </div>

                            {/* Peringatan: saran status baru dari API tertahan karena status sedang dikunci manual */}
                            {hasPendingApi && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                                    <div className="flex items-start space-x-2">
                                        <span className="text-base">⚠️</span>
                                        <div>
                                            <p className="font-semibold text-amber-800">
                                                Ada pembaruan dari Tracking API: "{pkg.shipping.pendingApiStatus}"
                                            </p>
                                            <p className="text-amber-700">
                                                Status paket ini sedang dikunci manual ("{pkg.shipping.status}"), jadi API tidak menimpanya secara otomatis.
                                                {pkg.shipping.pendingApiUpdate && ` Terpantau: ${pkg.shipping.pendingApiUpdate}.`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2 pl-7">
                                        <button
                                            onClick={onApplyPendingApiStatus}
                                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg"
                                        >
                                            ✓ Terapkan Status API
                                        </button>
                                        <button
                                            onClick={onDismissPendingApiStatus}
                                            className="bg-white border border-amber-300 hover:bg-amber-100 text-amber-700 font-medium text-[11px] px-3 py-1.5 rounded-lg"
                                        >
                                            Abaikan
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Ubah Status Manual */}
                            <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 space-y-2">
                                <h4 className="font-bold text-slate-800 text-sm">✋ Ubah Status Manual</h4>
                                <p className="text-[11px] text-slate-500">
                                    Pakai ini kalau API tracking sedang error/down/limit habis, resi belum terbaca, atau kamu ingin mengoreksi status. Setelah diubah manual, tracking otomatis tidak akan menimpa status ini sampai kamu menerapkannya sendiri.
                                </p>
                                <div className="flex flex-col md:flex-row gap-2">
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    >
                                        <option value="">— Pilih Status —</option>
                                        {PACKAGE_STATUSES.map(st => (
                                            <option key={st} value={st}>{st}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        value={statusNote}
                                        onChange={(e) => setStatusNote(e.target.value)}
                                        placeholder="Catatan (opsional), mis. 'API Binderbyte error'"
                                        className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 flex-[2] focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    />
                                    <button
                                        onClick={handleSaveStatus}
                                        disabled={!selectedStatus || savingStatus}
                                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs px-4 py-2 rounded-lg whitespace-nowrap"
                                    >
                                        {savingStatus ? 'Menyimpan...' : 'Simpan Status'}
                                    </button>
                                </div>
                            </div>

                            {/* Tracking & Resi Card */}
                            <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-slate-500 font-medium">Ekspedisi Kurir: {pkg.shipping.courier}</span>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className="font-mono font-bold text-slate-900 text-sm">{pkg.shipping.resi || 'Belum ada Resi'}</span>
                                            {pkg.shipping.resi && (
                                                <button onClick={()=>copyToClipboard(pkg.shipping.resi, 'Nomor Resi')} className="text-xs bg-white px-2 py-0.5 border rounded shadow-sm hover:bg-slate-50">📋 Copy</button>
                                            )}
                                        </div>
                                    </div>
                                    {pkg.shipping.resi && (
                                        <button onClick={onUpdateTracking} className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg font-bold">🔄 Update Tracking Live</button>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-500">Update Terakhir: {pkg.shipping.lastUpdate} ({pkg.shipping.lastLocation})</p>
                                {pkg.shipping.lastTrackingCheck && (
                                    <p className="text-[11px] text-slate-400">Terakhir cek ke API: {pkg.shipping.lastTrackingCheck}</p>
                                )}
                            </div>

                            {/* Tracking Timeline */}
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm mb-3">📍 Timeline Tracking Pengiriman</h4>
                                <div className="space-y-3 pl-2 border-l-2 border-rose-200">
                                    {pkg.trackingHistory && pkg.trackingHistory.length > 0 ? (
                                        pkg.trackingHistory.map((tr, idx) => (
                                            <div key={idx} className="relative pl-4">
                                                <div className="absolute -left-[13px] top-0 w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-100"></div>
                                                <div className="font-semibold text-slate-800 text-xs">{tr.status}</div>
                                                <div className="text-[11px] text-slate-500">{tr.time} — <span className="text-slate-700">{tr.location}</span></div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-slate-400 italic">Belum ada riwayat tracking.</p>
                                    )}
                                </div>
                            </div>

                            {/* Items List */}
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm mb-2">📦 Isi Produk Paket</h4>
                                <div className="border rounded-xl overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-slate-500">
                                            <tr>
                                                <th className="p-2">Produk</th>
                                                <th className="p-2">Varian</th>
                                                <th className="p-2">Qty</th>
                                                <th className="p-2">Harga Beli</th>
                                                <th className="p-2 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {pkg.items.map((item, i) => (
                                                <tr key={i}>
                                                    <td className="p-2 font-medium">{item.name}</td>
                                                    <td className="p-2 text-slate-500">{item.variant}</td>
                                                    <td className="p-2 font-bold">{item.qty} pcs</td>
                                                    <td className="p-2">Rp{item.unitPrice.toLocaleString('id-ID')}</td>
                                                    <td className="p-2 text-right font-bold">Rp{item.subtotal.toLocaleString('id-ID')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Financial Breakdown */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                                <h4 className="font-bold text-slate-800 text-xs uppercase mb-2">Rincian Keuangan</h4>
                                {pkg.financials.voucherShopee && (
                                    <div className="flex justify-between text-purple-600"><span>Voucher Shopee:</span><span className="text-right">{pkg.financials.voucherShopee}</span></div>
                                )}
                                <div className="flex justify-between"><span>Total Harga Pesanan:</span><span>Rp{(pkg.financials.totalHargaPesanan ?? 0).toLocaleString('id-ID')}</span></div>
                                <div className="flex justify-between text-blue-600"><span>Ongkos Kirim:</span><span className="font-semibold">Gratis 🚚</span></div>
                                <div className="flex justify-between"><span>Metode Pembayaran:</span><span className="font-semibold">{pkg.financials.metodePembayaran}</span></div>
                                <div className="flex justify-between text-slate-500">
                                    <span>Fee Jasa CO{pkg.financials.jasaCoNama ? ` (${pkg.financials.jasaCoNama})` : ''}:</span>
                                    <span>+Rp{(pkg.financials.feeJasaCo ?? 0).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between font-bold text-slate-900 border-t pt-1 text-sm">
                                    <span>Total Modal:</span>
                                    <span className="text-rose-600">Rp{pkg.financials.totalModal.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t flex justify-between items-center gap-2">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onEditPackage && onEditPackage(pkg)}
                                    className="text-slate-700 hover:bg-slate-100 border border-slate-300 font-bold text-xs px-3.5 py-2 rounded-xl"
                                    title="Edit data paket ini (mis. koreksi nomor resi)"
                                >
                                    ✏️ Edit Paket
                                </button>
                                <button
                                    onClick={() => onDeletePackage && onDeletePackage(pkg)}
                                    className="text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold text-xs px-3.5 py-2 rounded-xl"
                                    title="Hapus paket ini beserta data terkaitnya"
                                >
                                    🗑️ Hapus Paket
                                </button>
                            </div>

                            <div className="flex items-center gap-2 ml-auto">
                                {pkg.financials.metodePembayaran === 'COD' && pkg.financials.codStatus !== 'Sudah dibayar' && (
                                    <button onClick={onMarkCodPaid} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl">
                                        ✓ Tandai COD Sudah Dibayar
                                    </button>
                                )}

                                {pkg.shipping.status === 'Berhasil Diterima' && !pkg.stockSynced && (
                                    <button onClick={onSyncStock} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl">
                                        + Masukkan Barang ke Stok Rumah
                                    </button>
                                )}

                                <button onClick={onClose} className="px-4 py-2 border rounded-xl bg-white font-medium text-xs">Tutup</button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

export default PackageDetailModal;
