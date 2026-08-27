# TechShop: Schlanke Full-Stack E-Commerce Architektur

Ein schlanker, pragmatischer und produktionsreifer Online-Shop mit **Next.js 14**, **HeroUI**, **Express.js**, **TypeScript**, **Prisma ORM** und **PostgreSQL**.

Das gesamte Projekt umfasst nur **~1.470 Zeilen Code** für das komplette Frontend und Backend bei vollem Funktionsumfang.

---

## 1. Projektstruktur & Architektur

```
shop-typescript/
├── apps/
│   ├── backend/                       # Express.js API (Port 5000)
│   │   ├── prisma/
│   │   │   ├── schema.prisma          # PostgreSQL Schema (User, Product, Order, OrderItem)
│   │   │   └── seed.ts                # Seeding für deutsche Beispieldaten & Testkonten
│   │   └── src/
│   │       └── server.ts              # Vollständiger Express-Server (Zod, Auth, RBAC, Transaktionen)
│   │
│   └── frontend/                      # Next.js 14 App Router + HeroUI (Port 3001)
│       └── src/
│           ├── app/
│           │   ├── layout.tsx         # Root-Layout mit HeroUI Provider & Navbar
│           │   ├── page.tsx           # Startseite mit Hero-Bereich & Produkt-Highlights
│           │   ├── products/          # Katalog & Produktdetails mit Live-Bestand
│           │   ├── cart/              # Persistenter Warenkorb & Checkout-Simulation
│           │   ├── login/             # Anmeldung mit 1-Klick Schnell-Login
│           │   └── admin/             # Einheitliches Mitarbeiter- & Admin-Dashboard
│           ├── components/            # Navbar, ProductCard, StockBadge, Footer
│           └── lib/                   # Zustand-Store (Auth + Cart) & API-Client
```

---

## 2. Das 3-Stufen-Rechtesystem (RBAC)

| Funktion | Kunde (Gast/User) | Mitarbeiter | Administrator |
| :--- | :---: | :---: | :---: |
| Produkte durchsuchen | ✅ | ✅ | ✅ |
| In den Warenkorb & Kasse | ✅ | ✅ | ✅ |
| Backoffice aufrufen (`/admin`) | ❌ (403 Verboten) | ✅ | ✅ |
| Lagerbestand anpassen (`PATCH`) | ❌ | ✅ | ✅ |
| Produktdetails ändern (`PUT`) | ❌ | ✅ | ✅ |
| Neue Produkte anlegen (`POST`) | ❌ | ❌ (403 Verboten) | ✅ |
| Produkte löschen (`DELETE`) | ❌ | ❌ (403 Verboten) | ✅ |
| Rollen verwalten (`PATCH`) | ❌ | ❌ (403 Verboten) | ✅ |

> **Sicherheitshinweis:** Alle Berechtigungen werden strikt über die Express-Middleware auf dem Server geprüft. Nicht autorisierte Anfragen erhalten sofort `403 Forbidden`.

---

## 3. Test-Benutzerkonten (Schnell-Login)

Auf der Seite `/login` gibt es **1-Klick-Buttons** für alle Rollen.  
Das Standard-Passwort für alle Konten lautet: `Password123!`

* **Administrator:** `admin@shop.de` (Voller Zugriff inkl. Rollenverwaltung & Löschen)
* **Mitarbeiter:** `mitarbeiter@shop.de` (Lagerbestand & Details bearbeiten)
* **Kunde:** `kunde@shop.de` (Einkaufen & atomarer Checkout)

---

## 4. Schnellstart & Docker (1 Befehl)

Das gesamte System (PostgreSQL 17, Backend & Frontend) startet mit **einem einzigen Befehl**:

```bash
docker compose up --build -d
```

* **Frontend:** [http://localhost:3001](http://localhost:3001)
* **Backend API:** [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
* **Healthcheck:** [http://localhost:5000/health](http://localhost:5000/health)

Zum Beenden:
```bash
docker compose down
```

---

## 5. Automatisierte Tests ausführen

Die integrierte Test-Suite prüft Authentifizierung, Zod-Validierung, 3-Stufen-RBAC und atomaren Checkout:

```bash
npm test
```
*Ergebnis: 16 von 16 Tests bestanden (Dauer < 1 Sekunde).*