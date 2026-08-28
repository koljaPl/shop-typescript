'use client';

// Minimalistisches Backoffice für Mitarbeiter und Administratoren mit Dark Mode und System-Logs
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react';
import { Plus, Minus, Edit, Trash2, RefreshCw, ShieldAlert, Search, Terminal, Activity, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../lib/store';
import { Product, User, Role } from '../../types';
import { api } from '../../lib/api';
import { StockBadge } from '../../components/StockBadge';

interface LogItem {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'HTTP';
  message: string;
  meta?: Record<string, any>;
}

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const isEmployee = user?.role === 'EMPLOYEE';

  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'products' | 'users' | 'logs'>('products');
  const [search, setSearch] = useState('');
  const [logFilter, setLogFilter] = useState<'ALL' | 'HTTP' | 'INFO' | 'WARN' | 'ERROR'>('ALL');
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', category: 'Elektronik', price: '', stock: '', imageUrl: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const pRes = await api.get<{ data: { products: Product[] } }>('/products');
      setProducts(pRes.data.products);
      if (isAdmin) {
        setUsers((await api.get<{ data: { users: User[] } }>('/users')).data.users);
        const lRes = await api.get<{ data: { logs: LogItem[] } }>('/system/logs?limit=100').catch(() => null);
        if (lRes?.data?.logs) setLogs(lRes.data.logs);
      }
    } catch (e: any) { setMsg({ text: e.message, ok: false }); }
    finally { setLoading(false); }
  };

  const loadLogs = async () => {
    try {
      const lRes = await api.get<{ data: { logs: LogItem[] } }>('/system/logs?limit=100');
      setLogs(lRes.data.logs);
      setMsg({ text: 'System-Logs aktualisiert.', ok: true });
    } catch (e: any) { setMsg({ text: e.message, ok: false }); }
  };

  const clearLogs = async () => {
    if (!confirm('Möchten Sie wirklich alle System-Logs leeren?')) return;
    try {
      await api.delete('/system/logs');
      setLogs([]);
      setMsg({ text: 'System-Logs geleert.', ok: true });
    } catch (e: any) { setMsg({ text: e.message, ok: false }); }
  };

  useEffect(() => { if (user && (isAdmin || isEmployee)) loadData(); }, [user, isAdmin, isEmployee]);

  if (authLoading) return <div className="p-16 text-center font-mono text-xs text-zinc-400">Prüfe Rechte...</div>;
  if (!user || (!isAdmin && !isEmployee)) {
    return (
      <div className="max-w-sm mx-auto my-24 p-8 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-4">
        <ShieldAlert size={36} className="mx-auto text-zinc-400" />
        <h2 className="font-black text-base text-zinc-950 dark:text-white">Zugriff verweigert (403)</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Nur für Mitarbeiter und Administratoren.</p>
        <Link href="/login" className="inline-block bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-mono px-4 py-2 rounded-xl font-bold">
          Anmelden
        </Link>
      </div>
    );
  }

  const changeStock = async (prod: Product, delta: number) => {
    const newStock = Math.max(0, prod.stock + delta);
    try {
      await api.patch(`/products/${prod.id}/stock`, { stock: newStock });
      setProducts((prev) => prev.map((p) => (p.id === prod.id ? { ...p, stock: newStock } : p)));
      setMsg({ text: `Lagerbestand für "${prod.name}" auf ${newStock} gesetzt.`, ok: true });
    } catch (e: any) { setMsg({ text: e.message, ok: false }); }
  };

  const saveProduct = async () => {
    try {
      const sanitizedPrice = form.price.replace(',', '.').trim();
      const sanitizedStock = form.stock.trim();
      const priceNum = parseFloat(sanitizedPrice);
      const stockNum = parseInt(sanitizedStock, 10);

      if (isNaN(priceNum) || priceNum <= 0) {
        setMsg({ text: 'Bitte einen gültigen Preis (> 0 €) eingeben.', ok: false });
        return;
      }
      if (isNaN(stockNum) || stockNum < 0) {
        setMsg({ text: 'Bitte einen gültigen Lagerbestand (>= 0) eingeben.', ok: false });
        return;
      }
      if (form.description.trim().length < 5) {
        setMsg({ text: 'Die Beschreibung muss mindestens 5 Zeichen lang sein.', ok: false });
        return;
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim() || 'Elektronik',
        price: priceNum,
        stock: stockNum,
        imageUrl: form.imageUrl.trim() || null,
      };

      if (editId) {
        const res = await api.put<{ data: { product: Product } }>(`/products/${editId}`, payload);
        setProducts((prev) => prev.map((p) => (p.id === editId ? res.data.product : p)));
        setMsg({ text: 'Produkt aktualisiert.', ok: true });
      } else {
        const res = await api.post<{ data: { product: Product } }>('/products', payload);
        setProducts((prev) => [res.data.product, ...prev]);
        setMsg({ text: 'Neues Produkt angelegt.', ok: true });
      }
      onClose();
    } catch (e: any) { setMsg({ text: e.message, ok: false }); }
  };

  const deleteProduct = async (p: Product) => {
    if (!confirm(`"${p.name}" wirklich löschen?`)) return;
    try {
      await api.delete(`/products/${p.id}`);
      setProducts((prev) => prev.filter((item) => item.id !== p.id));
      setMsg({ text: `Produkt gelöscht.`, ok: true });
    } catch (e: any) { setMsg({ text: e.message, ok: false }); }
  };

  const changeRole = async (userId: string, role: Role) => {
    try {
      await api.patch(`/users/${userId}/role`, { role });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      setMsg({ text: 'Rolle aktualisiert.', ok: true });
    } catch (e: any) { setMsg({ text: e.message, ok: false }); }
  };

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const filteredLogs = logs.filter((l) => (logFilter === 'ALL' ? true : l.level === logFilter));

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-zinc-950 dark:text-white">Warenwirtschaft // Backoffice</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200">
              {user.role}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">{user.name} ({user.email})</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => { setEditId(null); setForm({ name: '', description: '', category: 'Elektronik', price: '', stock: '', imageUrl: '' }); onOpen(); }}
              className="bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-mono px-3.5 py-2 rounded-xl inline-flex items-center gap-1 font-bold"
            >
              <Plus size={13} /> Neues Produkt
            </button>
          )}
          <button onClick={loadData} className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-mono px-3 py-2 rounded-xl inline-flex items-center gap-1.5">
            <RefreshCw size={13} /> Aktualisieren
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-3 text-xs font-mono rounded-xl border flex justify-between ${msg.ok ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'}`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="font-bold">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2 font-mono text-xs">
        <button
          onClick={() => setTab('products')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${tab === 'products' ? 'bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 font-bold' : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'}`}
        >
          Lagerbestand ({products.length})
        </button>
        {isAdmin && (
          <>
            <button
              onClick={() => setTab('users')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${tab === 'users' ? 'bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 font-bold' : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'}`}
            >
              Benutzer & Rollen ({users.length})
            </button>
            <button
              onClick={() => { setTab('logs'); loadLogs(); }}
              className={`px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors ${tab === 'logs' ? 'bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 font-bold' : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'}`}
            >
              <Terminal size={13} />
              <span>System-Logs ({logs.length})</span>
            </button>
          </>
        )}
      </div>

      {/* Tab: Produkte */}
      {tab === 'products' && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
            <div className="w-64"><Input size="sm" placeholder="Artikel filtern..." startContent={<Search size={14} className="text-zinc-400" />} value={search} onValueChange={setSearch} /></div>
            <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">Bestand per Klick (+ / -) anpassen</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-100 dark:border-zinc-800 font-mono text-[10px] text-zinc-400 dark:text-zinc-500 uppercase">
              <tr><th className="p-4">Artikel</th><th className="p-4">Kategorie</th><th className="p-4">Preis</th><th className="p-4">Bestand</th><th className="p-4 text-right">Aktionen</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                  <td className="p-4 flex items-center gap-3">
                    <div className="relative w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden shrink-0">
                      {p.imageUrl && <Image src={p.imageUrl} alt={p.name} fill sizes="40px" className="object-cover" />}
                    </div>
                    <div><p className="font-bold text-zinc-900 dark:text-zinc-100">{p.name}</p><span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">ID: {p.id.slice(-6)}</span></div>
                  </td>
                  <td className="p-4 font-mono text-zinc-500 dark:text-zinc-400">{p.category}</td>
                  <td className="p-4 font-mono font-bold text-zinc-900 dark:text-zinc-100">{Number(p.price).toFixed(2).replace('.', ',')} €</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <StockBadge stock={p.stock} />
                      <div className="flex border border-zinc-200 dark:border-zinc-700 rounded font-mono text-xs bg-zinc-50 dark:bg-zinc-800">
                        <button className="px-2 py-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300" onClick={() => changeStock(p, -1)}><Minus size={11} /></button>
                        <span className="px-2 font-bold text-zinc-900 dark:text-zinc-100">{p.stock}</span>
                        <button className="px-2 py-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300" onClick={() => changeStock(p, 1)}><Plus size={11} /></button>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setEditId(p.id); setForm({ name: p.name, description: p.description, category: p.category, price: String(p.price), stock: String(p.stock), imageUrl: p.imageUrl || '' }); onOpen(); }} className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white">
                        <Edit size={14} />
                      </button>
                      {isAdmin && <button onClick={() => deleteProduct(p)} className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"><Trash2 size={14} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Benutzer */}
      {tab === 'users' && isAdmin && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 dark:text-zinc-500 uppercase">
              <tr><th className="p-4">Benutzer</th><th className="p-4">E-Mail</th><th className="p-4">Bestellungen</th><th className="p-4">Aktuelle Rolle</th><th className="p-4 text-right">Rolle Ändern</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100">{u.name}</td>
                  <td className="p-4 text-zinc-500 dark:text-zinc-400">{u.email}</td>
                  <td className="p-4 text-zinc-700 dark:text-zinc-300">{u._count?.orders ?? 0}</td>
                  <td className="p-4"><span className="px-2 py-0.5 rounded text-[10px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-bold text-zinc-800 dark:text-zinc-200">{u.role}</span></td>
                  <td className="p-4 text-right">
                    <select className="border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs" value={u.role} disabled={u.id === user.id} onChange={(e) => changeRole(u.id, e.target.value as Role)}>
                      <option value="CUSTOMER">KUNDE</option>
                      <option value="EMPLOYEE">MITARBEITER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: System-Logs */}
      {tab === 'logs' && isAdmin && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden font-mono text-xs">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-400 uppercase">Filter:</span>
              {(['ALL', 'HTTP', 'INFO', 'WARN', 'ERROR'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLogFilter(lvl)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors ${
                    logFilter === lvl
                      ? 'bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 font-bold'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadLogs}
                className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5"
              >
                <RefreshCw size={12} /> Aktualisieren
              </button>
              <button
                onClick={clearLogs}
                className="bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 text-xs px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 border border-red-200 dark:border-red-800"
              >
                <Trash2 size={12} /> Logs leeren
              </button>
            </div>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 max-h-[550px] overflow-y-auto bg-zinc-950 text-zinc-300 p-3 rounded-b-3xl space-y-1">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => {
                let badgeColor = 'text-cyan-400 bg-cyan-950/60 border-cyan-800';
                if (log.level === 'INFO') badgeColor = 'text-emerald-400 bg-emerald-950/60 border-emerald-800';
                if (log.level === 'WARN') badgeColor = 'text-amber-400 bg-amber-950/60 border-amber-800';
                if (log.level === 'ERROR') badgeColor = 'text-red-400 bg-red-950/60 border-red-800';

                return (
                  <div key={log.id} className="py-1.5 px-2 hover:bg-zinc-900 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[11px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-zinc-500 shrink-0 text-[10px]">
                        {new Date(log.timestamp).toLocaleTimeString('de-DE')}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${badgeColor}`}>
                        {log.level}
                      </span>
                      <span className="text-zinc-200 truncate">{log.message}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-zinc-500 text-xs">
                Keine Logs für diesen Filter vorhanden.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Produkt anlegen / bearbeiten */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
        <ModalContent className="dark:bg-zinc-900 dark:border dark:border-zinc-800 text-zinc-900 dark:text-white">
          <ModalHeader className="text-sm font-bold font-mono border-b dark:border-zinc-800">{editId ? 'Produkt bearbeiten' : 'Neues Produkt anlegen'}</ModalHeader>
          <ModalBody className="space-y-2 text-xs py-4">
            <Input label="Name" size="sm" value={form.name} onValueChange={(v) => setForm({ ...form, name: v })} isRequired />
            <Input label="Beschreibung (min. 5 Zeichen)" size="sm" value={form.description} onValueChange={(v) => setForm({ ...form, description: v })} isRequired />
            <div className="grid grid-cols-3 gap-2">
              <Input label="Kategorie" size="sm" value={form.category} onValueChange={(v) => setForm({ ...form, category: v })} />
              <Input label="Preis (€, z.B. 49.90)" size="sm" value={form.price} onValueChange={(v) => setForm({ ...form, price: v })} isRequired />
              <Input label="Lagerbestand" size="sm" type="number" value={form.stock} onValueChange={(v) => setForm({ ...form, stock: v })} isRequired />
            </div>
            <Input label="Bild-URL (https://... oder leer)" size="sm" value={form.imageUrl} onValueChange={(v) => setForm({ ...form, imageUrl: v })} />
          </ModalBody>
          <ModalFooter className="font-mono text-xs border-t dark:border-zinc-800">
            <Button size="sm" variant="light" onPress={onClose}>Abbrechen</Button>
            <Button size="sm" className="bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 font-bold" onPress={saveProduct}>Speichern</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
