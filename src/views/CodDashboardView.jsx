import React, { useState, useMemo } from 'react';

// Segmentasi status COD BERDASARKAN STATUS PAKET — ini yang bikin "status paket"
// dan "status COD" jadi dua hal yang jelas terpisah tapi tetap nyambung:
//   - COD baru dianggap "perlu ditindaklanjuti" begitu paketnya BERHASIL DITERIMA.
//   - Selama paket masih dikirim, wajar kalau COD masih "Belum Dibayar" (belum
//     sampai ke pembeli, belum ada uang yang bisa disetor).
//   - Kalau paket GAGAL ANTAR / RETUR, uang COD tidak akan pernah masuk, jadi
//     TIDAK dihitung sebagai piutang aktif yang "menumpuk".
function getCodSegment(pkg) {
    if (pkg.financials.codStatus === 'Sudah dibayar') return 'lunas';
    if (['Gagal Antar', 'Retur'].includes(pkg.shipping.status)) return 'batal';
    if (pkg.shipping.status === 'Berhasil Diterima') return 'perlu-disetor';
    return 'masih-dikirim';
}

const SEGMENTS = [
    { key: 'semua', label: 'Semua' },
    { key: 'perlu-disetor', label: '🚨 Perlu Disetor' },
    { key: 'masih-dikirim', label: 'Masih Dikirim' },
    { key: 'lunas', label: 'Sudah Lunas' },
    { key: 'batal', label: 'Gagal / Retur' },
];

function CodDashboardView({ packages, stats, onMarkCodPaid, onViewDetail }) {
            const [segment, setSegment] = useState('perlu-disetor');

            const segmented = useMemo(() => {
                const withSegment = packages.map(pkg => ({ pkg, segment: getCodSegment(pkg) }));
                const filtered = segment === 'semua' ? withSegment : withSegment.filter(x => x.segment === segment);
                // Yang "perlu disetor" selalu ditaruh paling atas kalau sedang melihat "Semua".
                const order = { 'perlu-disetor': 0, 'masih-dikirim': 1, 'lunas': 2, 'batal': 3 };
                return filtered
                    .sort((a, b) => order[a.segment] - order[b.segment])
                    .map(x => x.pkg);
            }, [packages, segment]);

            return (
                <div className="space-y-6">
                    <div>
                        <h2 className="font-bold text-slate-900 text-xl">Dashboard Pembayaran COD Shopee</h2>
                        <p className="text-slate-500 text-sm">Status COD dipisah dari status pengiriman paket, supaya jelas mana yang benar-benar perlu ditindaklanjuti.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button
                            onClick={() => setSegment('perlu-disetor')}
                            className={`text-left bg-rose-50 border p-4 rounded-2xl transition-all ${segment === 'perlu-disetor' ? 'border-rose-400 ring-2 ring-rose-200' : 'border-rose-200 hover:border-rose-300'}`}
                        >
                            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">🚨 Perlu Disetor</p>
                            <h3 className="text-2xl font-bold text-rose-900 mt-1">Rp{stats.codPerluDisetorTotal.toLocaleString('id-ID')}</h3>
                            <p className="text-xs text-rose-700 mt-1">{stats.codPerluDisetorCount} paket sudah sampai, belum ditandai lunas.</p>
                        </button>
                        <button
                            onClick={() => setSegment('masih-dikirim')}
                            className={`text-left bg-slate-50 border p-4 rounded-2xl transition-all ${segment === 'masih-dikirim' ? 'border-slate-400 ring-2 ring-slate-200' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Masih Dikirim</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">Rp{stats.codBelumSampaiTotal.toLocaleString('id-ID')}</h3>
                            <p className="text-xs text-slate-500 mt-1">{stats.codBelumSampaiCount} paket belum sampai ke pembeli.</p>
                        </button>
                        <button
                            onClick={() => setSegment('lunas')}
                            className={`text-left bg-emerald-50 border p-4 rounded-2xl transition-all ${segment === 'lunas' ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-emerald-200 hover:border-emerald-300'}`}
                        >
                            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Sudah Lunas</p>
                            <h3 className="text-2xl font-bold text-emerald-900 mt-1">Rp{stats.codPaid.toLocaleString('id-ID')}</h3>
                            <p className="text-xs text-emerald-700 mt-1">Pembayaran COD selesai & sudah disetor.</p>
                        </button>
                        <button
                            onClick={() => setSegment('batal')}
                            className={`text-left bg-amber-50 border p-4 rounded-2xl transition-all ${segment === 'batal' ? 'border-amber-400 ring-2 ring-amber-200' : 'border-amber-200 hover:border-amber-300'}`}
                        >
                            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Gagal / Retur</p>
                            <h3 className="text-2xl font-bold text-amber-900 mt-1">Rp{stats.codDibatalkanTotal.toLocaleString('id-ID')}</h3>
                            <p className="text-xs text-amber-700 mt-1">{stats.codDibatalkanCount} paket — tidak perlu ditagih lagi.</p>
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                            <h3 className="font-bold text-slate-800">Daftar Paket COD</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {SEGMENTS.map(s => (
                                    <button
                                        key={s.key}
                                        onClick={() => setSegment(s.key)}
                                        className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                                            segment === s.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase">
                                    <tr>
                                        <th className="p-3">ID Paket</th>
                                        <th className="p-3">Penerima Alamat</th>
                                        <th className="p-3">Kurir & Resi</th>
                                        <th className="p-3">Status Paket</th>
                                        <th className="p-3">Nominal COD</th>
                                        <th className="p-3">Status COD</th>
                                        <th className="p-3 text-right">Tindakan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {segmented.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="p-6 text-center text-slate-400 text-sm">
                                                Tidak ada paket COD di kategori ini.
                                            </td>
                                        </tr>
                                    )}
                                    {segmented.map(pkg => {
                                        const pktSegment = getCodSegment(pkg);
                                        return (
                                            <tr key={pkg.id} className={`hover:bg-slate-50 ${pktSegment === 'perlu-disetor' ? 'bg-rose-50/40' : ''}`}>
                                                <td className="p-3 font-bold text-slate-800">{pkg.id}</td>
                                                <td className="p-3">
                                                    <div className="text-slate-800 font-medium">{pkg.recipient.name}</div>
                                                    <div className="text-xs text-slate-400">{pkg.recipient.phone}</div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="font-medium text-slate-800">{pkg.shipping.courier}</div>
                                                    <div className="text-xs font-mono text-slate-500">{pkg.shipping.resi || '-'}</div>
                                                </td>
                                                <td className="p-3">
                                                    <span className="text-xs font-semibold text-slate-600">{pkg.shipping.status}</span>
                                                </td>
                                                <td className="p-3 font-bold text-slate-900">
                                                    Rp{pkg.financials.totalModal.toLocaleString('id-ID')}
                                                </td>
                                                <td className="p-3">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                        pktSegment === 'lunas' ? 'bg-emerald-100 text-emerald-800' :
                                                        pktSegment === 'perlu-disetor' ? 'bg-rose-100 text-rose-800' :
                                                        pktSegment === 'batal' ? 'bg-amber-100 text-amber-800' :
                                                        'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {pkg.financials.codStatus}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right space-x-2">
                                                    {pktSegment === 'perlu-disetor' && (
                                                        <button 
                                                            onClick={() => onMarkCodPaid(pkg.id)}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                                                        >
                                                            ✓ Tandai Sudah Disetor
                                                        </button>
                                                    )}
                                                    {pktSegment === 'masih-dikirim' && (
                                                        <button 
                                                            onClick={() => onMarkCodPaid(pkg.id)}
                                                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-xs px-3 py-1.5 rounded-lg transition-colors"
                                                            title="Biasanya baru ditandai lunas setelah paket sampai, tapi bisa ditandai lebih awal jika perlu."
                                                        >
                                                            Tandai Lunas
                                                        </button>
                                                    )}
                                                    {pktSegment === 'batal' && (
                                                        <span className="text-xs text-amber-600 italic px-2">Tidak perlu ditagih</span>
                                                    )}
                                                    <button 
                                                        onClick={() => onViewDetail(pkg)}
                                                        className="text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1"
                                                    >
                                                        Detail
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            );
        }

export default CodDashboardView;
