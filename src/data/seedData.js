const initialShopeeAccounts = [
            { id: 'acc-1', label: 'Shopee Utama', username: 'yn_official_store', phone: '081234567890', status: 'Aktif', note: 'Akun utama belanja stok' },
            { id: 'acc-2', label: 'Shopee 2 (Cadangan)', username: 'yn_diskon_voucher', phone: '081987654321', status: 'Aktif', note: 'Khusus klaim voucher ongkir' },
            { id: 'acc-3', label: 'Shopee Keluarga', username: 'rina_shop_helper', phone: '085211223344', status: 'Aktif', note: 'Pinjam akun adik' },
        ];

const initialHelpers = [
            { id: 'hlp-1', name: 'Saya (Pemilik)', phone: '081200001111', status: 'Aktif', note: 'Checkout mandiri' },
            { id: 'hlp-2', name: 'Rina', phone: '081233334444', status: 'Aktif', note: 'Adik / Admin 1' },
            { id: 'hlp-3', name: 'Ani', phone: '085788889999', status: 'Aktif', note: 'Karyawan Toko' },
            { id: 'hlp-4', name: 'Budi', phone: '087812123434', status: 'Aktif', note: 'Saudara' }
        ];

const initialProducts = [
            { id: 'prd-1', name: 'Serum Glow Brightening A', sku: 'SRM-GLW-01', category: 'Skincare', variant: '30ml', stock: 45, lastPrice: 25000, estHpp: 21500, minStock: 10 },
            { id: 'prd-2', name: 'Sunscreen UV Shield B', sku: 'SNS-UV-02', category: 'Skincare', variant: '50ml', stock: 12, lastPrice: 30000, estHpp: 26000, minStock: 15 },
            { id: 'prd-3', name: 'Hijab Voal Premium', sku: 'HJB-VL-BLK', category: 'Fashion', variant: 'Hitam', stock: 80, lastPrice: 20000, estHpp: 17200, minStock: 20 }
        ];

const initialPackages = [
            {
                id: 'YN-20260825-001',
                shopeeOrderId: '250825ABC123',
                checkoutDate: '2026-08-25',
                shopeeAccountId: 'acc-1',
                helperId: 'hlp-1',
                recipient: {
                    name: 'Gudang Utama (Rumah)',
                    phone: '081200001111',
                    address: 'Jl. Merdeka No. 45, RT 02/RW 05',
                    district: 'Ciputat',
                    city: 'Tangerang Selatan',
                    province: 'Banten',
                    postalCode: '15411',
                    note: 'Pagar warna hitam, titip di teras'
                },
                items: [
                    { productId: 'prd-1', name: 'Serum Glow Brightening A', sku: 'SRM-GLW-01', variant: '30ml', qty: 10, unitPrice: 25000, subtotal: 250000 },
                    { productId: 'prd-2', name: 'Sunscreen UV Shield B', sku: 'SNS-UV-02', variant: '50ml', qty: 5, unitPrice: 30000, subtotal: 150000 }
                ],
                financials: {
                    itemsTotal: 400000,
                    voucher: 50000,
                    serviceFee: 4000,
                    otherFee: 0,
                    totalShopeePayment: 354000,
                    paymentMethod: 'COD',
                    codStatus: 'Belum dibayar',
                    codPaidDate: null
                },
                shipping: {
                    courier: 'SPX Express',
                    resi: 'SPX123456789ID',
                    shipDate: '2026-08-25',
                    estArrival: '2026-08-27',
                    status: 'Dalam perjalanan',
                    lastLocation: 'DC Tangerang Hub',
                    lastUpdate: '2026-08-25 16:20'
                },
                trackingHistory: [
                    { time: '2026-08-25 08:10', location: 'Jakarta South Hub', status: 'Paket telah diterima di hub asal' },
                    { time: '2026-08-25 16:20', location: 'DC Tangerang Hub', status: 'Paket dalam perjalanan ke hub tujuan' }
                ],
                stockSynced: false,
                notes: 'Order saat promo 8.8 Shopee Live'
            },
            {
                id: 'YN-20260825-002',
                shopeeOrderId: '250825XYZ999',
                checkoutDate: '2026-08-24',
                shopeeAccountId: 'acc-2',
                helperId: 'hlp-2',
                recipient: {
                    name: 'Alamat Rina (Titip Stok)',
                    phone: '081233334444',
                    address: 'Jl. Melati 3 No. 12',
                    district: 'Pamulang',
                    city: 'Tangerang Selatan',
                    province: 'Banten',
                    postalCode: '15417',
                    note: 'Depan Warung Madura'
                },
                items: [
                    { productId: 'prd-3', name: 'Hijab Voal Premium', sku: 'HJB-VL-BLK', variant: 'Hitam', qty: 20, unitPrice: 20000, subtotal: 400000 }
                ],
                financials: {
                    itemsTotal: 400000,
                    voucher: 60000,
                    serviceFee: 3000,
                    otherFee: 0,
                    totalShopeePayment: 343000,
                    paymentMethod: 'ShopeePay',
                    codStatus: 'Sudah dibayar',
                    codPaidDate: '2026-08-24 14:00'
                },
                shipping: {
                    courier: 'J&T',
                    resi: 'JX987654321',
                    shipDate: '2026-08-24',
                    estArrival: '2026-08-25',
                    status: 'Berhasil diterima',
                    lastLocation: 'Alamat Penerima',
                    lastUpdate: '2026-08-25 11:15'
                },
                trackingHistory: [
                    { time: '2026-08-24 18:00', location: 'Drop Center J&T', status: 'Paket di-pickup kurir' },
                    { time: '2026-08-25 11:15', location: 'Alamat Penerima', status: 'Paket diterima oleh Rina' }
                ],
                stockSynced: false, // Ready to be added to house inventory
                notes: 'Potongan voucher akun cadangan'
            }
        ];

export { initialShopeeAccounts, initialHelpers, initialProducts, initialPackages };
