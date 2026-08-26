import React, { useState } from 'react';

function AddAccountModal({ onClose, onSave, jasaCoList = [], initial = null }) {
            const isEdit = !!initial;
            const [label, setLabel] = useState(initial?.label || '');
            const [username, setUsername] = useState(initial?.username || '');
            const [phone, setPhone] = useState(initial?.phone || '');
            const [note, setNote] = useState(initial?.note || '');
            const [jasaCoId, setJasaCoId] = useState(initial?.jasaCoId || '');

            const handleSubmit = (e) => {
                e.preventDefault();
                const selectedJasaCo = jasaCoList.find(j => j.id === jasaCoId);
                onSave({
                    id: initial?.id || ('acc-' + Date.now()),
                    label,
                    username,
                    phone,
                    status: initial?.status || 'Aktif',
                    note,
                    jasaCoId: jasaCoId || null,
                    jasaCoNama: selectedJasaCo ? selectedJasaCo.nama : '',
                    feeJasaCoDefault: selectedJasaCo ? Number(selectedJasaCo.biaya) || 0 : 0
                });
            };

            return (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-md space-y-4 text-xs my-8">
                        <h3 className="font-bold text-slate-900 text-base">{isEdit ? 'Edit Akun Shopee (Akun CO)' : 'Tambah Label Akun Shopee Baru'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="block font-medium mb-1">Nama / Label Akun (misal: Shopee Utama)</label>
                                <input type="text" value={label} onChange={e=>setLabel(e.target.value)} className="w-full border rounded p-2" required />
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Username Shopee</label>
                                <input type="text" value={username} onChange={e=>setUsername(e.target.value)} className="w-full border rounded p-2" required />
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Nomor HP Akun (Opsional)</label>
                                <input type="text" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full border rounded p-2" />
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Jasa CO (Opsional)</label>
                                <select value={jasaCoId} onChange={e=>setJasaCoId(e.target.value)} className="w-full border rounded p-2">
                                    <option value="">— Tidak terkait Jasa CO —</option>
                                    {jasaCoList.map(j => (
                                        <option key={j.id} value={j.id}>{j.nama}{j.biaya ? ` (Fee default Rp${Number(j.biaya).toLocaleString('id-ID')})` : ''}</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-slate-400 mt-1">Jika akun ini dipakai oleh Jasa CO tertentu, fee default-nya akan otomatis terisi saat membuat pembelian baru (tetap bisa diubah per transaksi).</p>
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Catatan</label>
                                <textarea value={note} onChange={e=>setNote(e.target.value)} className="w-full border rounded p-2"></textarea>
                            </div>
                            <div className="flex justify-end space-x-2 pt-2">
                                <button type="button" onClick={onClose} className="px-3 py-1.5 border rounded">Batal</button>
                                <button type="submit" className="px-4 py-1.5 bg-rose-500 text-white font-bold rounded">{isEdit ? 'Simpan Perubahan' : 'Simpan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            );
        }

export default AddAccountModal;
