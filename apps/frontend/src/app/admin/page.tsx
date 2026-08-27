'use client';

// Minimalistisches Backoffice für Mitarbeiter und Administratoren
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react';
import { Plus, Minus, Edit, Trash2, RefreshCw, ShieldAlert, Search } from 'lucide-react';
import { useAuthStore } from '../../lib/store';
import { Product, User, Role } from '../../types';
import { api } from '../../lib/api';
import { StockBadge } from '../../components/StockBadge';

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const isEmployee = user?.role === 'EMPLOYEE';

  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'products' | 'users'>('products');
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', category: 'Elektronik', price: '', stock: '', imageUrl: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const pRes = await api.get<{ data: { products: Product[] } }>('/products');
      setProducts(pRes.data.products);
      if (isAdmin) setUsers((await api.get<{ data: { users: User[] } }>('/users')).data.users);
    } catch (e: any) { setMsg({ text: e.message, ok: false }); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user && (isAdmin || isEmployee)) loadData(); }, [user, isAdmin, isEmployee]);

  if (authLoading) return <div className="p-16 text-center font-mono text-xs text-zinc-400">Prüfe Rechte...</div>;
  if (!user || (!isAdmin && !isEmployee)) {
    return (
      <div className="max-w-sm mx-auto my-24 p-8 text-center bg-white rounded-3xl border space-y-4">
        <ShieldAlert size={36} className="mx-auto text-zinc-400" />
        <h2 className="font-black text-base">Zugriff verweigert (403)</h2>
        <p className="text-xs text-zinc-500">Nur für Mitarbeiter und Administratoren.</p>
        <Link href="/login" className="inline-block bg-zinc-900 text-white text-xs font-mono px-4 py-2 rounded-xl">Anmelden</Link>
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
      const payload = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock, 10) };
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

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-3xl border border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-zinc-950">Warenwirtschaft // Backoffice</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-100 border">{user.role}</span>
          </div>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">{user.name} ({user.email})</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => { setEditId(null); setForm({ name: '', description: '', category: 'Elektronik', price: '', stock: '', imageUrl: '' }); onOpen(); }}
              className="bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-mono px-3.5 py-2 rounded-xl inline-flex items-center gap-1 font-bold"
            >
              <Plus size={13} /> Neues Produkt
            </button>
          )}
          <button onClick={loadData} className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-mono px-3 py-2 rounded-xl inline-flex items-center gap-1.5">
            <RefreshCw size={13} /> Aktualisieren
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-3 text-xs font-mono rounded-xl border flex justify-between ${msg.ok ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="font-bold">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 pb-2 font-mono text-xs">
        <button onClick={() => setTab('products')} className={`px-3 py-1.5 rounded-lg ${tab === 'products' ? 'bg-zinc-950 text-white font-bold' : 'text-zinc-500'}`}>
          Lagerbestand ({products.length})
        </button>
        {isAdmin && (
          <button onClick={() => setTab('users')} className={`px-3 py-1.5 rounded-lg ${tab === 'users' ? 'bg-zinc-950 text-white font-bold' : 'text-zinc-500'}`}>
            Benutzer & Rollen ({users.length})
          </button>
        )}
      </div>

      {tab === 'products' ? (
        <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden">
          <div className="p-4 border-b border-zinc-100 flex justify-between items-center">
            <div className="w-64"><Input size="sm" placeholder="Artikel filtern..." startContent={<Search size={14} className="text-zinc-400" />} value={search} onValueChange={setSearch} /></div>
            <span className="text-[11px] font-mono text-zinc-400">Bestand per Klick (+ / -) anpassen</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-100 font-mono text-[10px] text-zinc-400 uppercase">
              <tr><th className="p-4">Artikel</th><th className="p-4">Kategorie</th><th className="p-4">Preis</th><th className="p-4">Bestand</th><th className="p-4 text-right">Aktionen</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50/50">
                  <td className="p-4 flex items-center gap-3">
                    <div className="relative w-10 h-10 bg-zinc-100 rounded-lg overflow-hidden shrink-0">
                      {p.imageUrl && <Image src={p.imageUrl} alt={p.name} fill sizes="40px" className="object-cover" />}
                    </div>
                    <div><p className="font-bold text-zinc-900">{p.name}</p><span className="font-mono text-[10px] text-zinc-400">ID: {p.id.slice(-6)}</span></div>
                  </td>
                  <td className="p-4 font-mono text-zinc-500">{p.category}</td>
                  <td className="p-4 font-mono font-bold">{Number(p.price).toFixed(2).replace('.', ',')} €</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <StockBadge stock={p.stock} />
                      <div className="flex border rounded font-mono text-xs bg-zinc-50">
                        <button className="px-2 py-0.5 hover:bg-zinc-200" onClick={() => changeStock(p, -1)}><Minus size={11} /></button>
                        <span className="px-2 font-bold">{p.stock}</span>
                        <button className="px-2 py-0.5 hover:bg-zinc-200" onClick={() => changeStock(p, 1)}><Plus size={11} /></button>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setEditId(p.id); setForm({ name: p.name, description: p.description, category: p.category, price: String(p.price), stock: String(p.stock), imageUrl: p.imageUrl || '' }); onOpen(); }} className="p-1.5 text-zinc-500 hover:text-black">
                        <Edit size={14} />
                      </button>
                      {isAdmin && <button onClick={() => deleteProduct(p)} className="p-1.5 text-zinc-400 hover:text-red-600"><Trash2 size={14} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-50 border-b border-zinc-100 text-[10px] text-zinc-400 uppercase">
              <tr><th className="p-4">Benutzer</th><th className="p-4">E-Mail</th><th className="p-4">Bestellungen</th><th className="p-4">Aktuelle Rolle</th><th className="p-4 text-right">Rolle Ändern</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="p-4 font-bold text-zinc-900">{u.name}</td>
                  <td className="p-4 text-zinc-500">{u.email}</td>
                  <td className="p-4">{u._count?.orders ?? 0}</td>
                  <td className="p-4"><span className="px-2 py-0.5 rounded text-[10px] bg-zinc-100 border font-bold">{u.role}</span></td>
                  <td className="p-4 text-right">
                    <select className="border rounded px-2 py-1 bg-white text-xs" value={u.role} disabled={u.id === user.id} onChange={(e) => changeRole(u.id, e.target.value as Role)}>
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

      {/* Modal: Produkt anlegen / bearbeiten */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
        <ModalContent>
          <ModalHeader className="text-sm font-bold font-mono">{editId ? 'Produkt bearbeiten' : 'Neues Produkt anlegen'}</ModalHeader>
          <ModalBody className="space-y-2 text-xs">
            <Input label="Name" size="sm" value={form.name} onValueChange={(v) => setForm({ ...form, name: v })} isRequired />
            <Input label="Beschreibung" size="sm" value={form.description} onValueChange={(v) => setForm({ ...form, description: v })} isRequired />
            <div className="grid grid-cols-3 gap-2">
              <Input label="Kategorie" size="sm" value={form.category} onValueChange={(v) => setForm({ ...form, category: v })} />
              <Input label="Preis (€)" size="sm" type="number" step="0.01" value={form.price} onValueChange={(v) => setForm({ ...form, price: v })} isRequired />
              <Input label="Lagerbestand" size="sm" type="number" value={form.stock} onValueChange={(v) => setForm({ ...form, stock: v })} isRequired />
            </div>
            <Input label="Bild-URL" size="sm" value={form.imageUrl} onValueChange={(v) => setForm({ ...form, imageUrl: v })} />
          </ModalBody>
          <ModalFooter className="font-mono text-xs">
            <Button size="sm" variant="light" onPress={onClose}>Abbrechen</Button>
            <Button size="sm" className="bg-zinc-950 text-white font-bold" onPress={saveProduct}>Speichern</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
