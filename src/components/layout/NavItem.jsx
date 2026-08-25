import React from 'react';

function NavItem({ icon, label, badge, badgeColor, active, onClick }) {
            return (
                <button 
                    onClick={onClick}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                        active ? 'bg-rose-50 text-rose-600 font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                >
                    <div className="flex items-center space-x-3">
                        <span className="text-base">{icon}</span>
                        <span>{label}</span>
                    </div>
                    {badge !== undefined && badge > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${badgeColor || 'bg-slate-100 text-slate-600'}`}>
                            {badge}
                        </span>
                    )}
                </button>
            );
        }

export default NavItem;
