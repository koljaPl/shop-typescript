'use client';

// Minimalistischer Lagerstatus-Indikator im modernen Editorial-Stil mit Dark Mode
import React from 'react';

export const StockBadge: React.FC<{ stock: number }> = ({ stock }) => {
  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100/90 dark:bg-zinc-800/90 px-2.5 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500" />
        Ausverkauft
      </span>
    );
  }
  if (stock <= 5) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200/70 dark:border-amber-800/70">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Nur {stock} Exemplare
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200/70 dark:border-emerald-800/70">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Verfügbar ({stock})
    </span>
  );
};
