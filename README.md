# YN Paket — Pengelola Pembelian, Stok & Tracking Paket Shopee

Aplikasi ini sudah dipecah dari 1 file HTML besar menjadi struktur project React + Vite + Tailwind yang siap di-deploy ke Vercel.

## Struktur Folder

```
project/
├── index.html                     # HTML root
├── src/
│   ├── main.jsx                   # Entry point React
│   ├── index.css                  # Import Tailwind + style custom scrollbar
│   ├── App.jsx                    # Komponen utama (state, layout, routing tab)
│   ├── data/
│   │   └── seedData.js            # Data awal (akun Shopee, helper, produk, paket)
│   ├── services/
│   │   └── trackingService.js     # Layer service untuk tracking resi (Biteship/RajaOngkir/dll)
│   ├── components/
│   │   ├── layout/                # NavItem, MobileNavItem
│   │   ├── common/                # StatCard, FinanceCard, StatusBadge
│   │   └── modals/                # Semua modal (Tambah Pembelian, Detail Paket, dll)
│   └── views/                     # Dashboard, Daftar Paket, COD, Stok, Akun, Helper, Laporan, Pengaturan
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── vercel.json
```

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

- **Biaya Ongkir Shopee dihapus.** Karena Shopee sudah pasti gratis ongkir, field "Ongkos Kirim (Rp)" dan "Potongan Gratis Ongkir (Rp)" di form Tambah Pembelian sudah dihapus. Perhitungan `Total Modal Shopee` sekarang: `Subtotal Barang - Voucher + Biaya Layanan + Biaya Lainnya`.
- Field **Biaya Lainnya (Rp)** yang sebelumnya ada di data tapi belum punya input di form, sekarang sudah ditambahkan supaya bisa diisi manual.
- Kartu statistik "Biaya Ongkir Shopee" di Dashboard diganti menjadi "Total Biaya Layanan".
- Data masih tersimpan di `localStorage` browser (belum terhubung ke database/backend). Untuk data multi-user/permanen, perlu ditambahkan backend (mis. Supabase/Firebase) — beri tahu saya jika ingin dibantu menambahkannya.
