'use client';

// Warenkorb mit transparenter MwSt.-Berechnung, atomarem Checkout und Dark Mode
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
      <div className="max-w-md mx-auto my-20 p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 text-center">
        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={20} />
        </div>
        <h1 className="text-xl font-black text-zinc-950 dark:text-white">Vielen Dank für Ihre Bestellung!</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Der Lagerbestand wurde in der Datenbank atomar verbucht.</p>
        <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-xl font-mono text-xs space-y-1 text-left border dark:border-zinc-800">
          <div className="flex justify-between"><span className="text-zinc-400 dark:text-zinc-500">Bestellnummer:</span><span className="text-zinc-800 dark:text-zinc-200">{successOrder.id}</span></div>
          <div className="flex justify-between font-bold border-t border-zinc-200 dark:border-zinc-700 pt-1 text-zinc-950 dark:text-white"><span>Gesamtbetrag:</span><span>{Number(successOrder.totalAmount).toFixed(2).replace('.', ',')} €</span></div>
        </div>
        <Link href="/products" className="inline-block bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-mono px-4 py-2 rounded-xl font-bold">
          Weiter einkaufen
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto my-24 p-8 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-3">
        <ShoppingBag size={24} className="mx-auto text-zinc-400 dark:text-zinc-500" />
        <h2 className="text-base font-black text-zinc-900 dark:text-white">Dein Warenkorb ist leer.</h2>
        <Link href="/products" className="inline-block bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-mono px-4 py-2 rounded-xl font-bold">
          Katalog ansehen
        </Link>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const shipping = subtotal >= 100 ? 0 : 4.90;
  const vat = subtotal - (subtotal / 1.19);
  const total = subtotal + shipping;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div className="flex justify-between items-end border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <h1 className="text-2xl font-black text-zinc-950 dark:text-white">Warenkorb</h1>
        <Link href="/products" className="text-xs font-mono text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white inline-flex items-center gap-1">
          <ArrowLeft size={12} /> Weiter einkaufen
        </Link>
      </div>

      {checkoutError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-xl text-xs font-mono flex items-center gap-2">
          <AlertCircle size={14} />{checkoutError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-3">
          {items.map((item) => (
            <div key={item.product.id} className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center gap-3">
              <div className="relative w-14 h-14 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden shrink-0">
                {item.product.imageUrl && <Image src={item.product.imageUrl} alt={item.product.name} fill sizes="56px" className="object-cover" />}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs truncate pr-2 text-zinc-900 dark:text-zinc-100">{item.product.name}</span>
                  <span className="font-mono font-bold text-xs text-zinc-950 dark:text-white">{(Number(item.product.price) * item.quantity).toFixed(2).replace('.', ',')} €</span>
                </div>
                <div className="flex justify-between items-center pt-1.5">
                  <div className="flex border border-zinc-200 dark:border-zinc-700 rounded overflow-hidden font-mono text-xs bg-zinc-50 dark:bg-zinc-800">
                    <button className="px-2 py-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>-</button>
                    <span className="px-2 font-bold text-zinc-900 dark:text-zinc-100">{item.quantity}</span>
                    <button className="px-2 py-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                  </div>
                  <button onClick={() => removeItem(item.product.id)} className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400 p-1 transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
          <button onClick={clearCart} className="text-xs font-mono text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-colors">
            Warenkorb leeren
          </button>
        </div>

        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 space-y-4 shadow-sm font-mono text-xs">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white font-sans">Bestellübersicht</h3>
          <div className="space-y-1.5 text-zinc-500 dark:text-zinc-400">
            <div className="flex justify-between"><span>Zwischensumme</span><span className="text-zinc-800 dark:text-zinc-200">{(subtotal - vat).toFixed(2).replace('.', ',')} €</span></div>
            <div className="flex justify-between"><span>MwSt. (19%)</span><span className="text-zinc-800 dark:text-zinc-200">{vat.toFixed(2).replace('.', ',')} €</span></div>
            <div className="flex justify-between"><span>Versand</span><span className="text-zinc-800 dark:text-zinc-200">{shipping === 0 ? 'KOSTENLOS' : `${shipping.toFixed(2).replace('.', ',')} €`}</span></div>
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between text-sm font-bold text-zinc-950 dark:text-white"><span>Gesamtsumme</span><span>{total.toFixed(2).replace('.', ',')} €</span></div>
          </div>

          <div className="space-y-1 pt-1">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase">Zahlungsart</span>
            <div className="grid grid-cols-3 gap-1 text-[11px]">
              {(['card', 'klarna', 'paypal'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`py-1.5 rounded-lg border transition-colors ${
                    paymentMethod === m
                      ? 'border-zinc-950 dark:border-white bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-bold'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                  }`}
                >
                  {m === 'card' ? 'Karte' : m === 'klarna' ? 'Rechnung' : 'PayPal'}
                </button>
              ))}
            </div>
          </div>

          <Button
            className="w-full bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 font-mono text-xs uppercase tracking-wider py-5 rounded-xl font-bold"
            isLoading={checkingOut}
            onPress={handleCheckout}
          >
            Zahlungspflichtig Bestellen
          </Button>
        </div>
      </div>
    </div>
  );
}
