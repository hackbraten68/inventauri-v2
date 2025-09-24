import { describe, it, expect, beforeAll } from 'vitest';
import { getJson } from '../util';
import { authHeaders } from '../setup';
import { PrismaClient } from '@prisma/client';
import { getAccessToken } from '../auth';

const prisma = new PrismaClient();
let ACCESS_TOKEN = process.env.ACCESS_TOKEN;

describe('Inventory contracts', () => {
  let warehouseId: string;
  let itemId: string;

  beforeAll(async () => {
    if (!ACCESS_TOKEN) {
      const { token } = await getAccessToken();
      ACCESS_TOKEN = token;
    }
    const wh = await prisma.warehouse.findFirst();
    if (!wh) throw new Error('No warehouse found. Seed the DB first.');
    warehouseId = wh.id;

    // Ensure an item exists for inventory ops
    const sku = `TEST-INV-${Date.now()}`;
    const createRes = await getJson<{ item: { id: string } }>(`/api/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(ACCESS_TOKEN)
      },
      body: JSON.stringify({ name: 'Inventory Test Item', sku, unit: 'pcs', initialStock: 0, warehouseId })
    });
    if (createRes.status !== 201) {
      throw new Error(`Failed to create test item: ${createRes.status} ${JSON.stringify(createRes.body)}`);
    }
    itemId = createRes.body.item.id;
  });

  it('POST /api/stock/inbound increases stock', async () => {
    const res = await getJson(`/api/stock/inbound`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(ACCESS_TOKEN)
      },
      body: JSON.stringify({ itemId, warehouseId, quantity: 5, reference: 'TEST-INBOUND' })
    });
    expect(res.status).toBe(200);
    expect(res.body?.result?.transactionId).toBeDefined();
  });

  it('POST /api/stock/adjust changes stock by delta', async () => {
    const res = await getJson(`/api/stock/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(ACCESS_TOKEN)
      },
      body: JSON.stringify({ itemId, warehouseId, delta: -2, reference: 'TEST-ADJUST' })
    });
    expect(res.status).toBe(200);
    expect(res.body?.result?.transactionId).toBeDefined();
  });
});
