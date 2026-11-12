// Layanan khusus fitur "Form CO User" (halaman publik /co, TANPA login).
//
// Koleksi Firestore: coUser
// Alur data:
//   1. Input    -> user mengisi form (belum ada yang disimpan)
//   2. Pratinjau-> klik "Submit Data": dokumen dibuat dengan status "Menunggu"
//                  (belum dikonfirmasi). "Edit Data" memperbarui dokumen yang SAMA
//                  (ID tetap), jadi tidak pernah ada data ganda.
//   3. Konfirmasi-> klik "Sudah Benar": status menjadi "Dikonfirmasi" + confirmedAt.
//                  Setelah itu dokumen TERKUNCI (ditegakkan oleh firestore.rules).
//
// Keamanan: pengunjung hanya boleh membuat & memperbarui dokumennya sendiri
// (ID acak tak tertebak), tidak boleh membaca/menghapus apa pun. Lihat firestore.rules.

import { db } from '../firebase';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export const CO_USER_COLLECTION = 'coUser';

export const CO_STATUS = {
  menunggu: 'Menunggu',
  dikonfirmasi: 'Dikonfirmasi',
};

export const CO_ADMIN_STATUS = {
  baru: 'Baru',
  diverifikasi: 'Diverifikasi',
};

// ID unik per pengiriman (36 karakter, cocok dengan pola di firestore.rules)
export function newCoId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// 0812..., +62812..., 62812... -> 0812... (hanya angka)
export function normalizeWa(value) {
  let d = String(value || '').replace(/\D/g, '');
  if (d.startsWith('62')) d = '0' + d.slice(2);
  else if (d && !d.startsWith('0')) d = '0' + d;
  return d;
}

export function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

export function formatRupiah(n) {
  return 'Rp' + Number(n || 0).toLocaleString('id-ID');
}

// Link WhatsApp (wa.me) dari nomor format 08xxx
export function waLink(value) {
  const d = normalizeWa(value);
  return d ? `https://wa.me/62${d.slice(1)}` : '';
}

// Resi: huruf besar + angka saja, tanpa spasi/simbol (contoh: SPXID012345678901)
export function normalizeResi(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function validateCoForm(f) {
  const e = {};
  const nama = (f.nama || '').trim();
  const penerima = (f.namaPenerima || '').trim();
  const alamat = (f.alamat || '').trim();
  const wa = normalizeWa(f.whatsapp);
  const cod = parseInt(digitsOnly(f.cod), 10);
  const resi = normalizeResi(f.resi);

  if (nama.length < 2) e.nama = 'Nama minimal 2 karakter.';
  if (penerima.length < 2) e.namaPenerima = 'Isi nama sesuai yang tertera di paket.';
  if (!/^08\d{8,12}$/.test(wa)) e.whatsapp = 'Nomor WhatsApp tidak valid (contoh: 081234567890).';
  if (alamat.length < 5) e.alamat = 'Alamat terlalu singkat, tulis sesuai yang tertera di paket.';
  if (!/^[A-Z0-9]{6,30}$/.test(resi)) e.resi = 'Nomor resi tidak valid (6–30 huruf/angka, tanpa spasi).';
  if (!cod || cod < 1) e.cod = 'Masukkan nominal COD.';
  else if (cod > 100000000) e.cod = 'Nominal COD terlalu besar, periksa kembali.';
  return e;
}

// Ubah isian form -> data bersih siap simpan
export function cleanCoForm(f) {
  return {
    nama: (f.nama || '').trim().slice(0, 60),
    namaPenerima: (f.namaPenerima || '').trim().slice(0, 60),
    whatsapp: normalizeWa(f.whatsapp),
    alamat: (f.alamat || '').trim().slice(0, 300),
    resi: normalizeResi(f.resi).slice(0, 30),
    cod: parseInt(digitsOnly(f.cod), 10) || 0,
  };
}

/**
 * Simpan data dari tombol "Submit Data".
 * - Pertama kali (exists=false): BUAT dokumen baru, status "Menunggu".
 * - Setelah "Edit Data" (exists=true): PERBARUI dokumen yang sama.
 */
export async function saveCoDraft(id, form, exists) {
  const data = cleanCoForm(form);
  const ref = doc(db, CO_USER_COLLECTION, id);
  if (!exists) {
    await setDoc(ref, {
      ...data,
      status: CO_STATUS.menunggu,
      adminStatus: CO_ADMIN_STATUS.baru,
      submittedAt: serverTimestamp(),
      confirmedAt: null,
    });
  } else {
    await updateDoc(ref, {
      ...data,
      status: CO_STATUS.menunggu,
      confirmedAt: null,
      updatedAt: serverTimestamp(),
    });
  }
}

/** Tombol "Sudah Benar": kunci data sebagai konfirmasi user. */
export async function confirmCoUser(id) {
  await updateDoc(doc(db, CO_USER_COLLECTION, id), {
    status: CO_STATUS.dikonfirmasi,
    confirmedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
