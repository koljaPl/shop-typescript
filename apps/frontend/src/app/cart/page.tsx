'use client';

// Warenkorb mit transparenter MwSt.-Berechnung und atomarem Checkout
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@heroui/react';
import { Trash2, ShoppingBag, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useCartStore } from '../../lib/store';
import { api } from '../../lib/api';
import { Order } from '../../types';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice, isHydrated } = useCartStore();
  const [checkingOut, setCheckingOut] = useState(false);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'klarna' | 'paypal'>('card');
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted || !isHydrated) return null;

  const handleCheckout = async () => {
    try {
      setCheckingOut(true);
      setCheckoutError(null);
      const res = await api.post<{ data: { order: Order } }>('/orders/checkout', {
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      });
      setSuccessOrder(res.data.order);
      clearCart();
    } catch (err: any) {
      setCheckoutError(err.message || 'Bestellung fehlgeschlagen.');
    } finally { setCheckingOut(false); }
  };

  if (successOrder) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl border border-zinc-200 shadow-sm space-y-4 text-center">
        <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto"><CheckCircle2 size={20} /></div>
        <h1 className="text-xl font-black text-zinc-950">Vielen Dank für Ihre Bestellung!</h1>
        <p className="text-xs text-zinc-500">Der Lagerbestand wurde in der Datenbank atomar verbucht.</p>
        <div className="bg-zinc-50 p-3 rounded-xl font-mono text-xs space-y-1 text-left">
          <div className="flex justify-between"><span className="text-zinc-400">Bestellnummer:</span><span>{successOrder.id}</span></div>
          <div className="flex justify-between font-bold border-t pt-1"><span>Gesamtbetrag:</span><span>{Number(successOrder.totalAmount).toFixed(2).replace('.', ',')} €</span></div>
        </div>
        <Link href="/products" className="inline-block bg-zinc-900 text-white text-xs font-mono px-4 py-2 rounded-xl">Weiter einkaufen</Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto my-24 p-8 text-center bg-white rounded-3xl border border-zinc-200 space-y-3">
        <ShoppingBag size={24} className="mx-auto text-zinc-400" />
        <h2 className="text-base font-black text-zinc-900">Dein Warenkorb ist leer.</h2>
        <Link href="/products" className="inline-block bg-zinc-900 text-white text-xs font-mono px-4 py-2 rounded-xl">Katalog ansehen</Link>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const shipping = subtotal >= 100 ? 0 : 4.90;
  const vat = subtotal - (subtotal / 1.19);
  const total = subtotal + shipping;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div className="flex justify-between items-end border-b pb-4">
        <h1 className="text-2xl font-black text-zinc-950">Warenkorb</h1>
        <Link href="/products" className="text-xs font-mono text-zinc-400 hover:text-black inline-flex items-center gap-1"><ArrowLeft size={12} /> Weiter einkaufen</Link>
      </div>

      {checkoutError && <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-mono flex items-center gap-2"><AlertCircle size={14} />{checkoutError}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-3">
          {items.map((item) => (
            <div key={item.product.id} className="p-3 bg-white border border-zinc-200 rounded-2xl flex items-center gap-3">
              <div className="relative w-14 h-14 bg-zinc-100 rounded-lg overflow-hidden shrink-0">
                {item.product.imageUrl && <Image src={item.product.imageUrl} alt={item.product.name} fill sizes="56px" className="object-cover" />}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs truncate pr-2">{item.product.name}</span>
                  <span className="font-mono font-bold text-xs">{(Number(item.product.price) * item.quantity).toFixed(2).replace('.', ',')} €</span>
                </div>
                <div className="flex justify-between items-center pt-1.5">
                  <div className="flex border rounded overflow-hidden font-mono text-xs bg-zinc-50">
                    <button className="px-2 py-0.5 hover:bg-zinc-200" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>-</button>
                    <span className="px-2 font-bold">{item.quantity}</span>
                    <button className="px-2 py-0.5 hover:bg-zinc-200" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                  </div>
                  <button onClick={() => removeItem(item.product.id)} className="text-zinc-400 hover:text-red-600 p-1"><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
          <button onClick={clearCart} className="text-xs font-mono text-zinc-400 hover:text-red-600">Warenkorb leeren</button>
        </div>

        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-3xl p-5 space-y-4 shadow-sm font-mono text-xs">
          <h3 className="font-bold text-sm text-zinc-900 font-sans">Bestellübersicht</h3>
          <div className="space-y-1.5 text-zinc-500">
            <div className="flex justify-between"><span>Zwischensumme</span><span>{(subtotal - vat).toFixed(2).replace('.', ',')} €</span></div>
            <div className="flex justify-between"><span>MwSt. (19%)</span><span>{vat.toFixed(2).replace('.', ',')} €</span></div>
            <div className="flex justify-between"><span>Versand</span><span>{shipping === 0 ? 'KOSTENLOS' : `${shipping.toFixed(2).replace('.', ',')} €`}</span></div>
            <div className="pt-2 border-t flex justify-between text-sm font-bold text-zinc-950"><span>Gesamtsumme</span><span>{total.toFixed(2).replace('.', ',')} €</span></div>
          </div>

          <div className="space-y-1 pt-1">
            <span className="text-[10px] text-zinc-400 uppercase">Zahlungsart</span>
            <div className="grid grid-cols-3 gap-1 text-[11px]">
              {(['card', 'klarna', 'paypal'] as const).map((m) => (
                <button key={m} onClick={() => setPaymentMethod(m)} className={`py-1.5 rounded-lg border ${paymentMethod === m ? 'border-zinc-950 bg-zinc-900 text-white' : 'border-zinc-200 text-zinc-600'}`}>
                  {m === 'card' ? 'Karte' : m === 'klarna' ? 'Rechnung' : 'PayPal'}
                </button>
              ))}
            </div>
          </div>

          <Button className="w-full bg-zinc-950 text-white font-mono text-xs uppercase tracking-wider py-5 rounded-xl font-bold" isLoading={checkingOut} onPress={handleCheckout}>
            Zahlungspflichtig Bestellen
          </Button>
        </div>
      </div>
    </div>
  );
}
