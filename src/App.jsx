import React, { useState, useEffect, useMemo } from 'react';
import NavItem from './components/layout/NavItem';
import DashboardView from './views/DashboardView';
import PackagesListView from './views/PackagesListView';
import CodDashboardView from './views/CodDashboardView';
import InventoryView from './views/InventoryView';
import ShopeeAccountsView from './views/ShopeeAccountsView';
import ReportsView from './views/ReportsView';
import SettingsView from './views/SettingsView';
import MobileNavItem from './components/layout/MobileNavItem';
import NewPurchaseModal from './components/modals/NewPurchaseModal';
import EditPackageModal from './components/modals/EditPackageModal';
import PackageDetailModal from './components/modals/PackageDetailModal';
import AddAccountModal from './components/modals/AddAccountModal';
import AddProductModal from './components/modals/AddProductModal';
import ConfirmSyncStockModal from './components/modals/ConfirmSyncStockModal';
import ConfirmDeletePackageModal from './components/modals/ConfirmDeletePackageModal';
import LoginView from './views/LoginView';
import MasterDataView from './views/MasterDataView';
import { trackingService } from './services/trackingService';
import { useAuth } from './contexts/AuthContext';
import {
    COLLECTIONS,
    subscribeCollection,
    addItem,
    updateItem,
    createPembelianLengkap,
    tandaiCodDibayar,
    tambahRiwayatTracking,
    hapusPaketLengkap,
} from './services/firestoreService';

function App() {
            const { user, authLoading, logout } = useAuth();

            // States (disinkronkan realtime dari Cloud Firestore)
            const [packages, setPackages] = useState([]);
            const [shopeeAccounts, setShopeeAccounts] = useState([]);
            const [products, setProducts] = useState([]);
            const [dataLoading, setDataLoading] = useState(true);
            const [masterData, setMasterData] = useState({ jasaCo: [], alamat: [], kurir: [], kantorKurir: [] });
            const [trackingApiConfig, setTrackingApiConfig] = useState(() => ({
                provider: 'biteship',
                baseUrl: '/api/tracking'
            }));

            // Berlangganan data Firestore secara realtime setelah user login.
            // Koleksi: paket, akunCo, produk
            // (Catatan: "Helper Checkout" sudah digabung ke master data "Jasa CO" —
            // koleksi helperCheckout lama TIDAK dihapus dari Firestore, hanya
            // tidak lagi dipakai sebagai master data terpisah di UI.)
            useEffect(() => {
                if (!user) return undefined;

                let loadedFlags = { paket: false, akunCo: false, produk: false };
                const checkAllLoaded = () => {
                    if (Object.values(loadedFlags).every(Boolean)) setDataLoading(false);
                };

                const unsubPaket = subscribeCollection(COLLECTIONS.paket, (items) => {
                    setPackages(items);
                    loadedFlags.paket = true;
                    checkAllLoaded();
                }, () => { loadedFlags.paket = true; checkAllLoaded(); });

                const unsubAkun = subscribeCollection(COLLECTIONS.akunCo, (items) => {
                    setShopeeAccounts(items);
                    loadedFlags.akunCo = true;
                    checkAllLoaded();
                }, () => { loadedFlags.akunCo = true; checkAllLoaded(); });

                const unsubProduk = subscribeCollection(COLLECTIONS.produk, (items) => {
                    setProducts(items);
                    loadedFlags.produk = true;
                    checkAllLoaded();
                }, () => { loadedFlags.produk = true; checkAllLoaded(); });

                return () => {
                    unsubPaket();
                    unsubAkun();
                    unsubProduk();
                };
            }, [user]);

            // Berlangganan koleksi Master Data: Jasa CO, Alamat, Kurir, Kantor/Agen/Hub Kurir
            useEffect(() => {
                if (!user) return undefined;

                const unsubJasaCo = subscribeCollection(COLLECTIONS.jasaCo, (items) =>
                    setMasterData((m) => ({ ...m, jasaCo: items }))
                );
                const unsubAlamat = subscribeCollection(COLLECTIONS.alamat, (items) =>
                    setMasterData((m) => ({ ...m, alamat: items }))
                );
                const unsubKurir = subscribeCollection(COLLECTIONS.kurir, (items) =>
                    setMasterData((m) => ({ ...m, kurir: items }))
                );
                const unsubKantorKurir = subscribeCollection(COLLECTIONS.kantorKurir, (items) =>
                    setMasterData((m) => ({ ...m, kantorKurir: items }))
                );

                return () => {
                    unsubJasaCo();
                    unsubAlamat();
                    unsubKurir();
                    unsubKantorKurir();
                };
            }, [user]);

            // UI Navigation State
            const [activeTab, setActiveTab] = useState('dashboard');
            const [searchQuery, setSearchQuery] = useState('');
            const [statusFilter, setStatusFilter] = useState('Semua');
            const [accountFilter, setAccountFilter] = useState('Semua');
            const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
            const [mobileMasterDataExpanded, setMobileMasterDataExpanded] = useState(false);
            const [masterDataEntity, setMasterDataEntity] = useState(null);

            // Navigasi dari drawer mobile: pindah tab & (opsional) langsung buka sub-entitas Master Data
            const goToTab = (tab, entity = null) => {
                setActiveTab(tab);
                if (entity) setMasterDataEntity(entity);
                setMobileMenuOpen(false);
            };

            // Modals & Sliders State
            const [showNewPurchaseModal, setShowNewPurchaseModal] = useState(false);
            const [showDetailModal, setShowDetailModal] = useState(null); // package object
            const [showAccountModal, setShowAccountModal] = useState(false);
            const [editingAccount, setEditingAccount] = useState(null); // akun CO yang sedang diedit
            const [showProductModal, setShowProductModal] = useState(false);
            const [editingProduct, setEditingProduct] = useState(null); // produk yang sedang diedit
            const [showSyncStockModal, setShowSyncStockModal] = useState(null); // package object
            const [showDeleteModal, setShowDeleteModal] = useState(null); // package object
            const [showEditModal, setShowEditModal] = useState(null); // package object
            const [toast, setToast] = useState(null);

            // API key tracking TIDAK disimpan di browser. Hanya provider/base URL.
            useEffect(() => {
                trackingService.config = {
                    provider: trackingApiConfig.provider || 'biteship',
                    baseUrl: '/api/tracking'
                };
            }, [trackingApiConfig]);

            // Helper for Toast Notifications
            const showToast = (message, type = 'success') => {
                setToast({ message, type });
                setTimeout(() => setToast(null), 3500);
            };

            // Global Copy to Clipboard helper
            const copyToClipboard = (text, label) => {
                const textEl = document.createElement('textarea');
                textEl.value = text;
                document.body.appendChild(textEl);
                textEl.select();
                try {
                    document.execCommand('copy');
                    showToast(`${label || 'Teks'} berhasil disalin!`);
                } catch (err) {
                    showToast('Gagal menyalin teks', 'error');
                }
                document.body.removeChild(textEl);
            };

            // --- COMPUTED STATS ---
            const stats = useMemo(() => {
                const totalPackages = packages.length;
                const draft = packages.filter(p => p.shipping.status === 'Draft').length;
                const dikemas = packages.filter(p => p.shipping.status === 'Dikemas').length;
                const dikirim = packages.filter(p => p.shipping.status === 'Dikirim').length;
                const dibawaKurir = packages.filter(p => p.shipping.status === 'Dibawa Kurir').length;
                const berhasilDiterima = packages.filter(p => p.shipping.status === 'Berhasil Diterima').length;
                const gagalRetur = packages.filter(p => ['Gagal Antar', 'Retur'].includes(p.shipping.status)).length;
                
                // Financials
                const totalModalKeseluruhan = packages.reduce((acc, p) => acc + (p.financials.totalModal || 0), 0);
                const totalFeeJasaCo = packages.reduce((acc, p) => acc + (p.financials.feeJasaCo || 0), 0);
                
                // COD Stats — field lama (codUnpaid/codPaid/codProblem) DIPERTAHANKAN
                // apa adanya untuk kompatibilitas (masih dipakai badge & banner lama).
                const codPackages = packages.filter(p => p.financials.metodePembayaran === 'COD');
                const codUnpaid = codPackages.filter(p => p.financials.codStatus === 'Belum dibayar').reduce((acc, p) => acc + p.financials.totalModal, 0);
                const codPaid = codPackages.filter(p => p.financials.codStatus === 'Sudah dibayar').reduce((acc, p) => acc + p.financials.totalModal, 0);
                const codProblem = codPackages.filter(p => p.financials.codStatus === 'Bermasalah').reduce((acc, p) => acc + p.financials.totalModal, 0);

                // BARU: pisahkan status COD berdasarkan status PAKET, supaya jelas mana
                // yang masih wajar "belum dibayar" (masih dikirim) vs yang SUDAH SAMPAI
                // tapi belum disetor (ini yang bikin terasa "menumpuk" kalau dicampur
                // jadi satu angka) vs yang gagal/retur (uang COD tidak akan pernah masuk,
                // jadi tidak boleh terus dihitung sebagai piutang aktif).
                const codBelumSampai = codPackages.filter(p =>
                    p.financials.codStatus === 'Belum dibayar' &&
                    !['Berhasil Diterima', 'Gagal Antar', 'Retur'].includes(p.shipping.status)
                );
                const codPerluDisetor = codPackages.filter(p =>
                    p.financials.codStatus === 'Belum dibayar' && p.shipping.status === 'Berhasil Diterima'
                );
                const codDibatalkan = codPackages.filter(p =>
                    p.financials.codStatus === 'Belum dibayar' && ['Gagal Antar', 'Retur'].includes(p.shipping.status)
                );
                const codBelumSampaiTotal = codBelumSampai.reduce((acc, p) => acc + p.financials.totalModal, 0);
                const codPerluDisetorTotal = codPerluDisetor.reduce((acc, p) => acc + p.financials.totalModal, 0);
                const codDibatalkanTotal = codDibatalkan.reduce((acc, p) => acc + p.financials.totalModal, 0);

                // Warnings
                const missingResi = packages.filter(p => !p.shipping.resi && p.shipping.status !== 'Draft');
                const pendingStockSync = packages.filter(p => p.shipping.status === 'Berhasil Diterima' && !p.stockSynced);

                return {
                    totalPackages, draft, dikemas, dikirim, dibawaKurir, berhasilDiterima, gagalRetur,
                    totalModal: totalModalKeseluruhan, totalFeeJasaCo,
                    codUnpaid, codPaid, codProblem,
                    codBelumSampaiTotal, codPerluDisetorTotal, codDibatalkanTotal,
                    codBelumSampaiCount: codBelumSampai.length,
                    codPerluDisetorCount: codPerluDisetor.length,
                    codDibatalkanCount: codDibatalkan.length,
                    missingResiCount: missingResi.length,
                    pendingStockSyncCount: pendingStockSync.length
                };
            }, [packages]);

            // Filtered Packages for Search & Views
            const filteredPackages = useMemo(() => {
                return packages.filter(pkg => {
                    const matchesSearch = 
                        pkg.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        pkg.shopeeOrderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (pkg.shipping.resi && pkg.shipping.resi.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        pkg.recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        pkg.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

                    const matchesStatus = statusFilter === 'Semua' || pkg.shipping.status === statusFilter;
                    const matchesAccount = accountFilter === 'Semua' || pkg.shopeeAccountId === accountFilter;

                    return matchesSearch && matchesStatus && matchesAccount;
                });
            }, [packages, searchQuery, statusFilter, accountFilter]);

            // --- ACTIONS (menulis langsung ke Firestore; UI ter-update otomatis via listener realtime) ---
            const handleMarkCodPaid = async (pkgId) => {
                const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
                try {
                    await updateItem(COLLECTIONS.paket, pkgId, {
                        'financials.codStatus': 'Sudah dibayar',
                        'financials.codPaidDate': now
                    });
                    await tandaiCodDibayar(pkgId);
                    showToast('Status COD diperbarui menjadi Sudah Dibayar!');
                } catch (err) {
                    console.error(err);
                    showToast('Gagal memperbarui status COD.', 'error');
                }
            };

            const handleSyncToStock = async (pkg) => {
                try {
                    // Tambah/perbarui kuantitas ke koleksi Produk
                    for (const item of pkg.items) {
                        const existing = products.find(p => p.id === item.productId || p.name === item.name);
                        if (existing) {
                            await updateItem(COLLECTIONS.produk, existing.id, {
                                stock: (existing.stock || 0) + item.qty,
                                lastPrice: item.unitPrice
                            });
                        } else {
                            await addItem(COLLECTIONS.produk, {
                                name: item.name,
                                sku: item.sku || 'SKU-AUTO',
                                category: 'Umum',
                                variant: item.variant || '-',
                                stock: item.qty,
                                lastPrice: item.unitPrice,
                                estHpp: Math.round(pkg.financials.totalModal / pkg.items.reduce((a, b) => a + b.qty, 0)),
                                minStock: 5
                            });
                        }
                    }

                    // Tandai paket sudah disinkron ke stok
                    await updateItem(COLLECTIONS.paket, pkg.id, { stockSynced: true });
                    setShowSyncStockModal(null);
                    showToast(`Stok dari paket ${pkg.id} berhasil ditambahkan ke Inventaris!`);
                } catch (err) {
                    console.error(err);
                    showToast('Gagal menyinkronkan stok.', 'error');
                }
            };

            const handleDeletePackage = async (pkg) => {
                try {
                    await hapusPaketLengkap(pkg.id);
                    setShowDeleteModal(null);
                    setShowDetailModal(null);
                    showToast(`Paket ${pkg.id} berhasil dihapus.`);
                } catch (err) {
                    console.error(err);
                    showToast('Gagal menghapus paket.', 'error');
                }
            };

            // Simpan koreksi data paket (resi salah ketik, salah akun/jasa CO, salah
            // qty/harga barang, dll). Hanya field yang dikirim dari form Edit Paket
            // yang diubah — status pengiriman, riwayat tracking & stockSynced TIDAK
            // ikut tersentuh supaya histori paket tetap konsisten.
            const handleEditPackage = async (pkgId, updatedFields) => {
                try {
                    await updateItem(COLLECTIONS.paket, pkgId, updatedFields);
                    setShowEditModal(null);
                    showToast(`Paket ${pkgId} berhasil diperbarui.`);
                } catch (err) {
                    console.error(err);
                    showToast('Gagal menyimpan perubahan paket.', 'error');
                }
            };

            // Jeda minimum antar-panggilan API tracking untuk resi yang sama,
            // supaya tidak boros kuota/hit API (bukan polling tiap beberapa detik).
            const MIN_TRACKING_INTERVAL_MS = 3 * 60 * 1000; // 3 menit

            const handleUpdateTracking = async (pkg, { force = false } = {}) => {
                const lastCheckIso = pkg.shipping.lastTrackingCheck;
                const lastCheckMs = lastCheckIso ? new Date(lastCheckIso).getTime() : 0;
                const elapsed = Date.now() - lastCheckMs;

                if (!force && lastCheckMs && elapsed < MIN_TRACKING_INTERVAL_MS) {
                    const waitSec = Math.ceil((MIN_TRACKING_INTERVAL_MS - elapsed) / 1000);
                    showToast(`Tracking baru saja diperbarui. Coba lagi dalam ${waitSec} detik.`, 'info');
                    return;
                }

                showToast(`Memperbarui tracking resi ${pkg.shipping.resi}...`, 'info');
                try {
                    const result = await trackingService.track(pkg.shipping.courier, pkg.shipping.resi);
                    const checkedAt = new Date().toISOString();

                    if (!result.success) {
                        // Tetap catat waktu percobaan supaya throttle di atas tetap berlaku
                        // walau API sedang error/limit habis. Status paket TIDAK diubah/dihapus —
                        // aplikasi tetap bisa dipakai penuh, tinggal ubah status manual bila perlu.
                        await updateItem(COLLECTIONS.paket, pkg.id, { 'shipping.lastTrackingCheck': checkedAt });
                        showToast(
                            (result.error || 'Tracking sedang tidak tersedia.') + ' Status paket tidak berubah — silakan ubah status manual jika perlu.',
                            'error'
                        );
                        return;
                    }

                    const lastUpdate = result.lastUpdate || checkedAt;
                    const isManualLocked = pkg.shipping.statusSource === 'manual';

                    // API berhasil dihubungi TAPI teks status kurir tidak bisa dipetakan ke
                    // salah satu dari 7 status baku (currentStatus === null). JANGAN PERNAH
                    // menulis status mentah/tidak baku ke database. Riwayat & lokasi tetap
                    // diperbarui supaya tetap berguna, status paket dibiarkan apa adanya.
                    if (!result.currentStatus) {
                        await updateItem(COLLECTIONS.paket, pkg.id, {
                            'shipping.lastLocation': result.lastLocation || pkg.shipping.lastLocation || '',
                            'shipping.lastUpdate': lastUpdate,
                            'shipping.lastTrackingCheck': checkedAt,
                            trackingHistory: result.history || []
                        });
                        showToast(
                            `Info kurir terbaru: "${result.rawStatus || '(tidak ada info)'}" — belum bisa dipetakan otomatis ke status baku. Status paket tidak berubah, cek riwayat tracking atau ubah manual jika perlu.`,
                            'info'
                        );
                        return;
                    }

                    if (isManualLocked) {
                        // Status paket ini pernah dikoreksi manual — JANGAN ditimpa otomatis.
                        // Simpan saja hasil API sebagai "saran" yang bisa diterapkan lewat
                        // Detail Paket, supaya perubahan status tetap terkendali & tidak
                        // mengejutkan admin/user.
                        await updateItem(COLLECTIONS.paket, pkg.id, {
                            'shipping.lastTrackingCheck': checkedAt,
                            'shipping.pendingApiStatus': result.currentStatus,
                            'shipping.pendingApiLocation': result.lastLocation || '',
                            'shipping.pendingApiUpdate': lastUpdate,
                        });
                        showToast(
                            `Status dari API: "${result.currentStatus}" — tapi paket ${pkg.id} sedang dikunci status manual ("${pkg.shipping.status}"). Buka Detail Paket untuk menerapkan status API jika perlu.`,
                            'info'
                        );
                        return;
                    }

                    await updateItem(COLLECTIONS.paket, pkg.id, {
                        'shipping.status': result.currentStatus,
                        'shipping.statusSource': 'auto',
                        'shipping.lastLocation': result.lastLocation || pkg.shipping.lastLocation || '',
                        'shipping.lastUpdate': lastUpdate,
                        'shipping.lastTrackingCheck': checkedAt,
                        'shipping.pendingApiStatus': null,
                        'shipping.pendingApiLocation': null,
                        'shipping.pendingApiUpdate': null,
                        trackingHistory: result.history || []
                    });
                    await tambahRiwayatTracking(pkg.id, {
                        status: result.currentStatus,
                        location: result.lastLocation || pkg.shipping.lastLocation || '',
                        time: lastUpdate,
                        source: 'auto'
                    });
                    showToast(`Status paket ${pkg.id} berhasil diperbarui: ${result.currentStatus}`);
                } catch (err) {
                    console.error(err);
                    showToast('Gagal memperbarui tracking. Status paket tidak berubah.', 'error');
                }
            };

            // Ubah status paket secara manual (dipakai saat API error/down/limit habis/resi
            // belum terbaca, atau saat admin ingin mengoreksi status). Setiap perubahan
            // dicatat (siapa, kapan, catatan) dan MENGUNCI status supaya auto-update dari
            // tracking API tidak langsung menimpanya.
            const handleManualStatusChange = async (pkg, { status, note = '' }) => {
                if (!status) return;
                const now = new Date().toISOString();
                const actor = user?.email || user?.displayName || 'Admin';
                const historyEntry = {
                    time: now,
                    location: note ? `Manual: ${note}` : 'Diubah manual oleh admin/user',
                    status
                };
                const currentHistory = Array.isArray(pkg.trackingHistory) ? pkg.trackingHistory : [];

                try {
                    await updateItem(COLLECTIONS.paket, pkg.id, {
                        'shipping.status': status,
                        'shipping.statusSource': 'manual',
                        'shipping.manualStatusAt': now,
                        'shipping.manualStatusBy': actor,
                        'shipping.manualStatusNote': note || '',
                        'shipping.lastUpdate': now,
                        // Kosongkan saran dari API sebelumnya karena admin baru saja
                        // menetapkan status secara sadar.
                        'shipping.pendingApiStatus': null,
                        'shipping.pendingApiLocation': null,
                        'shipping.pendingApiUpdate': null,
                        trackingHistory: [historyEntry, ...currentHistory]
                    });
                    await tambahRiwayatTracking(pkg.id, {
                        status,
                        location: historyEntry.location,
                        time: now,
                        source: 'manual',
                        actor,
                        note: note || ''
                    });
                    showToast(`Status paket ${pkg.id} diubah manual menjadi "${status}".`);
                } catch (err) {
                    console.error(err);
                    showToast('Gagal mengubah status secara manual.', 'error');
                }
            };

            // Terapkan status hasil tracking API yang sempat tertahan karena paket
            // sedang dikunci manual (dipanggil dari tombol "Terapkan Status API").
            const handleApplyPendingApiStatus = async (pkg) => {
                if (!pkg.shipping.pendingApiStatus) return;
                const now = new Date().toISOString();
                const status = pkg.shipping.pendingApiStatus;
                const location = pkg.shipping.pendingApiLocation || pkg.shipping.lastLocation || '';
                const time = pkg.shipping.pendingApiUpdate || now;
                try {
                    await updateItem(COLLECTIONS.paket, pkg.id, {
                        'shipping.status': status,
                        'shipping.statusSource': 'auto',
                        'shipping.lastLocation': location,
                        'shipping.lastUpdate': time,
                        'shipping.pendingApiStatus': null,
                        'shipping.pendingApiLocation': null,
                        'shipping.pendingApiUpdate': null,
                    });
                    await tambahRiwayatTracking(pkg.id, { status, location, time, source: 'auto' });
                    showToast(`Status API diterapkan ke paket ${pkg.id}: "${status}".`);
                } catch (err) {
                    console.error(err);
                    showToast('Gagal menerapkan status dari API.', 'error');
                }
            };

            // Abaikan saran status dari API (tetap pakai status manual yang sudah ditetapkan).
            const handleDismissPendingApiStatus = async (pkg) => {
                try {
                    await updateItem(COLLECTIONS.paket, pkg.id, {
                        'shipping.pendingApiStatus': null,
                        'shipping.pendingApiLocation': null,
                        'shipping.pendingApiUpdate': null,
                    });
                } catch (err) {
                    console.error(err);
                }
            };

            // --- AUTH GATE ---
            // Selama status login masih diperiksa, tampilkan layar loading.
            if (authLoading) {
                return (
                    <div className="min-h-screen flex items-center justify-center bg-slate-50">
                        <div className="flex flex-col items-center space-y-3">
                            <div className="w-10 h-10 rounded-full border-4 border-rose-200 border-t-rose-500 animate-spin"></div>
                            <p className="text-sm text-slate-500">Memuat...</p>
                        </div>
                    </div>
                );
            }

            // Belum login -> tampilkan halaman Login (khusus pengguna terdaftar, tanpa daftar akun)
            if (!user) {
                return <LoginView />;
            }

            return (
                <div className="flex flex-col md:flex-row min-h-screen">
                    {/* Toast Notification */}
                    {toast && (
                        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center space-x-2 animate-bounce text-sm font-medium ${
                            toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 
                            toast.type === 'info' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                            'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                            <span>{toast.type === 'error' ? '❌' : toast.type === 'info' ? 'ℹ️' : '✅'}</span>
                            <span>{toast.message}</span>
                        </div>
                    )}

                    {/* Desktop Sidebar */}
                    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-4 sticky top-0 h-screen justify-between">
                        <div>
                            {/* App Brand Header */}
                            <div className="flex items-center space-x-3 px-3 py-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold shadow-md shadow-pink-200">
                                    YN
                                </div>
                                <div>
                                    <h1 className="font-bold text-slate-900 text-lg leading-tight">YN Paket</h1>
                                    <p className="text-xs text-slate-500">Stok & Package Tracker</p>
                                </div>
                            </div>

                            {/* Nav items */}
                            <nav className="space-y-1">
                                <NavItem icon="📊" label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                                <NavItem icon="📦" label="Semua Paket" badge={packages.length} active={activeTab === 'packages'} onClick={() => setActiveTab('packages')} />
                                <NavItem icon="💵" label="COD Shopee" badge={stats.codPerluDisetorCount} badgeColor="bg-rose-100 text-rose-700" active={activeTab === 'cod'} onClick={() => setActiveTab('cod')} />
                                <NavItem icon="🏬" label="Stok / Produk" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
                                <div className="pt-4 pb-1">
                                    <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Master Data</p>
                                </div>
                                <NavItem icon="🛍️" label="Akun Shopee" active={activeTab === 'accounts'} onClick={() => setActiveTab('accounts')} />
                                <NavItem icon="🗂️" label="Master Data" active={activeTab === 'masterdata'} onClick={() => setActiveTab('masterdata')} />
                                <NavItem icon="📈" label="Laporan" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
                                <NavItem icon="⚙️" label="Pengaturan" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                            </nav>
                        </div>

                        {/* Quick Action Button */}
                        <div className="pt-4 border-t border-slate-100 space-y-3">
                            <button 
                                onClick={() => setShowNewPurchaseModal(true)}
                                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-medium py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 text-sm"
                            >
                                <span>➕</span>
                                <span>Tambah Pembelian</span>
                            </button>

                            {/* Info Akun & Logout */}
                            <div className="flex items-center justify-between px-1">
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-700 truncate" title={user.email}>{user.email}</p>
                                    <p className="text-[10px] text-slate-400">Masuk sebagai pengguna</p>
                                </div>
                                <button
                                    onClick={() => logout()}
                                    className="text-xs font-medium text-slate-500 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                                >
                                    Keluar
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
                        {/* Top App Bar */}
                        <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-20 flex items-center gap-3">
                            {/* Hamburger Menu (mobile only) */}
                            <button
                                onClick={() => setMobileMenuOpen(true)}
                                className="md:hidden w-10 h-10 shrink-0 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 text-lg"
                                aria-label="Buka menu"
                            >
                                ☰
                            </button>

                            <div className="flex items-center space-x-2.5 md:hidden shrink-0">
                                <div className="w-8 h-8 rounded-lg bg-rose-500 text-white font-bold flex items-center justify-center text-xs">YN</div>
                            </div>

                            {/* Global Search Bar */}
                            <div className="flex-1 max-w-xl relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">🔍</span>
                                <input 
                                    type="text"
                                    placeholder="Cari Resi, No. Pesanan, Produk, Akun Shopee, Penerima..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600">✕</button>
                                )}
                            </div>

                            {/* Desktop Quick Header Actions */}
                            <div className="hidden md:flex items-center space-x-3">
                                <button 
                                    onClick={() => setShowNewPurchaseModal(true)}
                                    className="bg-rose-500 hover:bg-rose-600 text-white font-medium px-3.5 py-1.5 rounded-lg text-sm shadow-sm flex items-center space-x-1.5"
                                >
                                    <span>+</span>
                                    <span>Tambah Paket</span>
                                </button>
                            </div>
                        </header>

                        {/* Page Content Renderer */}
                        <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
                            {/* Warning Banner Alerts */}
                            {(stats.missingResiCount > 0 || stats.pendingStockSyncCount > 0 || stats.codPerluDisetorCount > 0 || stats.codBelumSampaiTotal > 0) && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                    {stats.missingResiCount > 0 && (
                                        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs flex items-center space-x-2">
                                            <span className="text-base">⚠️</span>
                                            <div>
                                                <strong className="font-semibold">{stats.missingResiCount} Paket belum ada resi</strong>
                                                <p className="text-amber-600">Segera masukkan resi dari Shopee.</p>
                                            </div>
                                        </div>
                                    )}
                                    {stats.pendingStockSyncCount > 0 && (
                                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs flex items-center space-x-2">
                                            <span className="text-base">📦</span>
                                            <div>
                                                <strong className="font-semibold">{stats.pendingStockSyncCount} Paket Siap Masuk Stok</strong>
                                                <p className="text-emerald-600">Paket telah diterima, klik masukkan ke stok.</p>
                                            </div>
                                        </div>
                                    )}
                                    {/* Paling urgent: paket SUDAH SAMPAI tapi COD belum disetor.
                                        Dipisah dari "COD masih dikirim" supaya angka yang menumpuk
                                        di dashboard benar-benar yang butuh tindakan sekarang. */}
                                    {stats.codPerluDisetorCount > 0 && (
                                        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-center space-x-2">
                                            <span className="text-base">🚨</span>
                                            <div>
                                                <strong className="font-semibold">{stats.codPerluDisetorCount} Paket COD Perlu Disetor: Rp{stats.codPerluDisetorTotal.toLocaleString('id-ID')}</strong>
                                                <p className="text-rose-600">Sudah sampai ke pembeli, segera tandai lunas setelah disetor.</p>
                                            </div>
                                        </div>
                                    )}
                                    {stats.codBelumSampaiTotal > 0 && (
                                        <div className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl p-3 text-xs flex items-center space-x-2">
                                            <span className="text-base">💰</span>
                                            <div>
                                                <strong className="font-semibold">COD Masih Dikirim: Rp{stats.codBelumSampaiTotal.toLocaleString('id-ID')}</strong>
                                                <p className="text-slate-500">Belum sampai ke pembeli — siapkan dana saat kurir datang.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {}
                            {activeTab === 'dashboard' && (
                                <DashboardView 
                                    stats={stats} 
                                    packages={packages} 
                                    shopeeAccounts={shopeeAccounts}
                                    onViewDetail={(pkg) => setShowDetailModal(pkg)}
                                    onQuickNew={() => setShowNewPurchaseModal(true)}
                                    onNavigateTab={(tab) => setActiveTab(tab)}
                                />
                            )}

                            {activeTab === 'packages' && (
                                <PackagesListView 
                                    packages={filteredPackages}
                                    statusFilter={statusFilter}
                                    setStatusFilter={setStatusFilter}
                                    accountFilter={accountFilter}
                                    setAccountFilter={setAccountFilter}
                                    shopeeAccounts={shopeeAccounts}
                                    jasaCoList={masterData.jasaCo}
                                    onViewDetail={(pkg) => setShowDetailModal(pkg)}
                                    onMarkCodPaid={handleMarkCodPaid}
                                    onSyncStock={(pkg) => setShowSyncStockModal(pkg)}
                                    onUpdateTracking={handleUpdateTracking}
                                    onDeletePackage={(pkg) => setShowDeleteModal(pkg)}
                                    onEditPackage={(pkg) => setShowEditModal(pkg)}
                                    copyToClipboard={copyToClipboard}
                                />
                            )}

                            {activeTab === 'cod' && (
                                <CodDashboardView 
                                    packages={packages.filter(p => p.financials.metodePembayaran === 'COD')}
                                    stats={stats}
                                    onMarkCodPaid={handleMarkCodPaid}
                                    onViewDetail={(pkg) => setShowDetailModal(pkg)}
                                />
                            )}

                            {activeTab === 'inventory' && (
                                <InventoryView 
                                    products={products}
                                    packages={packages}
                                    onOpenAddModal={() => { setEditingProduct(null); setShowProductModal(true); }}
                                    onSyncStock={(pkg) => setShowSyncStockModal(pkg)}
                                    onEditProduct={(prod) => { setEditingProduct(prod); setShowProductModal(true); }}
                                />
                            )}

                            {activeTab === 'accounts' && (
                                <ShopeeAccountsView 
                                    accounts={shopeeAccounts}
                                    packages={packages}
                                    onAddAccount={() => { setEditingAccount(null); setShowAccountModal(true); }}
                                    onEditAccount={(acc) => { setEditingAccount(acc); setShowAccountModal(true); }}
                                />
                            )}

                            {activeTab === 'masterdata' && (
                                <MasterDataView
                                    data={masterData}
                                    showToast={showToast}
                                    initialEntity={masterDataEntity}
                                />
                            )}

                            {activeTab === 'reports' && (
                                <ReportsView 
                                    packages={packages}
                                    shopeeAccounts={shopeeAccounts}
                                    jasaCoList={masterData.jasaCo}
                                />
                            )}

                            {activeTab === 'settings' && (
                                <SettingsView 
                                    trackingConfig={trackingApiConfig}
                                    setTrackingConfig={setTrackingApiConfig}
                                    showToast={showToast}
                                />
                            )}
                        </div>
                    </main>

                    {}
                    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-1.5 flex justify-around z-30 text-xs">
                        <MobileNavItem icon="📊" label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                        <MobileNavItem icon="📦" label="Paket" active={activeTab === 'packages'} onClick={() => setActiveTab('packages')} />
                        <MobileNavItem icon="➕" label="Tambah" highlight onClick={() => setShowNewPurchaseModal(true)} />
                        <MobileNavItem icon="💰" label="COD" active={activeTab === 'cod'} onClick={() => setActiveTab('cod')} />
                        <MobileNavItem icon="🏬" label="Stok" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
                    </nav>

                    {/* Mobile Drawer Menu (hamburger) — memuat semua menu termasuk Master Data & submenunya */}
                    {mobileMenuOpen && (
                        <div className="md:hidden fixed inset-0 z-40 flex">
                            {/* Overlay */}
                            <div
                                className="absolute inset-0 bg-slate-900/50"
                                onClick={() => setMobileMenuOpen(false)}
                            ></div>

                            {/* Panel */}
                            <div className="relative w-72 max-w-[85vw] h-full bg-white shadow-xl flex flex-col yn-drawer-panel">
                                <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
                                    <div className="flex items-center space-x-2.5">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold shadow-sm">YN</div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm leading-tight">YN Paket</p>
                                            <p className="text-[11px] text-slate-400">Menu Navigasi</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                                        aria-label="Tutup menu"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                                    <NavItem icon="📊" label="Dashboard" active={activeTab === 'dashboard'} onClick={() => goToTab('dashboard')} />
                                    <NavItem icon="📦" label="Paket" badge={packages.length} active={activeTab === 'packages'} onClick={() => goToTab('packages')} />
                                    <NavItem icon="➕" label="Pembelian Baru" onClick={() => { setMobileMenuOpen(false); setShowNewPurchaseModal(true); }} />
                                    <NavItem icon="🚚" label="Tracking" active={activeTab === 'packages'} onClick={() => goToTab('packages')} />
                                    <NavItem icon="💵" label="COD" badge={stats.codPerluDisetorCount} badgeColor="bg-rose-100 text-rose-700" active={activeTab === 'cod'} onClick={() => goToTab('cod')} />
                                    <NavItem icon="🏬" label="Stok / Produk" active={activeTab === 'inventory'} onClick={() => goToTab('inventory')} />
                                    <NavItem icon="🛍️" label="Akun Shopee" active={activeTab === 'accounts'} onClick={() => goToTab('accounts')} />

                                    {/* Master Data (expandable submenu) */}
                                    <button
                                        onClick={() => setMobileMasterDataExpanded((v) => !v)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
                                            activeTab === 'masterdata' ? 'bg-rose-50 text-rose-600' : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <span className="flex items-center space-x-3">
                                            <span>🗂️</span>
                                            <span>Master Data</span>
                                        </span>
                                        <span className={`text-xs transition-transform ${mobileMasterDataExpanded ? 'rotate-180' : ''}`}>▾</span>
                                    </button>
                                    {mobileMasterDataExpanded && (
                                        <div className="pl-9 pr-1 py-1 space-y-0.5">
                                            <button onClick={() => goToTab('masterdata', 'jasaCo')} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 min-h-[40px]">Jasa CO</button>
                                            <button onClick={() => goToTab('accounts')} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 min-h-[40px]">Akun CO</button>
                                            <button onClick={() => goToTab('masterdata', 'alamat')} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 min-h-[40px]">Alamat</button>
                                            <button onClick={() => goToTab('masterdata', 'kurir')} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 min-h-[40px]">Kurir</button>
                                            <button onClick={() => goToTab('masterdata', 'kantorKurir')} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 min-h-[40px]">Lokasi Kurir</button>
                                            <button onClick={() => goToTab('inventory')} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 min-h-[40px]">Produk</button>
                                        </div>
                                    )}

                                    <NavItem icon="📈" label="Laporan" active={activeTab === 'reports'} onClick={() => goToTab('reports')} />
                                    <NavItem icon="⚙️" label="Pengaturan" active={activeTab === 'settings'} onClick={() => goToTab('settings')} />
                                </nav>

                                <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-slate-700 truncate" title={user.email}>{user.email}</p>
                                        <p className="text-[10px] text-slate-400">Masuk sebagai pengguna</p>
                                    </div>
                                    <button
                                        onClick={() => { setMobileMenuOpen(false); logout(); }}
                                        className="text-xs font-medium text-slate-500 hover:text-rose-600 px-2.5 py-1.5 rounded-lg hover:bg-rose-50"
                                    >
                                        Keluar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- MODALS --- */}

                    {/* Add New Purchase Modal */}
                    {showNewPurchaseModal && (
                        <NewPurchaseModal 
                            shopeeAccounts={shopeeAccounts}
                            products={products}
                            jasaCoList={masterData.jasaCo}
                            onClose={() => setShowNewPurchaseModal(false)}
                            onSave={async (newPkg) => {
                                try {
                                    await createPembelianLengkap(newPkg);
                                    setShowNewPurchaseModal(false);
                                    showToast(`Pembelian ${newPkg.id} berhasil ditambahkan!`);
                                } catch (err) {
                                    console.error(err);
                                    showToast('Gagal menyimpan pembelian ke database.', 'error');
                                }
                            }}
                        />
                    )}

                    {/* Package Detail Modal */}
                    {showDetailModal && (
                        <PackageDetailModal 
                            pkg={showDetailModal}
                            shopeeAccounts={shopeeAccounts}
                            jasaCoList={masterData.jasaCo}
                            onClose={() => setShowDetailModal(null)}
                            onMarkCodPaid={() => {
                                handleMarkCodPaid(showDetailModal.id);
                                setShowDetailModal(prev => ({ ...prev, financials: { ...prev.financials, codStatus: 'Sudah dibayar' } }));
                            }}
                            onSyncStock={() => {
                                handleSyncToStock(showDetailModal);
                                setShowDetailModal(null);
                            }}
                            onUpdateTracking={() => handleUpdateTracking(showDetailModal)}
                            onDeletePackage={(pkg) => setShowDeleteModal(pkg)}
                            onEditPackage={(pkg) => { setShowEditModal(pkg); setShowDetailModal(null); }}
                            onManualStatusChange={async (payload) => {
                                await handleManualStatusChange(showDetailModal, payload);
                                setShowDetailModal(prev => prev ? ({
                                    ...prev,
                                    shipping: { ...prev.shipping, status: payload.status, statusSource: 'manual' }
                                }) : prev);
                            }}
                            onApplyPendingApiStatus={() => {
                                handleApplyPendingApiStatus(showDetailModal);
                                setShowDetailModal(prev => prev ? ({
                                    ...prev,
                                    shipping: {
                                        ...prev.shipping,
                                        status: prev.shipping.pendingApiStatus,
                                        statusSource: 'auto',
                                        pendingApiStatus: null, pendingApiLocation: null, pendingApiUpdate: null
                                    }
                                }) : prev);
                            }}
                            onDismissPendingApiStatus={() => {
                                handleDismissPendingApiStatus(showDetailModal);
                                setShowDetailModal(prev => prev ? ({
                                    ...prev,
                                    shipping: { ...prev.shipping, pendingApiStatus: null, pendingApiLocation: null, pendingApiUpdate: null }
                                }) : prev);
                            }}
                            copyToClipboard={copyToClipboard}
                        />
                    )}

                    {/* Confirm Delete Package Modal */}
                    {showDeleteModal && (
                        <ConfirmDeletePackageModal
                            pkg={showDeleteModal}
                            onClose={() => setShowDeleteModal(null)}
                            onConfirm={() => handleDeletePackage(showDeleteModal)}
                        />
                    )}

                    {/* Edit Package Modal */}
                    {showEditModal && (
                        <EditPackageModal
                            pkg={showEditModal}
                            shopeeAccounts={shopeeAccounts}
                            products={products}
                            jasaCoList={masterData.jasaCo}
                            onClose={() => setShowEditModal(null)}
                            onSave={(updatedFields) => handleEditPackage(showEditModal.id, updatedFields)}
                            onManualStatusChange={async (payload) => {
                                await handleManualStatusChange(showEditModal, payload);
                                setShowEditModal(prev => prev ? ({
                                    ...prev,
                                    shipping: { ...prev.shipping, status: payload.status, statusSource: 'manual' }
                                }) : prev);
                            }}
                        />
                    )}

                    {/* Add/Edit Shopee Account (Akun CO) Modal */}
                    {showAccountModal && (
                        <AddAccountModal 
                            jasaCoList={masterData.jasaCo}
                            initial={editingAccount}
                            onClose={() => { setShowAccountModal(false); setEditingAccount(null); }}
                            onSave={async (acc) => {
                                try {
                                    if (editingAccount) {
                                        const { id, ...rest } = acc;
                                        await updateItem(COLLECTIONS.akunCo, id, rest);
                                        showToast('Akun CO berhasil diperbarui!');
                                    } else {
                                        await addItem(COLLECTIONS.akunCo, acc);
                                        showToast('Akun CO baru berhasil disimpan!');
                                    }
                                    setShowAccountModal(false);
                                    setEditingAccount(null);
                                } catch (err) {
                                    console.error(err);
                                    showToast('Gagal menyimpan Akun CO.', 'error');
                                }
                            }}
                        />
                    )}

                    {/* Add/Edit Product Modal */}
                    {showProductModal && (
                        <AddProductModal 
                            initial={editingProduct}
                            onClose={() => { setShowProductModal(false); setEditingProduct(null); }}
                            onSave={async (prod) => {
                                try {
                                    if (editingProduct) {
                                        const { id, ...rest } = prod;
                                        await updateItem(COLLECTIONS.produk, id, rest);
                                        showToast('Produk berhasil diperbarui!');
                                    } else {
                                        await addItem(COLLECTIONS.produk, prod);
                                        showToast('Produk baru berhasil disimpan!');
                                    }
                                    setShowProductModal(false);
                                    setEditingProduct(null);
                                } catch (err) {
                                    console.error(err);
                                    showToast('Gagal menyimpan Produk.', 'error');
                                }
                            }}
                        />
                    )}

                    {/* Sync to Stock Confirmation Modal */}
                    {showSyncStockModal && (
                        <ConfirmSyncStockModal 
                            pkg={showSyncStockModal}
                            onClose={() => setShowSyncStockModal(null)}
                            onConfirm={() => handleSyncToStock(showSyncStockModal)}
                        />
                    )}
                </div>
            );
        }

export default App;
