import React, { useState } from 'react';

function AddAccountModal({ onClose, onSave }) {
            const [label, setLabel] = useState('');
            const [username, setUsername] = useState('');
            const [phone, setPhone] = useState('');
            const [note, setNote] = useState('');

            const handleSubmit = (e) => {
                e.preventDefault();
                onSave({
                    id: 'acc-' + Date.now(),
                    label,
                    username,
                    phone,
                    status: 'Aktif',
                    note
                });
            };

            return (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-md space-y-4 text-xs">
                        <h3 className="font-bold text-slate-900 text-base">Tambah Label Akun Shopee Baru</h3>
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
                                <label className="block font-medium mb-1">Catatan</label>
                                <textarea value={note} onChange={e=>setNote(e.target.value)} className="w-full border rounded p-2"></textarea>
                            </div>
                            <div className="flex justify-end space-x-2 pt-2">
                                <button type="button" onClick={onClose} className="px-3 py-1.5 border rounded">Batal</button>
                                <button type="submit" className="px-4 py-1.5 bg-rose-500 text-white font-bold rounded">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            );
        }

export default AddAccountModal;
