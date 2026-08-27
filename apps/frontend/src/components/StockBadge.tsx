'use client';

// Minimalistischer Lagerstatus-Indikator im modernen Editorial-Stil
import React from 'react';

export const StockBadge: React.FC<{ stock: number }> = ({ stock }) => {
  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-600 bg-zinc-100/90 px-2.5 py-0.5 rounded-full border border-zinc-200">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
        Ausverkauft
      </span>
    );
  }
  if (stock <= 5) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/70">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Nur {stock} Exemplare
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Verfügbar ({stock})
    </span>
  );
};
