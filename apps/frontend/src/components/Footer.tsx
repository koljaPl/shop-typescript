import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-default-200 bg-white/60 mt-20 py-8 text-center text-xs text-default-500">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© 2026 TechShop Deutschland. Entwickelt mit Next.js, HeroUI, Express & Prisma.</p>
        <div className="flex gap-4">
          <Link href="/products" className="hover:underline">Katalog</Link>
          <Link href="/cart" className="hover:underline">Warenkorb</Link>
          <Link href="/login" className="hover:underline">Anmelden</Link>
        </div>
      </div>
    </footer>
  );
};
