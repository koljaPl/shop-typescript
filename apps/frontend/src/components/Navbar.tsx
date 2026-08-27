'use client';

// Minimalistische Navigationsleiste mit Brand-Identität und Status
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/react';
import { ShoppingBag, Shield, LogOut, User as UserIcon } from 'lucide-react';
import { useAuthStore, useCartStore } from '../lib/store';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { getTotalItems, isHydrated } = useCartStore();

  const [count, setCount] = useState(0);
  useEffect(() => {
    if (isHydrated) setCount(getTotalItems());
  }, [isHydrated, getTotalItems]);

  const isStaff = user?.role === 'EMPLOYEE' || user?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-200/80">
      {/* Oberer Ankündigungsbalken */}
      <div className="bg-zinc-900 text-zinc-300 text-[11px] font-mono tracking-wider py-1.5 px-6 text-center">
        <span>VERSAND AUS BERLIN // KOSTENLOS AB 100 € // 30 TAGE RÜCKGABERECHT</span>
      </div>

      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-mono font-bold text-sm tracking-tighter">
            W//
          </div>
          <div className="leading-tight">
            <span className="font-bold tracking-tight text-zinc-900 text-base block font-mono">WERKSTATT</span>
            <span className="text-[10px] tracking-widest text-zinc-400 font-mono block -mt-1">HARDWARE & DESIGN</span>
          </div>
        </Link>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium tracking-wide uppercase font-mono text-zinc-600">
          <Link href="/products" className="hover:text-black transition-colors">Katalog</Link>
          <Link href="/products?cat=Elektronik" className="hover:text-black transition-colors">Eingabe & Desk</Link>
          <Link href="/products?cat=Audio" className="hover:text-black transition-colors">Akustik</Link>
          {isStaff && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              <Shield size={12} />
              <span>Backoffice ({user?.role === 'ADMIN' ? 'Admin' : 'Mitarbeiter'})</span>
            </Link>
          )}
        </nav>

        {/* Aktionen */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-600 hidden sm:inline">
                {user.name.split(' ')[0]} <span className="text-zinc-400">({user.role})</span>
              </span>
              <Button
                size="sm"
                variant="light"
                className="text-zinc-500 hover:text-red-600 min-w-0 p-1.5 h-8"
                onPress={async () => { await logout(); router.push('/'); }}
                aria-label="Abmelden"
              >
                <LogOut size={16} />
              </Button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs font-mono font-medium text-zinc-700 hover:text-black px-2.5 py-1 rounded-md border border-zinc-200 hover:border-zinc-400 transition-colors inline-flex items-center gap-1.5"
            >
              <UserIcon size={13} />
              <span>Anmelden</span>
            </Link>
          )}

          {/* Warenkorb */}
          <Link
            href="/cart"
            className="relative p-2 text-zinc-700 hover:text-black transition-colors rounded-lg hover:bg-zinc-100 flex items-center"
            aria-label="Warenkorb"
          >
            <ShoppingBag size={19} />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-zinc-900 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};
