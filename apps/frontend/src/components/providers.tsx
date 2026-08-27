'use client';

// HeroUI Provider und automatischer Auth-Check beim Laden
import React, { useEffect } from 'react';
import { HeroUIProvider } from '@heroui/react';
import { useAuthStore } from '../lib/store';

export function Providers({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <HeroUIProvider>{children}</HeroUIProvider>;
}
