// ============================================================================
// Automatisierte API- & Integrations-Tests für TechShop
// Testet: Authentifizierung, Zod-Validierung, 3-Stufen RBAC & Atomaren Checkout
// ============================================================================

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, ChildProcess } from 'node:child_process';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000/api/v1';
const HEALTH_URL = 'http://localhost:5000/health';

describe('TechShop API & RBAC Test-Suite', () => {
  let serverProcess: ChildProcess | null = null;
  let adminToken = '';
  let adminId = '';
  let employeeToken = '';
  let customerToken = '';
  let testProductId = '';

  before(async () => {
    // 1. Prüfen, ob Server bereits läuft. Falls nicht, starten.
    let isRunning = false;
    try {
      const ping = await fetch(HEALTH_URL);
      if (ping.ok) isRunning = true;
    } catch {}

    if (!isRunning) {
      serverProcess = spawn('npx', ['tsx', 'src/server.ts'], {
        cwd: process.cwd(),
        stdio: 'ignore',
        env: { ...process.env, PORT: '5000' },
      });

      // Bis zu 10 Sekunden auf Server-Start warten
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 500));
        try {
          const res = await fetch(HEALTH_URL);
          if (res.ok) {
            isRunning = true;
            break;
          }
        } catch {}
      }
    }

    assert.ok(isRunning, 'Backend-Server konnte nicht gestartet werden oder ist nicht erreichbar');

    // 2. Admin Login
    const aRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@shop.de', password: 'Password123!' }),
    });
    const aData = await aRes.json();
    assert.equal(aRes.status, 200);
    adminToken = aData.data.token;
    adminId = aData.data.user.id;

    // 3. Mitarbeiter Login
    const eRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'mitarbeiter@shop.de', password: 'Password123!' }),
    });
    const eData = await eRes.json();
    assert.equal(eRes.status, 200);
    employeeToken = eData.data.token;

    // 4. Kunde Login
    const cRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'kunde@shop.de', password: 'Password123!' }),
    });
    const cData = await cRes.json();
    assert.equal(cRes.status, 200);
    customerToken = cData.data.token;

    // 5. Testprodukt-ID ermitteln
    const pRes = await fetch(`${BASE_URL}/products`);
    const pData = await pRes.json();
    assert.ok(pData.data.products.length > 0, 'Produkte müssen in der DB vorhanden sein');
    testProductId = pData.data.products[0].id;
  });

  after(() => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
  });

  // --- 1. AUTHENTIFIZIERUNG ---
  test('Auth: Erfolgreicher Login liefert Token und Rolle', async () => {
    assert.ok(adminToken.length > 20);
    assert.ok(employeeToken.length > 20);
    assert.ok(customerToken.length > 20);
  });

  test('Auth: Falsches Passwort wird mit 401 abgelehnt', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@shop.de', password: 'FalschesPasswort!' }),
    });
    assert.equal(res.status, 401);
  });

  test('Auth: /auth/me liefert aktuelles Benutzerprofil mit gültigem Token', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.data.user.role, 'EMPLOYEE');
  });

  // --- 2. ZOD VALIDIERUNG ---
  test('Zod: Ungültige E-Mail bei Registrierung wird mit 400 abgewiesen', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'keine-email', password: 'Password123!' }),
    });
    assert.equal(res.status, 400);
  });

  test('Zod: Negativer Preis bei Produkterstellung wird mit 400 abgewiesen', async () => {
    const res = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: 'Ungültig', description: 'Beschreibung', price: -25.50, stock: 10 }),
    });
    assert.equal(res.status, 400);
  });

  test('Zod: Negativer Lagerbestand bei Update wird mit 400 abgewiesen', async () => {
    const res = await fetch(`${BASE_URL}/products/${testProductId}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${employeeToken}` },
      body: JSON.stringify({ stock: -5 }),
    });
    assert.equal(res.status, 400);
  });

  // --- 3. ROLLENBASIERTE ZUGRIFFSKONTROLLE (RBAC) ---
  test('RBAC: Mitarbeiter KANN Produktdetails anpassen (200)', async () => {
    const res = await fetch(`${BASE_URL}/products/${testProductId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${employeeToken}` },
      body: JSON.stringify({ description: 'Aktualisierte Testbeschreibung für Mitarbeiter' }),
    });
    assert.equal(res.status, 200);
  });

  test('RBAC: Mitarbeiter KANN Lagerbestand aktualisieren (200)', async () => {
    const res = await fetch(`${BASE_URL}/products/${testProductId}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${employeeToken}` },
      body: JSON.stringify({ stock: 25 }),
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.product.stock, 25);
  });

  test('RBAC: Mitarbeiter DARF KEIN neues Produkt anlegen (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${employeeToken}` },
      body: JSON.stringify({ name: 'Illegal', description: 'Verboten', price: 99, stock: 5 }),
    });
    assert.equal(res.status, 403);
  });

  test('RBAC: Mitarbeiter DARF KEIN Produkt löschen (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/products/${testProductId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    assert.equal(res.status, 403);
  });

  test('RBAC: Mitarbeiter DARF Benutzerverwaltung NICHT einsehen (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    assert.equal(res.status, 403);
  });

  test('RBAC: Admin KANN neues Produkt anlegen (201 Created)', async () => {
    const res = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Automatischer Testartikel',
        description: 'Wird im Test erstellt und wieder gelöscht',
        category: 'Elektronik',
        price: 79.90,
        stock: 10,
      }),
    });
    assert.equal(res.status, 201);
    const created = (await res.json()).data.product;

    // Wieder löschen (Admin darf löschen)
    const delRes = await fetch(`${BASE_URL}/products/${created.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(delRes.status, 204);
  });

  test('RBAC: Admin KANN Benutzerrollen verwalten (200)', async () => {
    const uRes = await fetch(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(uRes.status, 200);
    const users = (await uRes.json()).data.users;
    const kunde = users.find((u: any) => u.email === 'kunde@shop.de');
    assert.ok(kunde, 'Kunde muss existieren');

    const patchRes = await fetch(`${BASE_URL}/users/${kunde.id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ role: 'EMPLOYEE' }),
    });
    assert.equal(patchRes.status, 200);

    // Rollback
    await fetch(`${BASE_URL}/users/${kunde.id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ role: 'CUSTOMER' }),
    });
  });

  test('RBAC: Admin DARF SICH SELBST NICHT degradieren (400)', async () => {
    const patchRes = await fetch(`${BASE_URL}/users/${adminId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ role: 'CUSTOMER' }),
    });
    assert.equal(patchRes.status, 400);
    const json = await patchRes.json();
    assert.match(json.message, /nicht entziehen/);
  });

  test('RBAC: Admin KANN System-Logs einsehen (200)', async () => {
    const res = await fetch(`${BASE_URL}/system/logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(Array.isArray(json.data.logs));
    assert.ok(json.data.logs.length > 0);
  });

  test('RBAC: Mitarbeiter DARF System-Logs NICHT einsehen (403)', async () => {
    const res = await fetch(`${BASE_URL}/system/logs`, {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    assert.equal(res.status, 403);
  });

  test('Produkte: Löschen eines nicht existierenden Produkts liefert 404 (nicht 500)', async () => {
    const res = await fetch(`${BASE_URL}/products/nicht-vorhandene-id`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 404);
  });

  // --- 4. ATOMARER CHECKOUT & LAGERBESTAND ---
  test('Checkout: Ausverkaufter Artikel wird atomar mit 409 Conflict abgewiesen', async () => {
    const prods = (await (await fetch(`${BASE_URL}/products`)).json()).data.products;
    const outOfStock = prods.find((p: any) => p.stock === 0);
    assert.ok(outOfStock, 'Ein ausverkaufter Testartikel muss in der DB vorhanden sein');

    const res = await fetch(`${BASE_URL}/orders/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ productId: outOfStock.id, quantity: 1 }] }),
    });
    assert.equal(res.status, 409);
    const json = await res.json();
    assert.match(json.message, /Nicht genügend Bestand/);
  });

  test('Checkout: Ungültige Produkt-ID liefert 404 (nicht 500)', async () => {
    const res = await fetch(`${BASE_URL}/orders/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ productId: 'ungueltige-produkt-id', quantity: 1 }] }),
    });
    assert.equal(res.status, 404);
  });

  test('Checkout: Versandkosten von 4.90 € werden bei Bestellwert unter 100 € berechnet', async () => {
    const prods = (await (await fetch(`${BASE_URL}/products`)).json()).data.products;
    const itemUnder100 = prods.find((p: any) => Number(p.price) < 100 && p.stock > 0);
    assert.ok(itemUnder100);

    const res = await fetch(`${BASE_URL}/orders/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ productId: itemUnder100.id, quantity: 1 }] }),
    });
    assert.equal(res.status, 201);
    const json = await res.json();
    const expected = Number((Number(itemUnder100.price) + 4.90).toFixed(2));
    assert.equal(Number(json.data.order.totalAmount), expected);
  });

  test('Checkout: Gültiger Kauf zieht Bestand atomar ab (201)', async () => {
    const prods = (await (await fetch(`${BASE_URL}/products`)).json()).data.products;
    const available = prods.find((p: any) => p.stock >= 5);
    assert.ok(available, 'Ein vorrätiger Testartikel muss existieren');
    const prevStock = available.stock;

    const res = await fetch(`${BASE_URL}/orders/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ items: [{ productId: available.id, quantity: 2 }] }),
    });
    assert.equal(res.status, 201);

    const checkRes = await fetch(`${BASE_URL}/products/${available.id}`);
    const checkJson = await checkRes.json();
    assert.equal(checkJson.data.product.stock, prevStock - 2, 'Lagerbestand muss exakt um 2 reduziert sein');
  });

  test('Checkout: Leerer Warenkorb wird mit 400 Bad Request abgewiesen', async () => {
    const res = await fetch(`${BASE_URL}/orders/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [] }),
    });
    assert.equal(res.status, 400);
  });
});
