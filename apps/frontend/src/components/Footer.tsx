import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 mt-20 py-8 text-center text-xs text-zinc-500 dark:text-zinc-400 transition-colors">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© 2026 TechShop Deutschland. Entwickelt mit Next.js, HeroUI, Express & Prisma.</p>
        <div className="flex gap-4 font-mono">
          <Link href="/products" className="hover:text-black dark:hover:text-white transition-colors">Katalog</Link>
          <Link href="/cart" className="hover:text-black dark:hover:text-white transition-colors">Warenkorb</Link>
          <Link href="/login" className="hover:text-black dark:hover:text-white transition-colors">Anmelden</Link>
        </div>
      </div>
    </footer>
  );
};
