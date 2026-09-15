# YN Paket — Pengelola Pembelian, Stok & Tracking Paket Shopee

Aplikasi ini sudah dipecah dari 1 file HTML besar menjadi struktur project React + Vite + Tailwind yang siap di-deploy ke Vercel.

## Struktur Folder

```
project/
├── index.html                     # HTML root
├── src/
│   ├── main.jsx                   # Entry point React (dibungkus AuthProvider)
│   ├── index.css                  # Import Tailwind + style custom scrollbar
│   ├── App.jsx                    # Komponen utama (auth gate, state Firestore, layout, routing tab)
│   ├── firebase.js                # Inisialisasi Firebase (Auth, Firestore, Analytics)
│   ├── contexts/
│   │   └── AuthContext.jsx        # Login, logout, reset password (context React)
│   ├── data/
│   │   └── seedData.js            # (tidak lagi dipakai untuk data awal — sudah diganti Firestore)
│   ├── services/
│   │   ├── trackingService.js     # Layer service untuk tracking resi (Biteship/RajaOngkir/dll)
│   │   └── firestoreService.js    # Layer akses Cloud Firestore (CRUD + realtime, semua koleksi)
│   ├── components/
│   │   ├── layout/                # NavItem, MobileNavItem
│   │   ├── common/                # StatCard, FinanceCard, StatusBadge
│   │   └── modals/                # Semua modal (Tambah Pembelian, Detail Paket, dll)
│   └── views/                     # Login, Dashboard, Daftar Paket, COD, Stok, Akun, Helper, Master Data, Laporan, Pengaturan
├── firestore.rules                # Security rules Firestore (hanya user login yang boleh akses)
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── vercel.json
```

## 🔥 Setup Firebase (Login & Database)

Aplikasi ini sudah terhubung ke project Firebase **`ynpaket`** (konfigurasi ada di `src/firebase.js`). Yang perlu dilakukan agar login & database berfungsi:

### 1. Aktifkan Authentication (Email/Password)
1. Buka [Firebase Console](https://console.firebase.google.com/) → pilih project **ynpaket**.
2. Menu **Build → Authentication → Sign-in method** → aktifkan provider **Email/Password**.
3. Karena aplikasi ini **tidak punya halaman daftar akun** (sengaja, khusus pengguna internal), buat akun pengguna secara manual:
   - Tab **Authentication → Users → Add user** → isi email & password.
   - Bagikan email + password tersebut ke pengguna yang berhak login.
4. Fitur **"Lupa Password?"** di halaman login akan otomatis mengirim email reset password bawaan Firebase — tidak perlu setup tambahan, tapi pastikan template email di **Authentication → Templates → Password reset** sudah aktif (default sudah aktif).

### 2. Aktifkan Cloud Firestore
1. Menu **Build → Firestore Database → Create database** (mode production).
2. Deploy security rules dari file `firestore.rules` di project ini (isinya: hanya user yang sudah login yang boleh baca/tulis data), lewat **Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init firestore   # pilih project ynpaket, pakai firestore.rules yang sudah ada
   firebase deploy --only firestore:rules
   ```
   Atau copy-paste isi `firestore.rules` langsung ke tab **Firestore Database → Rules** di Console lalu klik **Publish**.

### 3. Struktur Data di Firestore
Semua data aplikasi tersimpan sebagai koleksi top-level berikut (dibuat otomatis saat pertama kali ada data yang disimpan dari aplikasi — tidak perlu dibuat manual):

| Koleksi Firestore | Menu di Aplikasi | Keterangan |
|---|---|---|
| `jasaCo` | Master Data → Jasa CO | Jenis layanan jastip/checkout |
| `akunCo` | Akun Shopee | Akun marketplace yang dipakai checkout |
| `alamat` | Master Data → Alamat | Alamat pengirim/penerima |
| `kurir` | Master Data → Kurir | Daftar kurir (JNE, J&T, SPX, dst) |
| `kantorKurir` | Master Data → Kantor/Agen/Hub Kurir | Titik kantor/agen/hub kurir |
| `pembelian` | (dibuat otomatis saat Tambah Pembelian) | Catatan transaksi checkout awal |
| `paket` | Semua Paket / COD / Dashboard | Status pengiriman & ringkasan paket (sumber utama tampilan) |
| `isiPaket` | (rincian, dibuat otomatis) | Rincian barang per paket |
| `tracking` | (riwayat, dibuat otomatis) | Riwayat pelacakan resi tiap kali di-update |
| `cod` | COD Shopee | Status pembayaran Cash on Delivery per paket |
| `produk` | Stok / Produk | Data inventaris |
| `helperCheckout` | *(legacy, tidak dipakai UI lagi)* | Data Helper Checkout lama — sudah digabung ke `jasaCo`. Dokumen lama tetap ada di Firestore, hanya tidak lagi dibaca/ditulis aplikasi. |

Karena setiap koleksi disinkronkan **realtime** (`onSnapshot`), perubahan data langsung terlihat di semua perangkat yang sedang login tanpa perlu refresh.

### 4. Login
Buka aplikasi → akan langsung diarahkan ke halaman **Login** (email + password, dengan ikon mata untuk menampilkan/menyembunyikan password, dan link **Lupa Password?** yang mengirim email reset). Tidak ada tombol daftar — akun hanya dibuat lewat Firebase Console seperti langkah di atas.

## Menjalankan di Lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`.

## Build untuk Production

```bash
npm run build
npm run preview   # opsional, untuk mencoba hasil build secara lokal
```

## Deploy ke Vercel

**Opsi 1 — Vercel CLI**
```bash
npm i -g vercel
vercel
```
Ikuti instruksi di terminal (login, pilih scope, dsb). Vercel akan otomatis mendeteksi framework Vite lewat `vercel.json`.

**Opsi 2 — Import dari Git**
1. Push folder ini ke repository GitHub/GitLab/Bitbucket.
2. Buka [vercel.com/new](https://vercel.com/new) dan import repo tersebut.
3. Vercel otomatis mengenali build command `npm run build` dan output folder `dist` (sudah diset di `vercel.json`).
4. Klik **Deploy**.

## Catatan Perubahan dari Versi Sebelumnya

- **Deteksi status paket otomatis diperbaiki total.** Sebelumnya `api/tracking.js` hanya mencocokkan kata kunci berbahasa Inggris (`'on process'`, `'in transit'`, dst) yang hampir tidak pernah cocok dengan output asli Binderbyte — akibatnya status paket di aplikasi praktis cuma pernah kedeteksi otomatis 2 kondisi (Dikirim → langsung loncat ke Berhasil Diterima). Sekarang deteksi memakai kata kunci Bahasa Indonesia dari `summary.status` **dan** deskripsi riwayat kurir terbaru (mis. "SEDANG DIANTAR", "TELAH BERANGKAT", "TERKIRIM", "DIKEMBALIKAN KE PENGIRIM"), sehingga status **Dikemas → Dikirim → Dibawa Kurir (pengantaran) → Berhasil Diterima** benar-benar bisa terdeteksi bertahap, plus Gagal Antar & Retur. Kalau teks dari kurir benar-benar tidak bisa dipetakan, status paket **tidak pernah ditimpa** dengan teks mentah/tidak baku — riwayat & lokasi tetap diperbarui, status dibiarkan apa adanya (bisa dikoreksi manual).
- **Status COD dan status Paket sekarang benar-benar terpisah & jelas.** Sebelumnya semua paket COD yang "Belum dibayar" ditumpuk jadi satu angka, termasuk yang masih dikirim maupun yang sudah gagal/retur — kesannya terus menumpuk padahal campur aduk. Sekarang COD disegmentasi berdasarkan status paketnya:
  - **Masih Dikirim** — wajar "Belum Dibayar", belum sampai ke pembeli.
  - **🚨 Perlu Disetor** — paket **Berhasil Diterima** tapi COD belum ditandai lunas. Inilah angka yang benar-benar butuh tindakan, sekarang tampil terpisah & mencolok di Dashboard, banner peringatan, dan badge tab COD di sidebar.
  - **Sudah Lunas** — tidak berubah.
  - **Gagal / Retur** — paket gagal antar/retur **tidak lagi ikut dihitung** sebagai piutang COD aktif (uangnya memang tidak akan pernah masuk), tapi tetap tercatat di kategori terpisah untuk referensi.
  - Halaman **COD Shopee** sekarang punya tab filter (Semua / Perlu Disetor / Masih Dikirim / Sudah Lunas / Gagal-Retur) dan kolom "Status Paket" di tabel supaya kedua status terlihat berdampingan tapi tetap jelas berbeda.
- **Backward compatible:** field `financials.codStatus` (`'Belum dibayar'` / `'Sudah dibayar'`) dan struktur data paket lama **tidak diubah sama sekali** — segmentasi COD di atas murni hasil kombinasi field yang sudah ada (`codStatus` + `shipping.status`), jadi paket lama otomatis ikut tersegmentasi dengan benar tanpa perlu migrasi data. Field statistik lama (`stats.codUnpaid`, `stats.codPaid`, `stats.codProblem`) tetap dihitung apa adanya untuk kompatibilitas, meski tidak lagi ditampilkan langsung di UI (digantikan pecahan yang lebih jelas).
- Tidak ada data Firestore yang dihapus atau dimigrasi paksa. Tidak ada data dummy/demo yang ditambahkan.

- **Semua data dummy/contoh dihapus.** `src/data/seedData.js` sekarang berisi array kosong (`initialShopeeAccounts`, `initialHelpers`, `initialProducts`, `initialPackages`). Aplikasi mulai dari kondisi bersih — silakan tambahkan Akun Shopee, Helper Checkout, dan Produk sendiri lewat menu Master Data sebelum mulai mencatat pembelian.
- **Biaya Ongkir Shopee dihapus.** Karena Shopee sudah pasti gratis ongkir, field "Ongkos Kirim (Rp)" dan "Potongan Gratis Ongkir (Rp)" di form Tambah Pembelian sudah dihapus. Perhitungan `Total Modal Shopee` sekarang: `Subtotal Barang - Voucher + Biaya Layanan + Biaya Lainnya`.
- Field **Biaya Lainnya (Rp)** yang sebelumnya ada di data tapi belum punya input di form, sekarang sudah ditambahkan supaya bisa diisi manual.
- Kartu statistik "Biaya Ongkir Shopee" di Dashboard diganti menjadi "Total Biaya Layanan".
- **Terhubung ke Firebase.** Data tidak lagi disimpan di `localStorage`, melainkan di Cloud Firestore (realtime, multi-perangkat) dan aplikasi kini mewajibkan login (Firebase Authentication, email + password saja, tanpa pendaftaran mandiri). Lihat bagian **🔥 Setup Firebase** di atas untuk langkah aktivasinya.


## Live Tracking Biteship

Tracking tidak lagi menggunakan mock/fake history. Alurnya:

`Frontend → /api/tracking → Biteship API`

Tambahkan Environment Variable di Vercel:

- `BITESHIP_API_KEY` = API key Biteship Anda
- Aktifkan untuk Production (dan Preview/Development bila diperlukan)
- Setelah menyimpan variable, lakukan Redeploy.

API key tidak disimpan di frontend, localStorage, Firestore, atau Git.

Untuk SPX Express, aplikasi mengirim courier code `spx`. Pastikan akun Biteship Anda memiliki akses tracking SPX.
