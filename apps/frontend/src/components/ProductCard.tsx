'use client';

// Minimalistische Produktkarte mit klaren Linien und Editorial-Ästhetik
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@heroui/react';
import { Plus } from 'lucide-react';
import { Product } from '../types';
import { StockBadge } from './StockBadge';
import { useCartStore } from '../lib/store';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const addItem = useCartStore((s) => s.addItem);
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="group flex flex-col justify-between bg-white border border-zinc-200/80 rounded-2xl overflow-hidden hover:border-zinc-300 hover:shadow-sm transition-all duration-200">
      <Link href={`/products/${product.id}`} className="block relative w-full aspect-[4/3] bg-zinc-100/70 overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs font-mono">Kein Bild</div>
        )}
        <div className="absolute top-2.5 left-2.5">
          <StockBadge stock={product.stock} />
        </div>
      </Link>

      <div className="p-4 space-y-3 flex flex-col justify-between flex-grow">
        <div className="space-y-1">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest font-mono">
            {product.category}
          </span>
          <Link href={`/products/${product.id}`}>
            <h3 className="font-semibold text-sm text-zinc-900 group-hover:text-black transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-zinc-500 line-clamp-1 leading-relaxed">{product.description}</p>
        </div>

        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
          <div>
            <span className="text-base font-bold text-zinc-900 tracking-tight">
              {Number(product.price).toFixed(2).replace('.', ',')} €
            </span>
            <span className="block text-[10px] text-zinc-400">inkl. MwSt.</span>
          </div>

          <Button
            size="sm"
            className="bg-zinc-900 text-white hover:bg-zinc-800 font-medium text-xs px-3 min-w-0 h-8 rounded-lg shadow-none"
            isDisabled={isOutOfStock}
            startContent={!isOutOfStock && <Plus size={14} />}
            onPress={() => addItem(product, 1)}
          >
            {isOutOfStock ? 'Ausverkauft' : 'Hinzufügen'}
          </Button>
        </div>
      </div>
    </div>
  );
};
