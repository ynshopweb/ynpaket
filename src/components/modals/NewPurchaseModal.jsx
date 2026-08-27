import React, { useState } from 'react';

function NewPurchaseModal({ shopeeAccounts, products, jasaCoList = [], onClose, onSave }) {
            const [checkoutDate, setCheckoutDate] = useState(new Date().toISOString().substring(0, 10));
            const [shopeeOrderId, setShopeeOrderId] = useState('');

            // Paket hanya boleh memakai SALAH SATU sumber checkout:
            // - 'akun'   -> pakai Akun Shopee sendiri
            // - 'jasaco' -> checkout lewat Jasa CO (titip beli/open order)
            // Keduanya tidak pernah tampil/terisi bersamaan.
            const [sumberCheckout, setSumberCheckout] = useState(shopeeAccounts.length > 0 ? 'akun' : 'jasaco');
            const [shopeeAccountId, setShopeeAccountId] = useState(shopeeAccounts[0]?.id || '');
            const [jasaCoId, setJasaCoId] = useState('');

            // Saat sumber checkout diganti, kosongkan field milik mode yang tidak
            // sedang aktif supaya tidak ada data "nyangkut" dari mode sebelumnya.
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
            
            // Recipient Address
            const [recipientName, setRecipientName] = useState('Gudang Utama (Rumah)');
            const [recipientPhone, setRecipientPhone] = useState('081200001111');
            const [recipientAddress, setRecipientAddress] = useState('Jl. Merdeka No. 45');
            const [recipientDistrict, setRecipientDistrict] = useState('Ciputat');
            const [recipientCity, setRecipientCity] = useState('Tangerang Selatan');
            const [recipientProvince, setRecipientProvince] = useState('Banten');
            const [recipientPostalCode, setRecipientPostalCode] = useState('15411');

            // Items List
            const [items, setItems] = useState([
                { productId: '', name: '', sku: '', variant: '', qty: 1, unitPrice: 0, subtotal: 0 }
            ]);

            const selectedJasaCo = jasaCoList.find(j => j.id === jasaCoId);
            const linkedJasaCoNama = sumberCheckout === 'jasaco' ? (selectedJasaCo?.nama || '') : '';

            // Financials
            const [voucherShopee, setVoucherShopee] = useState(''); // teks informasi saja, tidak dihitung
            const [totalHargaPesanan, setTotalHargaPesanan] = useState(0); // nominal manual sesuai tampilan Shopee
            const [metodePembayaranPreset, setMetodePembayaranPreset] = useState('COD');
            const [metodePembayaranLainnya, setMetodePembayaranLainnya] = useState('');
            const [codStatus, setCodStatus] = useState('Belum dibayar');
            const [feeJasaCo, setFeeJasaCo] = useState(0);
            const [feeJasaCoTouched, setFeeJasaCoTouched] = useState(false);

            // Saat Jasa CO berganti (hanya relevan saat sumber checkout = 'jasaco'),
            // auto-isi Fee Jasa CO dari biaya default-nya, kecuali sudah diedit manual
            // oleh user khusus untuk transaksi ini.
            React.useEffect(() => {
                if (sumberCheckout === 'jasaco' && !feeJasaCoTouched) {
                    setFeeJasaCo(selectedJasaCo?.biaya || 0);
                }
                // eslint-disable-next-line react-hooks/exhaustive-deps
            }, [jasaCoId]);

            // Shipping
            const [courier, setCourier] = useState('SPX Express');
            const [resi, setResi] = useState('');

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

            // Calculate Totals
            const itemsTotal = items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
            const isCod = metodePembayaranPreset === 'COD';
            const metodePembayaranFinal = metodePembayaranPreset === 'Lainnya'
                ? (metodePembayaranLainnya || 'Lainnya')
                : metodePembayaranPreset;
            // Total Modal = Total Harga Pesanan + Fee Jasa CO (Voucher TIDAK dihitung)
            const totalModal = Math.max(0, Number(totalHargaPesanan || 0) + Number(feeJasaCo || 0));

            const handleSubmit = (e) => {
                e.preventDefault();
                const newPkg = {
                    id: `YN-${new Date().toISOString().substring(0,10).replace(/-/g,'')}-${Math.floor(100 + Math.random() * 900)}`,
                    shopeeOrderId: shopeeOrderId || 'PENDING-ID',
                    checkoutDate,
                    shopeeAccountId: sumberCheckout === 'akun' ? (shopeeAccountId || null) : null,
                    jasaCoId: sumberCheckout === 'jasaco' ? (jasaCoId || null) : null,
                    recipient: {
                        name: recipientName,
                        phone: recipientPhone,
                        address: recipientAddress,
                        district: recipientDistrict,
                        city: recipientCity,
                        province: recipientProvince,
                        postalCode: recipientPostalCode
                    },
                    items,
                    financials: {
                        itemsTotal,
                        voucherShopee, // string informasi, tidak mempengaruhi perhitungan
                        totalHargaPesanan: Number(totalHargaPesanan || 0),
                        metodePembayaran: metodePembayaranFinal,
                        jasaCoNama: linkedJasaCoNama,
                        feeJasaCo: Number(feeJasaCo || 0),
                        totalModal,
                        codStatus: isCod ? codStatus : 'Sudah dibayar'
                    },
                    shipping: {
                        courier,
                        resi,
                        status: resi ? 'Dikirim' : 'Dikemas',
                        lastLocation: 'Order dibuat',
                        lastUpdate: new Date().toISOString().substring(0, 16)
                    },
                    trackingHistory: [
                        { time: new Date().toISOString().substring(0, 16), location: 'Shopee System', status: 'Pesanan dibuat di Shopee' }
                    ],
                    stockSynced: false
                };
                onSave(newPkg);
            };

            return (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
                        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                            <h3 className="font-bold text-base">➕ Tambah Pembelian Stok Shopee Baru</h3>
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
                                                Rp{item.subtotal.toLocaleString('id-ID')}
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
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t flex justify-end space-x-2">
                                <button type="button" onClick={onClose} className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-medium">Batal</button>
                                <button type="submit" className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-sm">Simpan Pembelian</button>
                            </div>
                        </form>
                    </div>
                </div>
            );
        }

export default NewPurchaseModal;
