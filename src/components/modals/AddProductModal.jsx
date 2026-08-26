import React, { useState } from 'react';

function AddProductModal({ onClose, onSave, initial = null }) {
            const isEdit = !!initial;
            const [name, setName] = useState(initial?.name || '');
            const [sku, setSku] = useState(initial?.sku || '');
            const [variant, setVariant] = useState(initial?.variant || '');
            const [stock, setStock] = useState(initial?.stock ?? 0);
            const [lastPrice, setLastPrice] = useState(initial?.lastPrice ?? 0);
            const [minStock, setMinStock] = useState(initial?.minStock ?? 5);

            const handleSubmit = (e) => {
                e.preventDefault();
                onSave({
                    id: initial?.id || ('prd-' + Date.now()),
                    name,
                    sku: sku || 'SKU-MANUAL',
                    category: initial?.category || 'Umum',
                    variant: variant || '-',
                    stock: Number(stock),
                    lastPrice: Number(lastPrice),
                    estHpp: isEdit ? (initial.estHpp ?? Number(lastPrice)) : Number(lastPrice),
                    minStock: Number(minStock)
                });
            };

            return (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-md space-y-4 text-xs my-8">
                        <h3 className="font-bold text-slate-900 text-base">{isEdit ? 'Edit Produk' : 'Tambah Produk Stok Manual'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="block font-medium mb-1">Nama Produk</label>
                                <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full border rounded p-2" required />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                    <label className="block font-medium mb-1">SKU Kode</label>
                                    <input type="text" value={sku} onChange={e=>setSku(e.target.value)} className="w-full border rounded p-2" />
                                </div>
                                <div>
                                    <label className="block font-medium mb-1">Varian</label>
                                    <input type="text" value={variant} onChange={e=>setVariant(e.target.value)} className="w-full border rounded p-2" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                    <label className="block font-medium mb-1">{isEdit ? 'Jumlah Stok' : 'Jumlah Stok Awal'}</label>
                                    <input type="number" value={stock} onChange={e=>setStock(e.target.value)} className="w-full border rounded p-2" required />
                                </div>
                                <div>
                                    <label className="block font-medium mb-1">Harga Beli Satuan</label>
                                    <input type="number" value={lastPrice} onChange={e=>setLastPrice(e.target.value)} className="w-full border rounded p-2" required />
                                </div>
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Stok Minimum (Peringatan Menipis)</label>
                                <input type="number" value={minStock} onChange={e=>setMinStock(e.target.value)} className="w-full border rounded p-2" />
                            </div>
                            <div className="flex justify-end space-x-2 pt-2">
                                <button type="button" onClick={onClose} className="px-3 py-1.5 border rounded">Batal</button>
                                <button type="submit" className="px-4 py-1.5 bg-rose-500 text-white font-bold rounded">{isEdit ? 'Simpan Perubahan' : 'Simpan Produk'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            );
        }

export default AddProductModal;
