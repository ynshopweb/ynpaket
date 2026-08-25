import React, { useState } from 'react';
import { COLLECTIONS, addItem, removeItem } from '../services/firestoreService';

// Definisi tab & field masing-masing jenis master data
const ENTITIES = {
  jasaCo: {
    label: 'Jasa CO',
    collection: COLLECTIONS.jasaCo,
    icon: '🧾',
    fields: [
      { key: 'nama', label: 'Nama Jasa', placeholder: 'cth. Jastip Checkout Reguler' },
      { key: 'biaya', label: 'Biaya Jasa (Rp)', placeholder: '5000', type: 'number' },
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
    ],
  },
  kantorKurir: {
    label: 'Kantor/Agen/Hub Kurir',
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

function MasterDataView({ data, showToast }) {
  const [activeEntity, setActiveEntity] = useState('jasaCo');
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const entity = ENTITIES[activeEntity];
  const items = data[activeEntity] || [];

  const handleChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    const hasContent = entity.fields.some((f) => (form[f.key] || '').toString().trim());
    if (!hasContent) {
      showToast('Isi minimal satu data sebelum menyimpan.', 'error');
      return;
    }
    setSaving(true);
    try {
      await addItem(entity.collection, { ...form });
      setForm({});
      showToast(`${entity.label} berhasil disimpan!`);
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
      showToast(`${entity.label} berhasil dihapus.`);
    } catch (err) {
      console.error(err);
      showToast(`Gagal menghapus ${entity.label}.`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-bold text-slate-900 text-xl">Master Data</h2>
        <p className="text-slate-500 text-sm">Kelola Jasa CO, Alamat, Kurir, dan Kantor/Agen/Hub Kurir. Semua data tersimpan di Firestore.</p>
      </div>

      {/* Tabs entitas */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(ENTITIES).map(([key, val]) => (
          <button
            key={key}
            onClick={() => { setActiveEntity(key); setForm({}); }}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-medium border transition-colors flex items-center gap-1.5 ${
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

      {/* Form tambah */}
      <form onSubmit={handleAdd} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-semibold text-slate-800 text-sm">Tambah {entity.label}</h3>
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
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-medium text-xs px-5 py-2.5 rounded-xl shadow-sm"
          >
            {saving ? 'Menyimpan...' : `Simpan ${entity.label}`}
          </button>
        </div>
      </form>

      {/* Daftar data */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm">Daftar {entity.label} ({items.length})</h3>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-slate-400 px-5 py-6 text-center">Belum ada data {entity.label.toLowerCase()}.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li key={item.id} className="px-5 py-3 flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  {entity.fields.map((f) => (
                    item[f.key] ? (
                      <p key={f.key} className="truncate">
                        <span className="text-slate-400">{f.label}: </span>
                        <span className="text-slate-700">{item[f.key]}</span>
                      </p>
                    ) : null
                  ))}
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-xs text-slate-400 hover:text-rose-600 shrink-0"
                >
                  Hapus
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default MasterDataView;
