'use client';

// Authentifizierung mit Entwickler-Schnell-Presets
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/react';
import { useAuthStore } from '../../lib/store';

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') await login(email, password);
      else await register(name, email, password);
      router.push('/products');
    } catch (err: any) { setError(err.message || 'Anmeldung fehlgeschlagen'); }
    finally { setLoading(false); }
  };

  const quickFill = (em: string) => { setEmail(em); setPassword('Password123!'); setMode('login'); };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-5">
        <div className="space-y-1 text-center">
          <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-400">WERKSTATT // AUTH</span>
          <h1 className="text-2xl font-black text-zinc-950">{mode === 'login' ? 'Anmeldung' : 'Registrieren'}</h1>
        </div>

        <div className="flex p-1 bg-zinc-100 rounded-xl font-mono text-xs">
          <button onClick={() => setMode('login')} className={`flex-1 py-1.5 rounded-lg ${mode === 'login' ? 'bg-white font-bold shadow-sm' : 'text-zinc-500'}`}>Anmelden</button>
          <button onClick={() => setMode('register')} className={`flex-1 py-1.5 rounded-lg ${mode === 'register' ? 'bg-white font-bold shadow-sm' : 'text-zinc-500'}`}>Registrieren</button>
        </div>

        {error && <div className="p-3 text-xs font-mono bg-red-50 text-red-700 border border-red-200 rounded-xl">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3 bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm text-xs">
          {mode === 'register' && (
            <div><label className="font-mono text-[10px] uppercase text-zinc-400 block mb-1">Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border rounded-xl" /></div>
          )}
          <div><label className="font-mono text-[10px] uppercase text-zinc-400 block mb-1">E-Mail</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 border rounded-xl" /></div>
          <div><label className="font-mono text-[10px] uppercase text-zinc-400 block mb-1">Passwort</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 border rounded-xl" /></div>
          <Button type="submit" className="w-full bg-zinc-950 text-white font-mono text-xs uppercase tracking-wider py-5 rounded-xl font-bold mt-2" isLoading={loading}>
            {mode === 'login' ? 'Anmelden' : 'Konto anlegen'}
          </Button>
        </form>

        <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-1.5 text-[11px] font-mono">
          <span className="text-[10px] text-zinc-400 uppercase block tracking-wider">Testkonten (Passwort: Password123!):</span>
          <div className="grid grid-cols-3 gap-1">
            <button onClick={() => quickFill('admin@shop.de')} className="p-1 bg-white border rounded hover:border-zinc-400">Admin</button>
            <button onClick={() => quickFill('mitarbeiter@shop.de')} className="p-1 bg-white border rounded hover:border-zinc-400">Mitarbeiter</button>
            <button onClick={() => quickFill('kunde@shop.de')} className="p-1 bg-white border rounded hover:border-zinc-400">Kunde</button>
          </div>
        </div>
      </div>
    </div>
  );
}
