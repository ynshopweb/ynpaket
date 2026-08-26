// Lapisan layanan Firestore.
// Semua data aplikasi YN Paket disimpan & disinkronkan secara realtime
// di Cloud Firestore lewat modul ini, mengikuti struktur berikut:
//
//   1. jasaCo        -> Jasa CO (jenis layanan checkout/jastip)
//   2. akunCo        -> Akun CO (akun Shopee/marketplace yang dipakai checkout)
//   3. alamat        -> Alamat (pengirim/penerima)
//   4. kurir         -> Kurir (JNE, J&T, SPX, dst)
//   5. kantorKurir    -> Kantor / Agen / Hub Kurir
//   6. pembelian      -> Pembelian (transaksi checkout awal)
//   7. paket          -> Paket (status pengiriman & ringkasan)
//   8. isiPaket       -> Isi Paket (rincian item per paket)
//   9. tracking       -> Tracking (riwayat pelacakan resi)
//  10. cod            -> COD (status pembayaran Cash on Delivery)
//  11. produk         -> Produk (stok/inventaris)
//  12. helperCheckout -> (LEGACY, tidak dipakai UI lagi) Helper Checkout lama —
//                         sudah digabung menjadi bagian dari master data "Jasa CO".
//                         Koleksi & dokumen lama TIDAK dihapus dari Firestore,
//                         hanya tidak lagi dibaca/ditulis oleh aplikasi.
//
// Setiap collection punya: subscribe (realtime listener), add, update, remove.

import { db } from '../firebase';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

// Nama koleksi Firestore, terpusat supaya konsisten di seluruh app
export const COLLECTIONS = {
  jasaCo: 'jasaCo',
  akunCo: 'akunCo',
  alamat: 'alamat',
  kurir: 'kurir',
  kantorKurir: 'kantorKurir',
  pembelian: 'pembelian',
  paket: 'paket',
  isiPaket: 'isiPaket',
  tracking: 'tracking',
  cod: 'cod',
  produk: 'produk',
  helperCheckout: 'helperCheckout',
  settings: 'settings',
};

/**
 * Berlangganan (realtime) semua dokumen pada sebuah koleksi.
 * @param {string} collectionName
 * @param {(items: Array<object>) => void} callback dipanggil setiap ada perubahan data
 * @param {(error: Error) => void} onError
 * @param {string} orderField field untuk pengurutan (opsional)
 * @returns {Function} unsubscribe
 */
export function subscribeCollection(collectionName, callback, onError, orderField) {
  const colRef = collection(db, collectionName);
  const q = orderField ? query(colRef, orderBy(orderField, 'desc')) : colRef;

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(items);
    },
    (error) => {
      console.error(`Gagal memuat data "${collectionName}":`, error);
      if (onError) onError(error);
    }
  );
}

/** Tambah dokumen baru. Jika data.id disediakan, dipakai sebagai ID dokumen. */
export async function addItem(collectionName, data) {
  const payload = { ...data, createdAt: data.createdAt || serverTimestamp() };
  if (data.id) {
    const { id, ...rest } = payload;
    await setDoc(doc(db, collectionName, id), rest);
    return id;
  }
  const ref = await addDoc(collection(db, collectionName), payload);
  return ref.id;
}

/** Simpan/replace dokumen dengan ID tertentu (create atau overwrite). */
export async function setItem(collectionName, id, data) {
  await setDoc(doc(db, collectionName, id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  return id;
}

/** Update sebagian field dokumen yang sudah ada. */
export async function updateItem(collectionName, id, data) {
  await updateDoc(doc(db, collectionName, id), { ...data, updatedAt: serverTimestamp() });
  return id;
}

/** Hapus dokumen. */
export async function removeItem(collectionName, id) {
  await deleteDoc(doc(db, collectionName, id));
}

// ---------------------------------------------------------------------
// Helper khusus alur bisnis: satu "Pembelian" akan otomatis membuat
// dokumen Paket, rincian Isi Paket, dan (bila COD) dokumen COD terkait.
// ---------------------------------------------------------------------

export async function createPembelianLengkap(pkg) {
  const paketId = pkg.id;

  // 1. Simpan sebagai Pembelian (catatan transaksi checkout awal)
  await setItem(COLLECTIONS.pembelian, paketId, pkg);

  // 2. Simpan sebagai Paket (dipakai untuk tracking & status kirim)
  await setItem(COLLECTIONS.paket, paketId, pkg);

  // 3. Simpan setiap barang ke koleksi Isi Paket
  const items = Array.isArray(pkg.items) ? pkg.items : [];
  await Promise.all(
    items.map((item, idx) =>
      addItem(COLLECTIONS.isiPaket, {
        paketId,
        ...item,
        _localIndex: idx,
      })
    )
  );

  // 4. Jika metode pembayaran COD, buat catatan COD
  if (pkg.financials?.paymentMethod === 'COD') {
    await setItem(COLLECTIONS.cod, paketId, {
      paketId,
      shopeeOrderId: pkg.shopeeOrderId,
      amount: pkg.financials.totalModal || 0,
      status: pkg.financials.codStatus || 'Belum dibayar',
      recipientName: pkg.recipient?.name || '',
    });
  }

  return paketId;
}

export async function updatePaketField(paketId, data) {
  await updateItem(COLLECTIONS.paket, paketId, data);
}

export async function tandaiCodDibayar(paketId, extra = {}) {
  await updateItem(COLLECTIONS.paket, paketId, {
    'financials.codStatus': 'Sudah dibayar',
    ...extra,
  });
  await setItem(COLLECTIONS.cod, paketId, {
    status: 'Sudah dibayar',
    paidAt: serverTimestamp(),
  });
}

export async function tambahRiwayatTracking(paketId, entry) {
  await addItem(COLLECTIONS.tracking, { paketId, ...entry });
}
