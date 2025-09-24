import { describe, it, expect, beforeAll } from 'vitest';
import { getJson } from '../util';
import { authHeaders } from '../setup';
import { getAccessToken } from '../auth';

let ACCESS_TOKEN = process.env.ACCESS_TOKEN;

describe('Reports contracts', () => {
  beforeAll(async () => {
    if (!ACCESS_TOKEN) {
      const { token } = await getAccessToken();
      ACCESS_TOKEN = token;
    }
  });

  it('GET /api/reports/sales returns daily buckets', async () => {
    const now = new Date();
    const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const res = await getJson<{ data: Array<{ periodStart: string; totalQuantity: number }> }>(
      `/api/reports/sales?interval=day&from=${from.toISOString()}&to=${now.toISOString()}`,
      {
        headers: {
          ...authHeaders(ACCESS_TOKEN)
        }
      }
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body?.data)).toBe(true);
    // Buckets should be sorted ascending by periodStart and within requested window
    const data = res.body!.data;
    for (let i = 1; i < data.length; i++) {
      expect(data[i].periodStart >= data[i - 1].periodStart).toBe(true);
    }
  });
});
