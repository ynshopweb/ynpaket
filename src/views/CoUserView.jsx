import React, { useMemo, useState } from 'react';
import { formatRupiah, waLink } from '../services/coUserService';

// Firestore Timestamp -> teks tanggal Indonesia (null saat serverTimestamp belum terisi)
function fmtTime(ts) {
  const d = ts?.toDate ? ts.toDate() : null;
  if (!d) return '-';
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
const millis = (ts) => (ts?.toMillis ? ts.toMillis() : 0);

function StatusPill({ status }) {
  const confirmed = status === 'Dikonfirmasi';
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${confirmed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
      {status}
    </span>
  );
}

function VerifyPill({ item }) {
  if (item.status !== 'Dikonfirmasi') return null;
  return item.adminStatus === 'Diverifikasi' ? (
    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-700">Diverifikasi</span>
  ) : (
    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700">Perlu diverifikasi</span>
  );
}

function CoUserView({ items, onVerify, onDelete, copyToClipboard }) {
  const [filter, setFilter] = useState('Semua');
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formUrl = `${window.location.origin}/co`;

  const counts = useMemo(() => ({
    Semua: items.length,
    Menunggu: items.filter((i) => i.status === 'Menunggu').length,
    Dikonfirmasi: items.filter((i) => i.status === 'Dikonfirmasi').length,
    perluVerifikasi: items.filter((i) => i.status === 'Dikonfirmasi' && i.adminStatus !== 'Diverifikasi').length,
  }), [items]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items
      .filter((i) => filter === 'Semua' || i.status === filter)
      .filter((i) =>
        !term ||
        [i.nama, i.namaPenerima, i.whatsapp, i.alamat, i.resi].some((v) => (v || '').toLowerCase().includes(term))
      )
      .sort((a, b) => millis(b.submittedAt) - millis(a.submittedAt));
  }, [items, filter, q]);

  // detail selalu mengikuti data realtime terbaru
  const current = detail ? items.find((i) => i.id === detail) : null;
  const closeDetail = () => { setDetail(null); setConfirmDelete(false); };

  const salinDetail = (i) =>
    copyToClipboard(
      `Nama: ${i.nama}\nNama di paket: ${i.namaPenerima}\nWhatsApp: ${i.whatsapp}\nAlamat: ${i.alamat}\nResi: ${i.resi || '-'}\nCOD: ${formatRupiah(i.cod)}`,
      'Data CO'
    );

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Data CO User</h2>
          <p className="text-sm text-slate-500">Data yang dikirim user lewat form publik. Periksa dulu sebelum dijadikan paket resmi.</p>
        </div>
        <button
          onClick={() => copyToClipboard(formUrl, 'Link form CO')}
          className="self-start md:self-auto bg-rose-500 hover:bg-rose-600 text-white font-medium px-4 py-2 rounded-xl text-sm shadow-sm"
        >
          🔗 Salin Link Form
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <p className="text-xs text-slate-500">Menunggu</p>
          <p className="text-xl font-bold text-amber-600">{counts.Menunggu}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <p className="text-xs text-slate-500">Dikonfirmasi</p>
          <p className="text-xl font-bold text-emerald-600">{counts.Dikonfirmasi}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <p className="text-xs text-slate-500">Perlu diverifikasi</p>
          <p className="text-xl font-bold text-rose-600">{counts.perluVerifikasi}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex gap-1.5 overflow-x-auto">
          {['Semua', 'Menunggu', 'Dikonfirmasi'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${filter === f ? 'bg-rose-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {f} ({counts[f]})
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama, penerima, resi, WhatsApp, alamat..."
          className="flex-1 px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
        />
      </div>

      {rows.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center text-sm text-slate-400">
          {items.length === 0 ? 'Belum ada data CO dari user. Bagikan link form ke user ya.' : 'Tidak ada data yang cocok.'}
        </div>
      ) : (
        <>
          {/* Desktop: tabel */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr>
                  {['Nama', 'Penerima', 'WhatsApp', 'Alamat', 'Resi', 'COD', 'Status', 'Waktu'].map((h) => (
                    <th key={h} className="text-left font-semibold px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((i) => (
                  <tr key={i.id} onClick={() => setDetail(i.id)} className="hover:bg-rose-50/40 cursor-pointer">
                    <td className="px-4 py-3 font-medium text-slate-800">{i.nama}</td>
                    <td className="px-4 py-3 text-slate-700">{i.namaPenerima}</td>
                    <td className="px-4 py-3 text-slate-700">{i.whatsapp}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[220px] truncate" title={i.alamat}>{i.alamat}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{i.resi || '-'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{formatRupiah(i.cod)}</td>
                    <td className="px-4 py-3 space-y-1">
                      <StatusPill status={i.status} />
                      <div><VerifyPill item={i} /></div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtTime(i.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: kartu */}
          <div className="md:hidden space-y-3">
            {rows.map((i) => (
              <button key={i.id} onClick={() => setDetail(i.id)} className="w-full text-left bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-800">{i.namaPenerima}</p>
                  <StatusPill status={i.status} />
                </div>
                <p className="text-xs text-slate-500">oleh {i.nama} · {i.whatsapp}</p>
                <p className="text-xs text-slate-500 line-clamp-2">{i.alamat}</p>
                {i.resi && <p className="text-xs font-mono text-slate-600">Resi: {i.resi}</p>}
                <div className="flex items-center justify-between pt-1">
                  <p className="font-bold text-slate-800">{formatRupiah(i.cod)}</p>
                  <div className="flex items-center gap-2">
                    <VerifyPill item={i} />
                    <span className="text-[11px] text-slate-400">{fmtTime(i.submittedAt)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Detail */}
      {current && (
        <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center bg-slate-900/50 p-0 md:p-4" onClick={closeDetail}>
          <div className="w-full md:max-w-md bg-white rounded-t-3xl md:rounded-2xl shadow-xl p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Detail Data CO</h3>
                <div className="flex items-center gap-2 mt-1">
                  <StatusPill status={current.status} />
                  <VerifyPill item={current} />
                </div>
              </div>
              <button onClick={closeDetail} className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Tutup">✕</button>
            </div>

            <dl className="text-sm divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {[
                ['Nama', current.nama],
                ['Nama di paket', current.namaPenerima],
                ['WhatsApp', current.whatsapp],
                ['Alamat', current.alamat],
                ['Nomor Resi', current.resi || '-'],
                ['Jumlah COD', formatRupiah(current.cod)],
                ['Waktu submit', fmtTime(current.submittedAt)],
                ['Waktu konfirmasi', fmtTime(current.confirmedAt)],
                ...(current.adminStatus === 'Diverifikasi'
                  ? [['Diverifikasi', `${fmtTime(current.verifiedAt)}${current.verifiedBy ? ' oleh ' + current.verifiedBy : ''}`]]
                  : []),
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3 px-4 py-2.5">
                  <dt className="w-32 shrink-0 text-slate-500">{k}</dt>
                  <dd className="font-medium text-slate-800 break-words min-w-0">{v}</dd>
                </div>
              ))}
            </dl>

            {current.status === 'Menunggu' && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                User sudah submit tapi belum menekan “Sudah Benar”. Data bisa saja masih berubah.
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button onClick={() => salinDetail(current)} className="py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50">
                📋 Salin Data
              </button>
              <a href={waLink(current.whatsapp)} target="_blank" rel="noopener noreferrer" className="py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-center text-emerald-700 hover:bg-emerald-50">
                💬 Chat WhatsApp
              </a>
              {current.status === 'Dikonfirmasi' && current.adminStatus !== 'Diverifikasi' && (
                <button onClick={() => onVerify(current)} className="col-span-2 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold">
                  ✔ Tandai Sudah Diverifikasi
                </button>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)} className="text-sm text-rose-600 hover:underline">Hapus data ini</button>
              ) : (
                <div className="flex items-center justify-between gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">
                  <p className="text-sm text-rose-700">Hapus permanen?</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 text-sm rounded-lg bg-white border border-slate-200">Batal</button>
                    <button onClick={() => { onDelete(current); closeDetail(); }} className="px-3 py-1.5 text-sm rounded-lg bg-rose-600 text-white font-semibold">Hapus</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoUserView;
