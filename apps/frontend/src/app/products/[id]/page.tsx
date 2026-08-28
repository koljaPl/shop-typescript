'use client';

// Produktdetailseite im Studio-Look
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Button, Skeleton } from '@heroui/react';
import { Plus, Minus, Check, Truck, ShieldCheck, RotateCcw } from 'lucide-react';
import { Product } from '../../../types';
import { StockBadge } from '../../../components/StockBadge';
import { useCartStore } from '../../../lib/store';
import { api } from '../../../lib/api';

export default function ProductDetailPage() {
  const { id } = useParams() as { id: string };
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    if (id) {
      api.get<{ data: { product: Product } }>(`/products/${id}`)
        .then((r) => setProduct(r.data.product))
        .catch(() => setProduct(null))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div className="max-w-4xl mx-auto p-12 grid md:grid-cols-2 gap-8"><Skeleton className="h-72 rounded-2xl" /><div className="space-y-3"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-10 w-2/3" /><Skeleton className="h-20" /></div></div>;
  if (!product) return <div className="max-w-sm mx-auto my-20 p-6 text-center border rounded-2xl"><p className="text-xs">Produkt nicht gefunden.</p><Link href="/products" className="text-xs underline mt-2 block">Zurück</Link></div>;

  const outOfStock = product.stock <= 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div className="text-xs font-mono text-zinc-400"><Link href="/products" className="hover:text-black">Katalog</Link> / <span>{product.category}</span> / <span className="text-zinc-800">{product.name}</span></div>
      <div className="grid md:grid-cols-2 gap-10 items-start">
        <div className="relative aspect-square bg-zinc-100 rounded-3xl overflow-hidden border border-zinc-200">
          {product.imageUrl && <Image src={product.imageUrl} alt={product.name} fill priority sizes="50vw" className="object-cover" />}
          <div className="absolute top-3 left-3"><StockBadge stock={product.stock} /></div>
        </div>
        <div className="space-y-5">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">ART-NR. {product.id.slice(-6).toUpperCase()}</span>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-950">{product.name}</h1>
            <p className="text-2xl font-mono font-black text-zinc-900 pt-1">{Number(product.price).toFixed(2).replace('.', ',')} € <span className="text-[11px] text-zinc-400 font-normal">inkl. 19% MwSt.</span></p>
          </div>
          <p className="text-zinc-600 text-xs leading-relaxed border-t border-b py-3">{product.description}</p>
          {!outOfStock && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-500">Menge:</span>
              <div className="flex border rounded-lg overflow-hidden font-mono text-xs bg-zinc-50">
                <button className="px-2.5 py-1 hover:bg-zinc-200" onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus size={11} /></button>
                <span className="px-3 py-1 font-bold">{qty}</span>
                <button className="px-2.5 py-1 hover:bg-zinc-200" onClick={() => setQty((q) => Math.min(product.stock, q + 1))}><Plus size={11} /></button>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">({product.stock} verfügbar)</span>
            </div>
          )}
          <Button
            className={`w-full font-mono text-xs uppercase tracking-wider py-5 rounded-xl font-bold ${added ? 'bg-emerald-600 text-white' : 'bg-zinc-950 text-white hover:bg-zinc-800'}`}
            isDisabled={outOfStock}
            onPress={() => { addItem(product, qty); setAdded(true); setTimeout(() => setAdded(false), 2000); }}
          >
            {outOfStock ? 'Zurzeit vergriffen' : added ? 'Im Warenkorb abgelegt ✓' : `${qty}x In den Warenkorb`}
          </Button>
          <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] font-mono text-zinc-500 text-center">
            <div className="p-2 bg-zinc-50 rounded-xl"><Truck size={13} className="mx-auto text-zinc-900 mb-0.5" />DHL GoGreen</div>
            <div className="p-2 bg-zinc-50 rounded-xl"><ShieldCheck size={13} className="mx-auto text-zinc-900 mb-0.5" />2 J. Garantie</div>
            <div className="p-2 bg-zinc-50 rounded-xl"><RotateCcw size={13} className="mx-auto text-zinc-900 mb-0.5" />30 Tage Retoure</div>
          </div>
        </div>
      </div>
    </div>
  );
}
