'use client';

// Produktkatalog mit minimalistischen Filtern und Sortierung
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Input, Skeleton } from '@heroui/react';
import { Search } from 'lucide-react';
import { ProductCard } from '../../components/ProductCard';
import { Product } from '../../types';
import { api } from '../../lib/api';

const KATEGORIEN = ['Alle', 'Elektronik', 'Audio', 'Zubehör', 'Lifestyle'];

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');

  const catParam = searchParams.get('cat');
  const selectedCat = useMemo(() => {
    if (!catParam) return 'Alle';
    const found = KATEGORIEN.find((k) => k.toLowerCase() === catParam.toLowerCase());
    return found || catParam;
  }, [catParam]);

  useEffect(() => {
    api.get<{ data: { products: Product[] } }>('/products')
      .then((res) => setProducts(res.data.products))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectCat = (cat: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat === 'Alle') {
      params.delete('cat');
    } else {
      params.set('cat', cat);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    router.push(`/products${query}`);
  };

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const matchCat = selectedCat === 'Alle' || p.category.toLowerCase() === selectedCat.toLowerCase();
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });

    if (sortBy === 'price-asc') list.sort((a, b) => Number(a.price) - Number(b.price));
    if (sortBy === 'price-desc') list.sort((a, b) => Number(b.price) - Number(a.price));
    return list;
  }, [products, selectedCat, search, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Titel & Status */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-2 border-b border-zinc-200 pb-4">
        <div>
          <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">Sortiment</span>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950">
            {selectedCat === 'Alle' ? 'Hardware-Katalog' : `Katalog // ${selectedCat}`}
          </h1>
        </div>
        <span className="text-xs font-mono text-zinc-500">
          {loading ? 'Lade Artikel...' : `${filtered.length} Artikel verfügbar`}
        </span>
      </div>

      {/* Filter- & Suchleiste */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        {/* Kategorie-Pills */}
        <div className="flex flex-wrap gap-1.5">
          {KATEGORIEN.map((cat) => (
            <button
              key={cat}
              onClick={() => handleSelectCat(cat)}
              className={`px-3.5 py-1.5 text-xs font-mono rounded-lg transition-all ${
                selectedCat.toLowerCase() === cat.toLowerCase()
                  ? 'bg-zinc-900 text-white font-bold shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 hover:text-black'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Suchfeld & Sortierung */}
        <div className="flex items-center gap-2">
          <div className="w-full sm:w-60">
            <Input
              isClearable
              size="sm"
              placeholder="Suchen..."
              startContent={<Search size={14} className="text-zinc-400" />}
              value={search}
              onValueChange={setSearch}
              className="font-sans"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-mono bg-zinc-100 border border-zinc-200 rounded-lg px-2.5 py-2 text-zinc-700 hover:border-zinc-400 transition-colors cursor-pointer"
          >
            <option value="default">Sortierung: Standard</option>
            <option value="price-asc">Preis: Aufsteigend</option>
            <option value="price-desc">Preis: Absteigend</option>
          </select>
        </div>
      </div>

      {/* Produktgitter */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-80 rounded-2xl border border-zinc-200 p-4 space-y-3">
              <Skeleton className="rounded-xl h-44 bg-zinc-200" />
              <Skeleton className="w-2/5 h-3 rounded bg-zinc-200" />
              <Skeleton className="w-4/5 h-4 rounded bg-zinc-200" />
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50 space-y-2">
          <p className="font-mono text-sm text-zinc-600">Keine Artikel gefunden.</p>
          <p className="text-xs text-zinc-400">Passe deine Filterkriterien oder den Suchbegriff an.</p>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <div className="border-b border-zinc-200 pb-4">
          <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">Sortiment</span>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950">Hardware-Katalog</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-80 rounded-2xl border border-zinc-200 p-4 space-y-3">
              <Skeleton className="rounded-xl h-44 bg-zinc-200" />
              <Skeleton className="w-2/5 h-3 rounded bg-zinc-200" />
              <Skeleton className="w-4/5 h-4 rounded bg-zinc-200" />
            </div>
          ))}
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
