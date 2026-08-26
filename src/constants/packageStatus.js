// Daftar STATUS PAKET resmi yang dipakai di SELURUH aplikasi YN Paket.
//
// PENTING: Ini adalah satu-satunya sumber kebenaran (single source of truth)
// untuk status paket. Jangan menambah status baru di luar daftar ini
// (misalnya jangan pakai lagi "Sudah Dikirim", "Dalam Perjalanan", atau
// "Transit" sebagai status utama — semua itu sudah digabung ke dalam
// status "Dikirim").
export const PACKAGE_STATUSES = [
    'Draft',
    'Dikemas',
    'Dikirim',
    'Dibawa Kurir',
    'Berhasil Diterima',
    'Gagal Antar',
    'Retur',
];

// Dipakai khusus untuk pilihan filter/tab di UI.
// "Semua" HANYA filter tampilan — bukan status yang pernah disimpan ke database.
export const PACKAGE_STATUS_FILTERS = ['Semua', ...PACKAGE_STATUSES];
