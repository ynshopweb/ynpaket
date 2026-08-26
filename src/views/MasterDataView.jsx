import React, { useEffect, useState } from 'react';
import { COLLECTIONS, addItem, updateItem, removeItem } from '../services/firestoreService';

// Ubah nomor HP Indonesia (0812..., +62812..., 62812...) menjadi format link wa.me
function toWhatsAppLink(rawNumber) {
  if (!rawNumber) return null;
  let digits = String(rawNumber).replace(/[^\d]/g, '');
  if (!digits) return null;
  if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1);
  } else if (!digits.startsWith('62')) {
    digits = '62' + digits;
  }
  return `https://wa.me/${digits}`;
}

// Definisi tab & field masing-masing jenis master data
const ENTITIES = {
  jasaCo: {
    label: 'Jasa CO',
    collection: COLLECTIONS.jasaCo,
    icon: '🧾',
    fields: [
      { key: 'nama', label: 'Nama Jasa', placeholder: 'cth. Jastip Checkout Reguler' },
      { key: 'biaya', label: 'Biaya Jasa (Rp)', placeholder: '5000', type: 'number' },
      { key: 'whatsapp', label: 'Nomor WhatsApp', placeholder: '081234567890', type: 'tel' },
      { key: 'keterangan', label: 'Keterangan', placeholder: 'Opsional' },
    ],
  },
  alamat: {
    label: 'Alamat',
    collection: COLLECTIONS.alamat,
    icon: '📍',
    fields: [
      { key: 'label', label: 'Label Alamat', placeholder: 'cth. Gudang Utama / Rumah' },
      { key: 'penerima', label: 'Nama Penerima', placeholder: 'Nama' },
      { key: 'telepon', label: 'No. Telepon', placeholder: '08xxxxxxxxxx' },
      { key: 'alamatLengkap', label: 'Alamat Lengkap', placeholder: 'Jalan, kota, kode pos' },
    ],
  },
  kurir: {
    label: 'Kurir',
    collection: COLLECTIONS.kurir,
    icon: '🚚',
    fields: [
      { key: 'nama', label: 'Nama Kurir', placeholder: 'cth. JNE, J&T, SPX, SiCepat' },
      { key: 'kodeTracking', label: 'Kode Provider Tracking', placeholder: 'cth. jne, jnt, spx' },
      { key: 'whatsapp', label: 'Nomor WhatsApp Kurir', placeholder: '081234567890', type: 'tel' },
    ],
  },
  kantorKurir: {
    label: 'Lokasi Kurir',
    collection: COLLECTIONS.kantorKurir,
    icon: '🏢',
    fields: [
      { key: 'nama', label: 'Nama Kantor/Agen/Hub', placeholder: 'cth. Hub JNE Cempaka Putih' },
      { key: 'kurir', label: 'Kurir Terkait', placeholder: 'cth. JNE' },
      { key: 'alamat', label: 'Alamat', placeholder: 'Alamat kantor/agen/hub' },
      { key: 'telepon', label: 'No. Telepon', placeholder: '0xx-xxxx-xxxx' },
    ],
  },
};

function MasterDataView({ data, showToast, initialEntity }) {
  const [activeEntity, setActiveEntity] = useState(initialEntity && ENTITIES[initialEntity] ? initialEntity : 'jasaCo');
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = mode tambah, id = mode edit

  // Jika dibuka lewat menu mobile dengan tujuan entitas tertentu, langsung buka tab-nya
  useEffect(() => {
    if (initialEntity && ENTITIES[initialEntity]) {
      setActiveEntity(initialEntity);
      setForm({});
      setEditingId(null);
    }
  }, [initialEntity]);

  const entity = ENTITIES[activeEntity];
  const items = data[activeEntity] || [];

  const handleChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const startEdit = (item) => {
    setEditingId(item.id);
    const next = {};
    entity.fields.forEach((f) => { next[f.key] = item[f.key] ?? ''; });
    setForm(next);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasContent = entity.fields.some((f) => (form[f.key] || '').toString().trim());
    if (!hasContent) {
      showToast('Isi minimal satu data sebelum menyimpan.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateItem(entity.collection, editingId, { ...form });
        showToast(`${entity.label} berhasil diperbarui!`);
        setEditingId(null);
      } else {
        await addItem(entity.collection, { ...form });
        showToast(`${entity.label} berhasil disimpan!`);
      }
      setForm({});
    } catch (err) {
      console.error(err);
      showToast(`Gagal menyimpan ${entity.label}.`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await removeItem(entity.collection, id);
      if (editingId === id) cancelEdit();
      showToast(`${entity.label} berhasil dihapus.`);
    } catch (err) {
      console.error(err);
      showToast(`Gagal menghapus ${entity.label}.`, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div>
        <h2 className="font-bold text-slate-900 text-xl">Master Data</h2>
        <p className="text-slate-500 text-sm">Kelola Jasa CO, Alamat, Kurir, dan Lokasi Kurir. Semua data tersimpan di Firestore.</p>
      </div>

      {/* Tabs entitas */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(ENTITIES).map(([key, val]) => (
          <button
            key={key}
            onClick={() => { setActiveEntity(key); setForm({}); setEditingId(null); }}
            className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors flex items-center gap-1.5 min-h-[40px] ${
              activeEntity === key
                ? 'bg-rose-500 border-rose-500 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{val.icon}</span>
            <span>{val.label}</span>
          </button>
        ))}
      </div>

      {/* Form tambah / edit */}
      <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 text-sm">{editingId ? `Edit ${entity.label}` : `Tambah ${entity.label}`}</h3>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="text-xs text-slate-400 hover:text-slate-600">
              Batal Edit
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {entity.fields.map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">{f.label}</label>
              <input
                type={f.type || 'text'}
                placeholder={f.placeholder}
                value={form[f.key] || ''}
                onChange={(e) => handleChange(f.key, e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-medium text-xs px-5 py-2.5 rounded-xl shadow-sm min-h-[40px]"
          >
            {saving ? 'Menyimpan...' : editingId ? `Simpan Perubahan` : `Simpan ${entity.label}`}
          </button>
        </div>
      </form>

      {/* Daftar data — kartu, aman dari overflow horizontal, tombol nyaman disentuh */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm">Daftar {entity.label} ({items.length})</h3>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-slate-400 px-5 py-6 text-center">Belum ada data {entity.label.toLowerCase()}.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => {
              const waLink = toWhatsAppLink(item.whatsapp);
              return (
              <li key={item.id} className={`px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-sm ${editingId === item.id ? 'bg-rose-50/60' : ''}`}>
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="min-w-0 flex-1 text-left"
                >
                  {entity.fields.filter((f) => f.key !== 'whatsapp').map((f) => (
                    item[f.key] ? (
                      <p key={f.key} className="break-words">
                        <span className="text-slate-400">{f.label}: </span>
                        <span className="text-slate-700">{item[f.key]}</span>
                      </p>
                    ) : null
                  ))}
                  {item.whatsapp && (
                    <p className="break-words">
                      <span className="text-slate-400">WhatsApp: </span>
                      <span className="text-slate-700">{item.whatsapp}</span>
                    </p>
                  )}
                </button>
                <div className="flex flex-row sm:flex-col items-stretch sm:items-end gap-2 sm:gap-1 shrink-0">
                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-2 rounded-lg shadow-sm min-h-[36px] whitespace-nowrap"
                    >
                      <span>💬</span>
                      <span>Chat WhatsApp</span>
                    </a>
                  )}
                  <div className="flex gap-2 sm:gap-1 sm:flex-col sm:items-end">
                    <button
                      onClick={() => startEdit(item)}
                      className="text-xs font-semibold text-slate-500 hover:text-rose-600 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 min-h-[32px]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs text-slate-400 hover:text-rose-600 px-2.5 py-1 min-h-[28px]"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default MasterDataView;
