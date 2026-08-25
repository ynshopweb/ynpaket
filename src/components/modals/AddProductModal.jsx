import React, { useState } from 'react';

function AddProductModal({ onClose, onSave }) {
            const [name, setName] = useState('');
            const [sku, setSku] = useState('');
            const [variant, setVariant] = useState('');
            const [stock, setStock] = useState(0);
            const [lastPrice, setLastPrice] = useState(0);

            const handleSubmit = (e) => {
                e.preventDefault();
                onSave({
                    id: 'prd-' + Date.now(),
                    name,
                    sku: sku || 'SKU-MANUAL',
                    category: 'Umum',
                    variant: variant || '-',
                    stock: Number(stock),
                    lastPrice: Number(lastPrice),
                    estHpp: Number(lastPrice),
                    minStock: 5
                });
            };

            return (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-md space-y-4 text-xs">
                        <h3 className="font-bold text-slate-900 text-base">Tambah Produk Stok Manual</h3>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="block font-medium mb-1">Nama Produk</label>
                                <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full border rounded p-2" required />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block font-medium mb-1">SKU Kode</label>
                                    <input type="text" value={sku} onChange={e=>setSku(e.target.value)} className="w-full border rounded p-2" />
                                </div>
                                <div>
                                    <label className="block font-medium mb-1">Varian</label>
                                    <input type="text" value={variant} onChange={e=>setVariant(e.target.value)} className="w-full border rounded p-2" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block font-medium mb-1">Jumlah Stok Awal</label>
                                    <input type="number" value={stock} onChange={e=>setStock(e.target.value)} className="w-full border rounded p-2" required />
                                </div>
                                <div>
                                    <label className="block font-medium mb-1">Harga Beli Satuan</label>
                                    <input type="number" value={lastPrice} onChange={e=>setLastPrice(e.target.value)} className="w-full border rounded p-2" required />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-2 pt-2">
                                <button type="button" onClick={onClose} className="px-3 py-1.5 border rounded">Batal</button>
                                <button type="submit" className="px-4 py-1.5 bg-rose-500 text-white font-bold rounded">Simpan Produk</button>
                            </div>
                        </form>
                    </div>
                </div>
            );
        }

export default AddProductModal;
