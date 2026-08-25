import React from 'react';

function StatusBadge({ status }) {
            let style = "bg-slate-100 text-slate-700";
            if (status === 'Berhasil diterima') style = "bg-emerald-100 text-emerald-700";
            else if (status === 'Dalam perjalanan' || status === 'Transit') style = "bg-sky-100 text-sky-700";
            else if (status === 'Dibawa kurir') style = "bg-indigo-100 text-indigo-700";
            else if (status === 'Menunggu dikirim') style = "bg-amber-100 text-amber-700";
            else if (['Gagal antar', 'Retur', 'Bermasalah'].includes(status)) style = "bg-red-100 text-red-700";

            return (
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${style}`}>
                    {status}
                </span>
            );
        }

export default StatusBadge;
