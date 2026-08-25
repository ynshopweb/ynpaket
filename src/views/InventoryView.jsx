import React from 'react';

function InventoryView({ products, packages, onOpenAddModal, onSyncStock }) {
            const pendingPackages = packages.filter(p => p.shipping.status === 'Berhasil diterima' && !p.stockSynced);

            return (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-bold text-slate-900 text-xl">Stok Barang / Produk Rumah</h2>
                            <p className="text-slate-500 text-sm">Produk hasil belanja Shopee yang siap dijual kembali.</p>
                        </div>
                        <button 
                            onClick={onOpenAddModal}
                            className="bg-rose-500 hover:bg-rose-600 text-white font-medium text-xs px-3.5 py-2 rounded-xl shadow-sm"
                        >
                            + Tambah Produk Manual
                        </button>
                    </div>

                    {/* Pending Sync Section */}
                    {pendingPackages.length > 0 && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                            <h3 className="font-bold text-emerald-900 text-sm mb-2">📥 Paket Sudah Diterima — Siap Tambah ke Stok</h3>
                            <div className="space-y-2">
                                {pendingPackages.map(pkg => (
                                    <div key={pkg.id} className="bg-white p-3 rounded-xl border border-emerald-100 flex items-center justify-between">
                                        <div>
                                            <span className="font-bold text-slate-800 text-xs">{pkg.id}</span>
                                            <span className="text-xs text-slate-500 ml-2">({pkg.items.map(i => `${i.qty}x ${i.name}`).join(', ')})</span>
                                        </div>
                                        <button 
                                            onClick={() => onSyncStock(pkg)}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
                                        >
                                            + Masukkan ke Stok
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Product Stock Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-200">
                                    <tr>
                                        <th className="p-3.5">Nama Produk</th>
                                        <th className="p-3.5">SKU / Kode</th>
                                        <th className="p-3.5">Varian</th>
                                        <th className="p-3.5">Stok Saat Ini</th>
                                        <th className="p-3.5">Harga Beli Terakhir</th>
                                        <th className="p-3.5">Estimasi HPP (Modal)</th>
                                        <th className="p-3.5">Status Stok</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {products.map(prod => (
                                        <tr key={prod.id} className="hover:bg-slate-50">
                                            <td className="p-3.5 font-bold text-slate-900">{prod.name}</td>
                                            <td className="p-3.5 font-mono text-xs text-slate-500">{prod.sku}</td>
                                            <td className="p-3.5 text-xs text-slate-600">{prod.variant}</td>
                                            <td className="p-3.5 font-bold text-slate-800 text-base">{prod.stock} Pcs</td>
                                            <td className="p-3.5 text-slate-700">Rp{prod.lastPrice.toLocaleString('id-ID')}</td>
                                            <td className="p-3.5 font-semibold text-rose-600">Rp{prod.estHpp.toLocaleString('id-ID')}</td>
                                            <td className="p-3.5">
                                                {prod.stock <= prod.minStock ? (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">Menipis</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Aman</span>
                                                )}
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

export default InventoryView;
