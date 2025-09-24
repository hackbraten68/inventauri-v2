import { describe, it, expect, beforeAll } from 'vitest';
import { getJson } from '../util';
import { authHeaders } from '../setup';
import { PrismaClient } from '@prisma/client';
import { getAccessToken } from '../auth';

const prisma = new PrismaClient();
let ACCESS_TOKEN = process.env.ACCESS_TOKEN;

describe('POS sale reference (tenant-scoped)', () => {
  let warehouseId: string;
  let itemId: string;
  let reference: string;

  beforeAll(async () => {
    if (!ACCESS_TOKEN) {
      const { token } = await getAccessToken();
      ACCESS_TOKEN = token;
    }
    const wh = await prisma.warehouse.findFirst();
    if (!wh) throw new Error('No warehouse found. Seed the DB first.');
    warehouseId = wh.id;

    // Create an item
    const sku = `TEST-REF-${Date.now()}`;
    const createRes = await getJson<{ item: { id: string } }>(`/api/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(ACCESS_TOKEN)
      },
      body: JSON.stringify({ name: 'Ref Test Item', sku, unit: 'pcs', initialStock: 10, warehouseId })
    });
    expect(createRes.status).toBe(201);
    itemId = createRes.body.item.id;

    // Make a sale to create a reference
    const saleRes = await getJson<{ reference: string }>(`/api/stock/sale`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(ACCESS_TOKEN)
      },
      body: JSON.stringify({ itemId, warehouseId, quantity: 1 })
    });
    expect(saleRes.status).toBe(200);
    reference = saleRes.body.reference;
  });

  it('GET /api/stock/sale?reference=... returns only tenant data', async () => {
    const res = await getJson<{ reference: string; transactions: any[] }>(`/api/stock/sale?reference=${encodeURIComponent(reference)}`, {
      headers: { ...authHeaders(ACCESS_TOKEN) }
    });
    expect(res.status).toBe(200);
    expect(res.body?.reference).toBe(reference);
    expect(Array.isArray(res.body?.transactions)).toBe(true);
    // Basic structure checks
    for (const t of res.body!.transactions) {
      expect(t.transactionType).toBe('sale');
    }
  });
});
