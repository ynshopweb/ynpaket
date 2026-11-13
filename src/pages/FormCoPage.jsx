import React, { useState, useEffect, useRef } from 'react';
import {
  newCoId,
  normalizeWa,
  normalizeResi,
  digitsOnly,
  formatRupiah,
  validateCoForm,
  saveCoDraft,
  confirmCoUser,
} from '../services/coUserService';

// Isi nomor WhatsApp Ka Mery (format 08xxx / 628xxx) agar tombol "Hubungi Ka Mery"
// muncul di pop-up. Dikosongkan = tombol tidak ditampilkan.
const KONTAK_KA_MERY_WA = '083865829223';

const DRAFT_KEY = 'yn-co-draft';
const EMPTY = { nama: '', namaPenerima: '', whatsapp: '', alamat: '', resi: '', cod: '' };

function loadDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return d && d.id && d.form ? d : null;
  } catch {
    return null;
  }
}

function Field({ label, hint, error, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
      {children}
      {error ? (
        <p className="text-xs text-rose-600 mt-1.5">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-400 mt-1.5">{hint}</p>
      ) : null}
    </div>
  );
}

const inputCls = (err) =>
  `w-full px-4 py-3 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 transition-all ${
    err ? 'border-rose-300 focus:ring-rose-300' : 'border-slate-200 focus:ring-rose-300 focus:border-rose-300'
  }`;

function Steps({ step }) {
  const items = ['Isi Data', 'Periksa', 'Selesai'];
  const idx = step === 'input' ? 0 : step === 'preview' ? 1 : 2;
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {items.map((label, i) => (
        <React.Fragment key={label}>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                i <= idx ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {i + 1}
            </span>
            <span className={`text-xs font-medium ${i <= idx ? 'text-rose-600' : 'text-slate-400'}`}>{label}</span>
          </div>
          {i < items.length - 1 && <span className={`w-6 h-px ${i < idx ? 'bg-rose-400' : 'bg-slate-200'}`}></span>}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function FormCoPage() {
  const restored = useRef(loadDraft()).current;

  const [step, setStep] = useState(restored?.step === 'preview' ? 'preview' : 'input'); // input | preview | done
  const [form, setForm] = useState({ ...EMPTY, ...(restored?.form || {}) });
  const [errors, setErrors] = useState({});
  const [docId, setDocId] = useState(restored?.id || newCoId());
  const [docExists, setDocExists] = useState(!!restored?.exists);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [honeypot, setHoneypot] = useState('');

  useEffect(() => {
    document.title = 'Form Data Checkout — YN Paket';
  }, []);

  // Draft disimpan di sessionStorage supaya refresh tidak menghilangkan isian
  // dan tidak membuat dokumen ganda (ID tetap sama).
  useEffect(() => {
    if (step === 'done') return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ id: docId, form, step, exists: docExists }));
    } catch {
      /* abaikan bila storage tidak tersedia */
    }
  }, [docId, form, step, docExists]);

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const errs = validateCoForm(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitError('');
    // Honeypot: kolom tersembunyi yang hanya diisi bot -> pura-pura sukses, tidak menyimpan.
    if (honeypot) {
      setStep('preview');
      return;
    }
    setLoading(true);
    try {
      await saveCoDraft(docId, form, docExists);
      setDocExists(true);
      setStep('preview');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setSubmitError(
        err?.code === 'permission-denied'
          ? 'Data ini sudah dikonfirmasi dan tidak bisa diubah lagi.'
          : 'Gagal mengirim data. Periksa koneksi internet lalu coba lagi.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (loading) return;
    setSubmitError('');
    setLoading(true);
    try {
      if (!honeypot) await confirmCoUser(docId);
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        /* abaikan */
      }
      setStep('done');
    } catch (err) {
      console.error(err);
      setSubmitError(
        err?.code === 'permission-denied'
          ? 'Data ini sudah pernah dikonfirmasi dan tidak bisa diubah lagi.'
          : 'Gagal mengonfirmasi data. Periksa koneksi internet lalu coba lagi.'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForNew = () => {
    setForm(EMPTY);
    setErrors({});
    setDocId(newCoId());
    setDocExists(false);
    setSubmitError('');
    setStep('input');
    window.scrollTo({ top: 0 });
  };

  const waKaMery = normalizeWa(KONTAK_KA_MERY_WA);
  const previewRows = [
    ['Nama', form.nama.trim()],
    ['Nama di paket', form.namaPenerima.trim()],
    ['No. WhatsApp', normalizeWa(form.whatsapp)],
    ['Alamat', form.alamat.trim()],
    ['Nomor Resi', normalizeResi(form.resi)],
    ['Jumlah COD', formatRupiah(parseInt(digitsOnly(form.cod), 10) || 0)],
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50 px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        {/* Brand */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-pink-200 mb-3">
            YN
          </div>
          <h1 className="font-bold text-slate-900 text-xl">YN Paket</h1>
          <p className="text-[11px] tracking-[0.2em] font-semibold text-rose-500 mt-0.5">FORM DATA CHECKOUT</p>
        </div>

        <Steps step={step} />

        {step === 'input' && (
          <>
            <div className="mb-5 text-center">
              <p className="text-lg font-semibold text-slate-800">Halo, Kak! 👋</p>
              <p className="text-sm text-slate-500 mt-1">
                Silakan isi data penerima paket dengan benar agar proses checkout berjalan lancar.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <h2 className="font-bold text-slate-800">Formulir Data Paket</h2>

              <Field label="Nama" error={errors.nama}>
                <input
                  type="text"
                  value={form.nama}
                  maxLength={60}
                  autoComplete="name"
                  placeholder="Nama kamu"
                  onChange={(e) => setField('nama', e.target.value)}
                  className={inputCls(errors.nama)}
                />
              </Field>

              <Field label="Nama tertera di paket" error={errors.namaPenerima}>
                <input
                  type="text"
                  value={form.namaPenerima}
                  maxLength={60}
                  placeholder="Nama tertera di paket"
                  onChange={(e) => setField('namaPenerima', e.target.value)}
                  className={inputCls(errors.namaPenerima)}
                />
              </Field>

              <Field label="Nomor WhatsApp tertera di paket" error={errors.whatsapp}>
                <input
                  type="tel"
                  inputMode="tel"
                  value={form.whatsapp}
                  maxLength={18}
                  placeholder="Nomor WhatsApp tertera di paket"
                  onChange={(e) => setField('whatsapp', e.target.value)}
                  className={inputCls(errors.whatsapp)}
                />
              </Field>

              <Field label="Alamat tertera di paket" error={errors.alamat}>
                <textarea
                  rows={3}
                  value={form.alamat}
                  maxLength={300}
                  placeholder="Alamat tertera di paket"
                  onChange={(e) => setField('alamat', e.target.value)}
                  className={inputCls(errors.alamat) + ' resize-none'}
                />
              </Field>

              <Field label="Nomor Resi" hint="Lihat nomor resi di label paket atau aplikasi Shopee." error={errors.resi}>
                <input
                  type="text"
                  value={form.resi}
                  maxLength={30}
                  autoCapitalize="characters"
                  autoComplete="off"
                  placeholder="Contoh: SPXID012345678901"
                  onChange={(e) => setField('resi', normalizeResi(e.target.value))}
                  className={inputCls(errors.resi) + ' uppercase'}
                />
              </Field>

              <Field label="Jumlah COD" hint="Masukkan nominal COD sesuai pesanan." error={errors.cod}>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-sm text-slate-400">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.cod ? Number(digitsOnly(form.cod)).toLocaleString('id-ID') : ''}
                    placeholder="0"
                    onChange={(e) => setField('cod', digitsOnly(e.target.value).slice(0, 9))}
                    className={inputCls(errors.cod) + ' pl-11'}
                  />
                </div>
              </Field>

              {/* Honeypot anti-bot: disembunyikan dari manusia */}
              <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', height: 0, overflow: 'hidden' }}>
                <label>
                  Website
                  <input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
                </label>
              </div>

              {submitError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">{submitError}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl shadow-sm transition-all"
              >
                {loading ? 'Mengirim...' : 'Submit Data'}
              </button>
            </form>
          </>
        )}

        {(step === 'preview' || step === 'done') && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-start justify-between gap-3 mb-1">
              <h2 className="font-bold text-slate-800 text-lg leading-tight">Periksa Kembali Data Kamu</h2>
              <span
                className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                  step === 'done' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {step === 'done' ? 'Terkonfirmasi' : 'Belum dikonfirmasi'}
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-4">Pastikan seluruh informasi sudah sesuai.</p>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs">
                    <th className="text-left font-semibold px-4 py-2 w-2/5">Informasi</th>
                    <th className="text-left font-semibold px-4 py-2">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewRows.map(([k, v]) => (
                    <tr key={k}>
                      <td className="px-4 py-2.5 text-slate-500 align-top">{k}</td>
                      <td className="px-4 py-2.5 text-slate-800 font-medium break-words">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {step === 'preview' && (
              <>
                <p className="text-sm font-semibold text-slate-700 mt-5 mb-3">Apakah data yang kamu isi sudah benar?</p>

                {submitError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3 mb-3">{submitError}</div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => { setSubmitError(''); setStep('input'); window.scrollTo({ top: 0 }); }}
                    className="py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-700 font-semibold text-sm transition-all"
                  >
                    Edit Data
                    <span className="block text-[11px] font-normal text-slate-400">Kembali ke formulir</span>
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleConfirm}
                    className="py-3 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-semibold text-sm shadow-sm transition-all"
                  >
                    {loading ? 'Menyimpan...' : 'Sudah Benar'}
                    <span className="block text-[11px] font-normal text-rose-100">Konfirmasi data</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <p className="text-center text-[11px] text-slate-400 mt-6">© YN Paket</p>
      </div>

      {/* Pop-up berhasil */}
      {step === 'done' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/50" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 flex items-center justify-center text-3xl mb-3">✅</div>
            <h2 className="text-xl font-bold text-slate-900">Terima Kasih! 💗</h2>
            <p className="text-sm font-semibold text-emerald-600 mt-1">Data CO Berhasil Dikonfirmasi</p>
            <p className="text-sm text-slate-500 mt-3">
              Terima kasih telah melakukan CO, Kak! Data paket kamu sudah berhasil kami terima.
            </p>
            <p className="text-sm text-slate-700 mt-3 bg-rose-50 rounded-xl px-3 py-2.5">
              Silakan hubungi <strong>Ka Mery</strong> untuk proses transfer fee yang telah disepakati.
            </p>
            <p className="text-xs text-slate-400 mt-3">Terima kasih telah membantu CO produk kami, Kak!</p>

            <div className="mt-5 space-y-2">
              {waKaMery && (
                <a
                  href={`https://wa.me/62${waKaMery.slice(1)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm"
                >
                  Hubungi Ka Mery via WhatsApp
                </a>
              )}
              <button
                type="button"
                onClick={resetForNew}
                className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-sm"
              >
                Isi Data Paket Lain
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
