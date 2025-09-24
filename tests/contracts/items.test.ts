import { describe, it, expect, beforeAll } from 'vitest';
import { getJson } from '../util';
import { authHeaders } from '../setup';
import { PrismaClient } from '@prisma/client';
import { getAccessToken } from '../auth';

const prisma = new PrismaClient();
let ACCESS_TOKEN = process.env.ACCESS_TOKEN;

describe('Items contracts', () => {
  let warehouseId: string;

  beforeAll(async () => {
    if (!ACCESS_TOKEN) {
      const { token } = await getAccessToken();
      ACCESS_TOKEN = token;
    }
    // Use the first warehouse from DB (seed provides central-hq and POS)
    const wh = await prisma.warehouse.findFirst();
    if (!wh) throw new Error('No warehouse found. Seed the DB first.');
    warehouseId = wh.id;
  });

  it('POST /api/items creates an item', async () => {
    const sku = `TEST-SKU-${Date.now()}`;
    const payload = {
      name: 'Contract Test Item',
      sku,
      unit: 'pcs',
      description: 'Created via contract test',
      initialStock: 0,
      warehouseId
    };
    const res = await getJson<{ item: any }>(`/api/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(ACCESS_TOKEN)
      },
      body: JSON.stringify(payload)
    });
    expect(res.status).toBe(201);
    expect(res.body?.item?.sku).toBe(sku);
  });
});
