import React, { useState, useEffect, useMemo } from 'react';
import NavItem from './components/layout/NavItem';
import DashboardView from './views/DashboardView';
import PackagesListView from './views/PackagesListView';
import CodDashboardView from './views/CodDashboardView';
import InventoryView from './views/InventoryView';
import ShopeeAccountsView from './views/ShopeeAccountsView';
import HelpersView from './views/HelpersView';
import ReportsView from './views/ReportsView';
import SettingsView from './views/SettingsView';
import MobileNavItem from './components/layout/MobileNavItem';
import NewPurchaseModal from './components/modals/NewPurchaseModal';
import PackageDetailModal from './components/modals/PackageDetailModal';
import AddAccountModal from './components/modals/AddAccountModal';
import AddHelperModal from './components/modals/AddHelperModal';
import AddProductModal from './components/modals/AddProductModal';
import ConfirmSyncStockModal from './components/modals/ConfirmSyncStockModal';
import { trackingService } from './services/trackingService';
import { initialShopeeAccounts, initialHelpers, initialProducts, initialPackages } from './data/seedData';

function App() {
            // States
            const [packages, setPackages] = useState(() => {
                const saved = localStorage.getItem('yn_packages');
                return saved ? JSON.parse(saved) : initialPackages;
            });
            const [shopeeAccounts, setShopeeAccounts] = useState(() => {
                const saved = localStorage.getItem('yn_accounts');
                return saved ? JSON.parse(saved) : initialShopeeAccounts;
            });
            const [helpers, setHelpers] = useState(() => {
                const saved = localStorage.getItem('yn_helpers');
                return saved ? JSON.parse(saved) : initialHelpers;
            });
            const [products, setProducts] = useState(() => {
                const saved = localStorage.getItem('yn_products');
                return saved ? JSON.parse(saved) : initialProducts;
            });
            const [trackingApiConfig, setTrackingApiConfig] = useState(() => {
                const saved = localStorage.getItem('yn_tracking_config');
                return saved ? JSON.parse(saved) : trackingService.config;
            });

            // UI Navigation State
            const [activeTab, setActiveTab] = useState('dashboard');
            const [searchQuery, setSearchQuery] = useState('');
            const [statusFilter, setStatusFilter] = useState('Semua');
            const [accountFilter, setAccountFilter] = useState('Semua');

            // Modals & Sliders State
            const [showNewPurchaseModal, setShowNewPurchaseModal] = useState(false);
            const [showDetailModal, setShowDetailModal] = useState(null); // package object
            const [showAccountModal, setShowAccountModal] = useState(false);
            const [showHelperModal, setShowHelperModal] = useState(false);
            const [showProductModal, setShowProductModal] = useState(false);
            const [showSyncStockModal, setShowSyncStockModal] = useState(null); // package object
            const [toast, setToast] = useState(null);

            // Save to LocalStorage
            useEffect(() => { localStorage.setItem('yn_packages', JSON.stringify(packages)); }, [packages]);
            useEffect(() => { localStorage.setItem('yn_accounts', JSON.stringify(shopeeAccounts)); }, [shopeeAccounts]);
            useEffect(() => { localStorage.setItem('yn_helpers', JSON.stringify(helpers)); }, [helpers]);
            useEffect(() => { localStorage.setItem('yn_products', JSON.stringify(products)); }, [products]);
            useEffect(() => { 
                localStorage.setItem('yn_tracking_config', JSON.stringify(trackingApiConfig));
                trackingService.config = trackingApiConfig;
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
                const waitingShip = packages.filter(p => p.shipping.status === 'Menunggu dikirim').length;
                const shipped = packages.filter(p => p.shipping.status === 'Sudah dikirim').length;
                const inTransit = packages.filter(p => p.shipping.status === 'Dalam perjalanan' || p.shipping.status === 'Transit').length;
                const withCourier = packages.filter(p => p.shipping.status === 'Dibawa kurir').length;
                const delivered = packages.filter(p => p.shipping.status === 'Berhasil diterima').length;
                const failedOrProblem = packages.filter(p => ['Gagal antar', 'Retur', 'Bermasalah', 'Hilang'].includes(p.shipping.status)).length;
                
                // Financials
                const totalModal = packages.reduce((acc, p) => acc + (p.financials.totalShopeePayment || 0), 0);
                const totalVouchers = packages.reduce((acc, p) => acc + (p.financials.voucher || 0), 0);
                const totalFees = packages.reduce((acc, p) => acc + (p.financials.serviceFee || 0) + (p.financials.otherFee || 0), 0);
                
                // COD Stats
                const codPackages = packages.filter(p => p.financials.paymentMethod === 'COD');
                const codUnpaid = codPackages.filter(p => p.financials.codStatus === 'Belum dibayar').reduce((acc, p) => acc + p.financials.totalShopeePayment, 0);
                const codPaid = codPackages.filter(p => p.financials.codStatus === 'Sudah dibayar').reduce((acc, p) => acc + p.financials.totalShopeePayment, 0);
                const codProblem = codPackages.filter(p => p.financials.codStatus === 'Bermasalah').reduce((acc, p) => acc + p.financials.totalShopeePayment, 0);

                // Warnings
                const missingResi = packages.filter(p => !p.shipping.resi && p.shipping.status !== 'Draft');
                const pendingStockSync = packages.filter(p => p.shipping.status === 'Berhasil diterima' && !p.stockSynced);

                return {
                    totalPackages, waitingShip, shipped, inTransit, withCourier, delivered, failedOrProblem,
                    totalModal, totalVouchers, totalFees,
                    codUnpaid, codPaid, codProblem,
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

            // --- ACTIONS ---
            const handleMarkCodPaid = (pkgId) => {
                const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
                setPackages(prev => prev.map(p => {
                    if (p.id === pkgId) {
                        return {
                            ...p,
                            financials: {
                                ...p.financials,
                                codStatus: 'Sudah dibayar',
                                codPaidDate: now
                            }
                        };
                    }
                    return p;
                }));
                showToast('Status COD diperbarui menjadi Suda Dibayar!');
            };

            const handleSyncToStock = (pkg) => {
                // Add quantities to inventory products
                setProducts(prevProducts => {
                    const updated = [...prevProducts];
                    pkg.items.forEach(item => {
                        const prodIndex = updated.findIndex(p => p.id === item.productId || p.name === item.name);
                        if (prodIndex >= 0) {
                            updated[prodIndex] = {
                                ...updated[prodIndex],
                                stock: updated[prodIndex].stock + item.qty,
                                lastPrice: item.unitPrice
                            };
                        } else {
                            // Create new product if not existing
                            updated.push({
                                id: 'prd-' + Date.now() + Math.random().toString(36).substr(2, 4),
                                name: item.name,
                                sku: item.sku || 'SKU-AUTO',
                                category: 'Umum',
                                variant: item.variant || '-',
                                stock: item.qty,
                                lastPrice: item.unitPrice,
                                estHpp: Math.round(pkg.financials.totalShopeePayment / pkg.items.reduce((a,b)=>a+b.qty,0)),
                                minStock: 5
                            });
                        }
                    });
                    return updated;
                });

                // Mark package stockSynced = true
                setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, stockSynced: true } : p));
                setShowSyncStockModal(null);
                showToast(`Stok dari paket ${pkg.id} berhasil ditambahkan ke Inventaris!`);
            };

            const handleUpdateTracking = async (pkg) => {
                showToast(`Memperbarui tracking resi ${pkg.shipping.resi}...`, 'info');
                const result = await trackingService.track(pkg.shipping.courier, pkg.shipping.resi);
                if (result.success) {
                    setPackages(prev => prev.map(p => {
                        if (p.id === pkg.id) {
                            return {
                                ...p,
                                shipping: {
                                    ...p.shipping,
                                    status: result.currentStatus,
                                    lastLocation: result.lastLocation || p.shipping.lastLocation,
                                    lastUpdate: result.lastUpdate || new Date().toISOString().replace('T', ' ').substring(0, 16)
                                },
                                trackingHistory: result.history || p.trackingHistory
                            };
                        }
                        return p;
                    }));
                    showToast(`Status paket ${pkg.id} berhasil diperbarui: ${result.currentStatus}`);
                }
            };

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
                                <NavItem icon="💵" label="COD Shopee" badge={packages.filter(p=>p.financials.paymentMethod==='COD' && p.financials.codStatus==='Belum dibayar').length} badgeColor="bg-amber-100 text-amber-700" active={activeTab === 'cod'} onClick={() => setActiveTab('cod')} />
                                <NavItem icon="🏬" label="Stok / Produk" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
                                <div className="pt-4 pb-1">
                                    <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Master Data</p>
                                </div>
                                <NavItem icon="🛍️" label="Akun Shopee" active={activeTab === 'accounts'} onClick={() => setActiveTab('accounts')} />
                                <NavItem icon="👤" label="Helper Checkout" active={activeTab === 'helpers'} onClick={() => setActiveTab('helpers')} />
                                <NavItem icon="📈" label="Laporan" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
                                <NavItem icon="⚙️" label="Pengaturan" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                            </nav>
                        </div>

                        {/* Quick Action Button */}
                        <div className="pt-4 border-t border-slate-100">
                            <button 
                                onClick={() => setShowNewPurchaseModal(true)}
                                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-medium py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 text-sm"
                            >
                                <span>➕</span>
                                <span>Tambah Pembelian</span>
                            </button>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
                        {/* Top App Bar */}
                        <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-20 flex items-center justify-between gap-4">
                            <div className="flex items-center space-x-3 md:hidden">
                                <div className="w-8 h-8 rounded-lg bg-rose-500 text-white font-bold flex items-center justify-center text-xs">YN</div>
                                <span className="font-bold text-slate-800">YN Paket</span>
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
                            {(stats.missingResiCount > 0 || stats.pendingStockSyncCount > 0 || stats.codUnpaid > 0) && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                                    {stats.codUnpaid > 0 && (
                                        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-center space-x-2">
                                            <span className="text-base">💰</span>
                                            <div>
                                                <strong className="font-semibold">COD Belum Dibayar: Rp{stats.codUnpaid.toLocaleString('id-ID')}</strong>
                                                <p className="text-rose-600">Siapkan dana tunai/transfer COD.</p>
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
                                    helpers={helpers}
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
                                    helpers={helpers}
                                    onViewDetail={(pkg) => setShowDetailModal(pkg)}
                                    onMarkCodPaid={handleMarkCodPaid}
                                    onSyncStock={(pkg) => setShowSyncStockModal(pkg)}
                                    onUpdateTracking={handleUpdateTracking}
                                    copyToClipboard={copyToClipboard}
                                />
                            )}

                            {activeTab === 'cod' && (
                                <CodDashboardView 
                                    packages={packages.filter(p => p.financials.paymentMethod === 'COD')}
                                    stats={stats}
                                    onMarkCodPaid={handleMarkCodPaid}
                                    onViewDetail={(pkg) => setShowDetailModal(pkg)}
                                />
                            )}

                            {activeTab === 'inventory' && (
                                <InventoryView 
                                    products={products}
                                    packages={packages}
                                    onOpenAddModal={() => setShowProductModal(true)}
                                    onSyncStock={(pkg) => setShowSyncStockModal(pkg)}
                                />
                            )}

                            {activeTab === 'accounts' && (
                                <ShopeeAccountsView 
                                    accounts={shopeeAccounts}
                                    packages={packages}
                                    onAddAccount={() => setShowAccountModal(true)}
                                />
                            )}

                            {activeTab === 'helpers' && (
                                <HelpersView 
                                    helpers={helpers}
                                    packages={packages}
                                    onAddHelper={() => setShowHelperModal(true)}
                                />
                            )}

                            {activeTab === 'reports' && (
                                <ReportsView 
                                    packages={packages}
                                    shopeeAccounts={shopeeAccounts}
                                    helpers={helpers}
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

                    {/* --- MODALS --- */}

                    {/* Add New Purchase Modal */}
                    {showNewPurchaseModal && (
                        <NewPurchaseModal 
                            shopeeAccounts={shopeeAccounts}
                            helpers={helpers}
                            products={products}
                            onClose={() => setShowNewPurchaseModal(false)}
                            onSave={(newPkg) => {
                                setPackages([newPkg, ...packages]);
                                setShowNewPurchaseModal(false);
                                showToast(`Pembelian ${newPkg.id} berhasil ditambahkan!`);
                            }}
                        />
                    )}

                    {/* Package Detail Modal */}
                    {showDetailModal && (
                        <PackageDetailModal 
                            pkg={showDetailModal}
                            shopeeAccounts={shopeeAccounts}
                            helpers={helpers}
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
                            copyToClipboard={copyToClipboard}
                        />
                    )}

                    {/* Add Shopee Account Modal */}
                    {showAccountModal && (
                        <AddAccountModal 
                            onClose={() => setShowAccountModal(false)}
                            onSave={(acc) => {
                                setShopeeAccounts([...shopeeAccounts, acc]);
                                setShowAccountModal(false);
                                showToast('Akun Shopee baru berhasil disimpan!');
                            }}
                        />
                    )}

                    {/* Add Helper Modal */}
                    {showHelperModal && (
                        <AddHelperModal 
                            onClose={() => setShowHelperModal(false)}
                            onSave={(hlp) => {
                                setHelpers([...helpers, hlp]);
                                setShowHelperModal(false);
                                showToast('Helper Checkout baru berhasil disimpan!');
                            }}
                        />
                    )}

                    {/* Add Product Modal */}
                    {showProductModal && (
                        <AddProductModal 
                            onClose={() => setShowProductModal(false)}
                            onSave={(prod) => {
                                setProducts([...products, prod]);
                                setShowProductModal(false);
                                showToast('Produk stok baru berhasil disimpan!');
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
