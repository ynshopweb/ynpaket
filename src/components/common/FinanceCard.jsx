import React from 'react';

function FinanceCard({ label, amount, subtitle, bg, icon }) {
            return (
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-500">{label}</p>
                        <h4 className="text-xl font-bold text-slate-900 mt-1">{amount}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl ${bg} text-white flex items-center justify-center text-lg shadow-sm shrink-0`}>
                        {icon}
                    </div>
                </div>
            );
        }

export default FinanceCard;
