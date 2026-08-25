import React from 'react';

function MobileNavItem({ icon, label, active, highlight, onClick }) {
            if (highlight) {
                return (
                    <button onClick={onClick} className="-mt-5 flex flex-col items-center">
                        <div className="w-11 h-11 rounded-full bg-rose-500 text-white flex items-center justify-center text-lg shadow-lg border-2 border-white">
                            {icon}
                        </div>
                        <span className="text-[10px] text-rose-600 font-medium mt-0.5">{label}</span>
                    </button>
                );
            }
            return (
                <button onClick={onClick} className={`flex flex-col items-center py-1 ${active ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                    <span className="text-base">{icon}</span>
                    <span className="text-[10px]">{label}</span>
                </button>
            );
        }

export default MobileNavItem;
