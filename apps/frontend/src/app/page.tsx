// Startseite: Kuratierte Arbeitsplatz-Kultur ohne AI-Marketing-Klischees
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Truck, ShieldCheck } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types';

export const dynamic = 'force-dynamic';

async function getTopProducts(): Promise<Product[]> {
  try {
    const res = await fetch('http://localhost:5000/api/v1/products', { cache: 'no-store' });
    const json = await res.json();
    return (json.data?.products || []).slice(0, 4);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const products = await getTopProducts();

  return (
    <div className="space-y-16 pb-20">
      {/* Editorial Hero */}
      <section className="border-b border-zinc-200/80 bg-zinc-50/50">
        <div className="max-w-7xl mx-auto px-6 py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <span className="inline-block text-[11px] font-mono tracking-widest uppercase text-zinc-500 bg-white border border-zinc-200 px-3 py-1 rounded-full">
              Kollektion 2026 // Arbeitsplatz-Kultur
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-zinc-950 leading-[1.08]">
              Präzision & Haptik für deinen Arbeitsplatz.
            </h1>
            <p className="text-zinc-600 text-base sm:text-lg max-w-xl leading-relaxed">
              Kuratierte mechanische Eingabegeräte, Akustik und Schreibtisch-Architektur. Geschaffen für Menschen, die täglich am Rechner konzentriert arbeiten.
            </p>
            <div className="flex flex-wrap gap-3 pt-2 font-mono text-xs">
              <Link
                href="/products"
                className="bg-zinc-950 text-white px-5 py-3 rounded-xl hover:bg-zinc-800 transition-colors inline-flex items-center gap-2 font-semibold"
              >
                <span>Katalog durchstöbern</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/login"
                className="bg-white text-zinc-800 border border-zinc-200 px-5 py-3 rounded-xl hover:border-zinc-400 transition-colors font-semibold"
              >
                Rollen-Login (Mitarbeiter & Admin)
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 relative aspect-square sm:aspect-[4/3] rounded-3xl overflow-hidden border border-zinc-200 shadow-sm bg-zinc-100">
            <Image
              src="https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=1200&q=85"
              alt="Mechanische Tastatur Nahaufnahme"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
            <div className="absolute bottom-4 left-4 right-4 bg-zinc-950/80 backdrop-blur-md text-white p-3 rounded-xl text-xs font-mono flex justify-between items-center">
              <span>EDITION // Q1 PRO</span>
              <span className="text-zinc-400">ALUMINIUM GEHÄUSE</span>
            </div>
          </div>
        </div>
      </section>

      {/* Produkt-Kollektion */}
      <section className="max-w-7xl mx-auto px-6 space-y-8">
        <div className="flex justify-between items-end border-b border-zinc-200 pb-4">
          <div>
            <span className="text-xs font-mono text-zinc-400 tracking-wider uppercase">Sortiment</span>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Ausgewählte Favoriten</h2>
          </div>
          <Link href="/products" className="text-xs font-mono font-bold text-zinc-900 hover:text-zinc-600 inline-flex items-center gap-1">
            <span>Alle ansehen</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Wertversprechen / E-Commerce Vertrauen */}
      <section className="max-w-7xl mx-auto px-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 rounded-3xl bg-zinc-100/70 border border-zinc-200">
          <div className="space-y-2">
            <Truck size={22} className="text-zinc-900" />
            <h3 className="font-bold text-sm text-zinc-900">Versand aus Berlin</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Bestellungen bis 14:00 Uhr werden noch am selben Werktag mit DHL GoGreen klimaneutral übergeben.
            </p>
          </div>
          <div className="space-y-2">
            <ShieldCheck size={22} className="text-zinc-900" />
            <h3 className="font-bold text-sm text-zinc-900">2 Jahre Herstellergarantie</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Wir führen ausschließlich langlebige Hardware aus soliden Werkstoffen wie CNC-Aluminium und Edelstahl.
            </p>
          </div>
          <div className="space-y-2">
            <Sparkles size={22} className="text-zinc-900" />
            <h3 className="font-bold text-sm text-zinc-900">30 Tage Ausprobieren</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Tastgefühl und Akustik muss man erleben. Teste jedes Produkt 30 Tage in deiner gewohnten Arbeitsumgebung.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
