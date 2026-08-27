import React, { useState } from 'react';
import { PACKAGE_STATUSES } from '../../constants/packageStatus';

// Form Edit Paket — dipakai untuk mengoreksi data paket yang SUDAH tersimpan
// (salah ketik resi, salah pilih akun/jasa CO, salah jumlah/harga barang, dll).
// Berbeda dari NewPurchaseModal: modal ini TIDAK PERNAH mereset status
// pengiriman, riwayat tracking, atau "stockSynced" — semua itu murni
// dikendalikan lewat fitur "Ubah Status Manual" / update tracking API,
// supaya histori paket tetap konsisten walau datanya diedit.
function EditPackageModal({ pkg, shopeeAccounts, products, jasaCoList = [], onClose, onSave, onManualStatusChange }) {
            const [checkoutDate, setCheckoutDate] = useState(pkg.checkoutDate || new Date().toISOString().substring(0, 10));
            const [shopeeOrderId, setShopeeOrderId] = useState(pkg.shopeeOrderId || '');

            const [sumberCheckout, setSumberCheckout] = useState(pkg.jasaCoId ? 'jasaco' : 'akun');
            const [shopeeAccountId, setShopeeAccountId] = useState(pkg.shopeeAccountId || '');
            const [jasaCoId, setJasaCoId] = useState(pkg.jasaCoId || '');

            React.useEffect(() => {
                if (sumberCheckout === 'akun') {
                    setJasaCoId('');
                    setFeeJasaCo(0);
                    setFeeJasaCoTouched(false);
                } else {
                    setShopeeAccountId('');
                }
                // eslint-disable-next-line react-hooks/exhaustive-deps
            }, [sumberCheckout]);

            // Isi Barang
            const [items, setItems] = useState(
                pkg.items && pkg.items.length > 0
                    ? pkg.items.map(it => ({ ...it }))
                    : [{ productId: '', name: '', sku: '', variant: '', qty: 1, unitPrice: 0, subtotal: 0 }]
            );

            const selectedJasaCo = jasaCoList.find(j => j.id === jasaCoId);
            const linkedJasaCoNama = sumberCheckout === 'jasaco' ? (selectedJasaCo?.nama || '') : '';

            // Keuangan
            const [voucherShopee, setVoucherShopee] = useState(pkg.financials?.voucherShopee || '');
            const [totalHargaPesanan, setTotalHargaPesanan] = useState(pkg.financials?.totalHargaPesanan ?? 0);
            const presetOptions = ['COD', 'ShopeePay', 'Transfer', 'SPayLater'];
            const initialMetode = pkg.financials?.metodePembayaran || 'COD';
            const [metodePembayaranPreset, setMetodePembayaranPreset] = useState(
                presetOptions.includes(initialMetode) ? initialMetode : 'Lainnya'
            );
            const [metodePembayaranLainnya, setMetodePembayaranLainnya] = useState(
                presetOptions.includes(initialMetode) ? '' : initialMetode
            );
            const [codStatus, setCodStatus] = useState(pkg.financials?.codStatus || 'Belum dibayar');
            const [feeJasaCo, setFeeJasaCo] = useState(pkg.financials?.feeJasaCo ?? 0);
            const [feeJasaCoTouched, setFeeJasaCoTouched] = useState(true); // jangan auto-timpa nilai fee yang sudah tersimpan

            React.useEffect(() => {
                if (sumberCheckout === 'jasaco' && !feeJasaCoTouched) {
                    setFeeJasaCo(selectedJasaCo?.biaya || 0);
                }
                // eslint-disable-next-line react-hooks/exhaustive-deps
            }, [jasaCoId]);

            // Ekspedisi & Resi — bagian paling sering perlu dikoreksi
            const [courier, setCourier] = useState(pkg.shipping?.courier || 'SPX Express');
            const [resi, setResi] = useState(pkg.shipping?.resi || '');

            // Ubah Status Manual (opsional, langsung tersimpan lewat tombolnya sendiri)
            const [selectedStatus, setSelectedStatus] = useState('');
            const [statusNote, setStatusNote] = useState('');
            const [savingStatus, setSavingStatus] = useState(false);
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

            // Item handlers
            const handleItemChange = (index, field, val) => {
                const updated = [...items];
                updated[index][field] = val;
                if (field === 'productId') {
                    const sel = products.find(p => p.id === val);
                    if (sel) {
                        updated[index].name = sel.name;
                        updated[index].sku = sel.sku;
                        updated[index].variant = sel.variant;
                        updated[index].unitPrice = sel.lastPrice;
                    }
                }
                const qty = Number(updated[index].qty) || 0;
                const price = Number(updated[index].unitPrice) || 0;
                updated[index].subtotal = qty * price;
                setItems(updated);
            };

            const addItemRow = () => {
                setItems([...items, { productId: '', name: '', sku: '', variant: '', qty: 1, unitPrice: 0, subtotal: 0 }]);
            };

            const removeItemRow = (idx) => {
                if (items.length > 1) {
                    setItems(items.filter((_, i) => i !== idx));
                }
            };

            // Kalkulasi total
            const itemsTotal = items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
            const isCod = metodePembayaranPreset === 'COD';
            const metodePembayaranFinal = metodePembayaranPreset === 'Lainnya'
                ? (metodePembayaranLainnya || 'Lainnya')
                : metodePembayaranPreset;
            const totalModal = Math.max(0, Number(totalHargaPesanan || 0) + Number(feeJasaCo || 0));

            const handleSubmit = (e) => {
                e.preventDefault();
                // Hanya field yang memang bisa dikoreksi lewat form ini — status
                // pengiriman, riwayat tracking, dan stockSynced SENGAJA tidak disentuh.
                const updatedFields = {
                    checkoutDate,
                    shopeeOrderId: shopeeOrderId || 'PENDING-ID',
                    shopeeAccountId: sumberCheckout === 'akun' ? (shopeeAccountId || null) : null,
                    jasaCoId: sumberCheckout === 'jasaco' ? (jasaCoId || null) : null,
                    items,
                    financials: {
                        itemsTotal,
                        voucherShopee,
                        totalHargaPesanan: Number(totalHargaPesanan || 0),
                        metodePembayaran: metodePembayaranFinal,
                        jasaCoNama: linkedJasaCoNama,
                        feeJasaCo: Number(feeJasaCo || 0),
                        totalModal,
                        codStatus: isCod ? codStatus : 'Sudah dibayar'
                    },
                    'shipping.courier': courier,
                    'shipping.resi': resi,
                };
                onSave(updatedFields);
            };

            return (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
                        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-base">✏️ Edit Paket {pkg.id}</h3>
                                <p className="text-xs text-slate-400">Order Shopee: {pkg.shopeeOrderId}</p>
                            </div>
                            <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                            {/* Section 1: Informasi Checkout */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b pb-1">1. Informasi Checkout</h4>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                    <div>
                                        <label className="block font-medium text-slate-700 mb-1">Tanggal Checkout</label>
                                        <input type="date" value={checkoutDate} onChange={e=>setCheckoutDate(e.target.value)} className="w-full border rounded-lg p-2" required />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block font-medium text-slate-700 mb-1">Sumber Checkout</label>
                                        <div className="flex rounded-lg border overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => setSumberCheckout('akun')}
                                                disabled={shopeeAccounts.length === 0}
                                                className={`flex-1 px-2 py-1.5 font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${sumberCheckout === 'akun' ? 'bg-rose-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                🏪 Akun Shopee Sendiri
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setSumberCheckout('jasaco')}
                                                disabled={jasaCoList.length === 0}
                                                className={`flex-1 px-2 py-1.5 font-semibold transition-colors border-l disabled:opacity-40 disabled:cursor-not-allowed ${sumberCheckout === 'jasaco' ? 'bg-rose-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                🤝 Pakai Jasa CO
                                            </button>
                                        </div>

                                        <div className="mt-2">
                                            {sumberCheckout === 'akun' ? (
                                                <select value={shopeeAccountId} onChange={e=>setShopeeAccountId(e.target.value)} className="w-full border rounded-lg p-2" required>
                                                    <option value="">— Pilih Akun Shopee —</option>
                                                    {shopeeAccounts.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                                                </select>
                                            ) : (
                                                <select value={jasaCoId} onChange={e=>{ setJasaCoId(e.target.value); setFeeJasaCoTouched(false); }} className="w-full border rounded-lg p-2" required>
                                                    <option value="">— Pilih Jasa CO —</option>
                                                    {jasaCoList.map(j => <option key={j.id} value={j.id}>{j.nama}</option>)}
                                                </select>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">Paket hanya memakai salah satu: Akun Shopee sendiri, atau lewat Jasa CO — tidak bisa keduanya sekaligus.</p>
                                    </div>
                                    <div>
                                        <label className="block font-medium text-slate-700 mb-1">No. Pesanan Shopee</label>
                                        <input type="text" placeholder="Contoh: 250825XXXX" value={shopeeOrderId} onChange={e=>setShopeeOrderId(e.target.value)} className="w-full border rounded-lg p-2 font-mono" required />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Isi Paket */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between border-b pb-1">
                                    <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">2. Isi Barang / Produk Paket</h4>
                                    <button type="button" onClick={addItemRow} className="bg-rose-50 text-rose-600 font-bold px-2 py-1 rounded hover:bg-rose-100">+ Tambah Barang</button>
                                </div>
                                <div className="space-y-2">
                                    {items.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 items-center">
                                            <div className="col-span-4">
                                                <input type="text" placeholder="Nama Produk" value={item.name} onChange={e=>handleItemChange(idx,'name',e.target.value)} className="w-full border rounded p-1.5" required />
                                            </div>
                                            <div className="col-span-2">
                                                <input type="text" placeholder="Varian/Warna" value={item.variant} onChange={e=>handleItemChange(idx,'variant',e.target.value)} className="w-full border rounded p-1.5" />
                                            </div>
                                            <div className="col-span-2">
                                                <input type="number" placeholder="Qty" min="1" value={item.qty} onChange={e=>handleItemChange(idx,'qty',e.target.value)} className="w-full border rounded p-1.5" required />
                                            </div>
                                            <div className="col-span-2">
                                                <input type="number" placeholder="Harga Satuan" value={item.unitPrice} onChange={e=>handleItemChange(idx,'unitPrice',e.target.value)} className="w-full border rounded p-1.5" required />
                                            </div>
                                            <div className="col-span-1 font-bold text-slate-800">
                                                Rp{Number(item.subtotal || 0).toLocaleString('id-ID')}
                                            </div>
                                            <div className="col-span-1 text-right">
                                                {items.length > 1 && (
                                                    <button type="button" onClick={()=>removeItemRow(idx)} className="text-red-500 font-bold">✕</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Section 3: Keuangan Shopee & Pembayaran */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b pb-1">3. Biaya Shopee & Metode Pembayaran</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                                    <div>
                                        <label className="block font-medium text-slate-700 mb-1">Voucher Shopee</label>
                                        <input
                                            type="text"
                                            placeholder='Contoh: "25% MAX Rp100.000"'
                                            value={voucherShopee}
                                            onChange={e=>setVoucherShopee(e.target.value)}
                                            className="w-full border rounded p-1.5"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">Hanya catatan/informasi. Tidak memengaruhi perhitungan Total Modal.</p>
                                    </div>
                                    <div>
                                        <label className="block font-medium text-slate-700 mb-1">Total Harga Pesanan (Rp)</label>
                                        <input
                                            type="number"
                                            placeholder="Sesuai tampilan di Shopee"
                                            value={totalHargaPesanan}
                                            onChange={e=>setTotalHargaPesanan(e.target.value)}
                                            className="w-full border rounded p-1.5"
                                            required
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">Masukkan nominal akhir pesanan sesuai Shopee (setelah voucher, dsb).</p>
                                    </div>
                                    <div className="flex items-center space-x-1.5 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5 md:col-span-2">
                                        <span>🚚</span>
                                        <span className="text-[11px] font-medium">Gratis Ongkir dari Shopee — tidak ada biaya ongkos kirim yang perlu dicatat.</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block font-medium text-slate-700 mb-1">Metode Pembayaran</label>
                                        <select value={metodePembayaranPreset} onChange={e=>setMetodePembayaranPreset(e.target.value)} className="w-full border rounded p-2">
                                            <option value="COD">COD (Bayar di Tempat)</option>
                                            <option value="ShopeePay">ShopeePay</option>
                                            <option value="Transfer">Transfer</option>
                                            <option value="SPayLater">SPayLater</option>
                                            <option value="Lainnya">Lainnya</option>
                                        </select>
                                    </div>
                                    {metodePembayaranPreset === 'Lainnya' && (
                                        <div>
                                            <label className="block font-medium text-slate-700 mb-1">Metode Pembayaran (Tulis Sendiri)</label>
                                            <input
                                                type="text"
                                                placeholder="Tulis metode pembayaran..."
                                                value={metodePembayaranLainnya}
                                                onChange={e=>setMetodePembayaranLainnya(e.target.value)}
                                                className="w-full border rounded p-2"
                                                required
                                            />
                                        </div>
                                    )}
                                    {isCod && (
                                        <div>
                                            <label className="block font-medium text-slate-700 mb-1">Status COD</label>
                                            <select value={codStatus} onChange={e=>setCodStatus(e.target.value)} className="w-full border rounded p-2">
                                                <option value="Belum dibayar">Belum dibayar</option>
                                                <option value="Sudah dibayar">Sudah dibayar</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {sumberCheckout === 'jasaco' && (
                                        <div>
                                            <label className="block font-medium text-slate-700 mb-1">
                                                Fee Jasa CO (Rp) {linkedJasaCoNama && <span className="text-rose-500 font-normal">— {linkedJasaCoNama}</span>}
                                            </label>
                                            <input
                                                type="number"
                                                value={feeJasaCo}
                                                onChange={e => { setFeeJasaCo(e.target.value); setFeeJasaCoTouched(true); }}
                                                className="w-full border rounded p-1.5"
                                            />
                                            {selectedJasaCo?.biaya > 0 && (
                                                <p className="text-[10px] text-slate-400 mt-1">
                                                    Fee default: Rp{Number(selectedJasaCo.biaya).toLocaleString('id-ID')} — bisa diubah khusus untuk transaksi ini saja.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    <div className={`${sumberCheckout === 'jasaco' ? 'md:col-span-2' : 'md:col-span-3'} bg-slate-900 text-white p-2.5 rounded-xl flex flex-col justify-center`}>
                                        <span className="text-[10px] text-slate-400">Total Modal (Total Harga Pesanan + Fee Jasa CO):</span>
                                        <span className="text-base font-bold text-rose-400">Rp{totalModal.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Pengiriman */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b pb-1">4. Ekspedisi & Resi</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-medium text-slate-700 mb-1">Kurir / Ekspedisi</label>
                                        <select value={courier} onChange={e=>setCourier(e.target.value)} className="w-full border rounded p-2">
                                            <option value="SPX Express">SPX Express (Shopee Xpress)</option>
                                            <option value="J&T Express">J&T Express</option>
                                            <option value="JNE">JNE</option>
                                            <option value="SiCepat">SiCepat</option>
                                            <option value="AnterAja">AnterAja</option>
                                            <option value="ID Express">ID Express</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-medium text-slate-700 mb-1">Nomor Resi</label>
                                        <input type="text" placeholder="Masukkan nomor resi..." value={resi} onChange={e=>setResi(e.target.value)} className="w-full border rounded p-2 font-mono uppercase" />
                                        <p className="text-[10px] text-slate-400 mt-1">Mengganti resi di sini TIDAK mengubah status pengiriman secara otomatis.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 5: Ubah Status Manual (opsional, tersimpan langsung) */}
                            {onManualStatusChange && (
                                <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 space-y-2">
                                    <h4 className="font-bold text-slate-800 text-sm">✋ Ubah Status Manual</h4>
                                    <p className="text-[11px] text-slate-500">
                                        Status saat ini: <strong>{pkg.shipping?.status}</strong>{pkg.shipping?.statusSource === 'manual' ? ' (dikunci manual)' : ''}.
                                        Bagian ini langsung tersimpan begitu tombol "Simpan Status" diklik — terpisah dari tombol "Simpan Perubahan" di bawah.
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
                                            placeholder="Catatan (opsional)"
                                            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 flex-[2] focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleSaveStatus}
                                            disabled={!selectedStatus || savingStatus}
                                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs px-4 py-2 rounded-lg whitespace-nowrap"
                                        >
                                            {savingStatus ? 'Menyimpan...' : 'Simpan Status'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t flex justify-end space-x-2">
                                <button type="button" onClick={onClose} className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-medium">Batal</button>
                                <button type="submit" className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-sm">💾 Simpan Perubahan</button>
                            </div>
                        </form>
                    </div>
                </div>
            );
        }

export default EditPackageModal;
