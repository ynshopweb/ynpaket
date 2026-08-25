import React from 'react';

function StatCard({ title, value, color, icon }) {
            return (
                <div className={`p-3 rounded-2xl border ${color} flex flex-col justify-between`}>
                    <div className="flex items-center justify-between text-xs font-medium">
                        <span className="truncate">{title}</span>
                        <span>{icon}</span>
                    </div>
                    <div className="text-xl font-bold mt-2">{value}</div>
                </div>
            );
        }

export default StatCard;
