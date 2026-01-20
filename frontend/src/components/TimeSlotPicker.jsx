import React from 'react';
import { FaClock, FaCheckCircle } from 'react-icons/fa';

const TimeSlotPicker = ({ slots, selectedSlot, onSelect, loading }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-14 bg-zinc-800/50 rounded-2xl border border-zinc-700/50"></div>
                ))}
            </div>
        );
    }

    if (!slots || slots.length === 0) {
        return (
            <div className="p-8 bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-800 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-600 mb-3">
                    <FaClock size={20} />
                </div>
                <p className="text-zinc-500 text-sm font-medium">Today's slots completed.</p>
                <p className="text-zinc-600 text-[10px] uppercase font-bold tracking-tighter mt-1">Please check back tomorrow</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {slots.map((slot, index) => {
                const isSelected = selectedSlot?.start === slot.start;
                return (
                    <button
                        key={index}
                        type="button"
                        onClick={() => onSelect(slot)}
                        className={`group relative p-4 rounded-2xl text-xs font-black transition-all duration-300 border flex flex-col items-center justify-center gap-1 ${isSelected
                            ? 'bg-white border-white text-black shadow-2xl shadow-white/10 scale-[1.05] z-10'
                            : 'bg-zinc-800/40 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800/80 hover:text-white'
                            }`}
                    >
                        {isSelected && (
                            <div className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-full shadow-lg border-2 border-zinc-900 animate-bounce">
                                <FaCheckCircle size={10} />
                            </div>
                        )}
                        <span className={`uppercase tracking-tighter ${isSelected ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                            {slot.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default TimeSlotPicker;
