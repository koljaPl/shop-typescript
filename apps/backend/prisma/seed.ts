// Seed-Skript für deutsche Testdaten
import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 3 Test-Benutzer anlegen
  await prisma.user.createMany({
    data: [
      { email: 'admin@shop.de', name: 'Anna Admin', passwordHash, role: Role.ADMIN },
      { email: 'mitarbeiter@shop.de', name: 'Max Mitarbeiter', passwordHash, role: Role.EMPLOYEE },
      { email: 'kunde@shop.de', name: 'Klaus Kunde', passwordHash, role: Role.CUSTOMER },
    ],
  });

  // Beispielprodukte mit unterschiedlichen Beständen
  await prisma.product.createMany({
    data: [
      { name: 'Keychron Q1 Pro Tastatur', description: 'Kabellose 75% mechanische Tastatur mit Aluminium-Gehäuse und RGB.', category: 'Elektronik', price: 199.99, stock: 15, imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80' },
      { name: 'Logitech MX Master 3S Maus', description: 'Ergonomische Präzisionsmaus mit 8K DPI Sensor und leisen Klicks.', category: 'Elektronik', price: 99.99, stock: 25, imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80' },
      { name: 'Sony WH-1000XM5 ANC Kopfhörer', description: 'Branchenführende Geräuschunterdrückung und brillanter High-Res Klang.', category: 'Audio', price: 349.99, stock: 7, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80' },
      { name: 'LG UltraFine 27" 4K Monitor', description: 'UHD IPS Display mit ergonomischem Schwenkarm und USB-C 60W Power.', category: 'Elektronik', price: 499.00, stock: 3, imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80' },
      { name: 'Fjällräven Kånken Rucksack', description: 'Robuster Klassiker aus strapazierfähigem Vinylon-Gewebe.', category: 'Zubehör', price: 85.00, stock: 18, imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80' },
      { name: 'Yeti Rambler 750ml Flasche', description: 'Doppelwandige Vakuum-Edelstahlflasche. Ausverkauft für UI-Tests.', category: 'Lifestyle', price: 39.90, stock: 0, imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80' },
      { name: 'BenQ ScreenBar LED Lampe', description: 'Asymmetrische Schreibtisch-Lampe ohne Blendung auf dem Monitor.', category: 'Zubehör', price: 109.00, stock: 12, imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80' },
    ],
  });

  console.log('✅ Testdaten initialisiert (Passwort: Password123!)');
}

main().finally(() => prisma.$disconnect());
