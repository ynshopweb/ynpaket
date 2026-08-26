import React from 'react';

function StatusBadge({ status, source }) {
            let style = "bg-slate-100 text-slate-700"; // default: Draft & fallback
            if (status === 'Berhasil Diterima') style = "bg-emerald-100 text-emerald-700";
            else if (status === 'Dikirim') style = "bg-sky-100 text-sky-700";
            else if (status === 'Dibawa Kurir') style = "bg-indigo-100 text-indigo-700";
            else if (status === 'Dikemas') style = "bg-amber-100 text-amber-700";
            else if (status === 'Gagal Antar' || status === 'Retur') style = "bg-red-100 text-red-700";

            return (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${style}`}>
                    {status}
                    {source === 'manual' && <span title="Diubah manual oleh admin/user">✋</span>}
                </span>
            );
        }

export default StatusBadge;
