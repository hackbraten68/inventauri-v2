import { describe, it, expect, beforeAll } from 'vitest';
import { getJson } from '../util';
import { authHeaders } from '../setup';
import { getAccessToken } from '../auth';

let ACCESS_TOKEN = process.env.ACCESS_TOKEN;

describe('Dashboard contracts', () => {
  beforeAll(async () => {
    if (!ACCESS_TOKEN) {
      const { token } = await getAccessToken();
      ACCESS_TOKEN = token;
    }
  });

  it('GET /api/dashboard exposes sales delta metrics', async () => {
    const res = await getJson(`/api/dashboard?range=7`, {
      headers: {
        ...authHeaders(ACCESS_TOKEN)
      }
    });

    expect(res.status).toBe(200);
    expect(res.body?.totals).toBeDefined();

    const salesDelta = res.body?.totals?.salesDelta;
    expect(salesDelta).toBeDefined();
    expect(typeof salesDelta.absolute).toBe('number');
    expect(['up', 'down', 'flat', 'na']).toContain(salesDelta.direction);
    expect(salesDelta.percentage === null || typeof salesDelta.percentage === 'number').toBe(true);
  });

  it('GET /api/dashboard adds days-of-cover metadata to warnings', async () => {
    const res = await getJson(`/api/dashboard?range=7`, {
      headers: {
        ...authHeaders(ACCESS_TOKEN)
      }
    });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body?.warnings)).toBe(true);

    const warnings = res.body?.warnings ?? [];
    warnings.forEach((warning: any) => {
      expect(warning).toHaveProperty('daysOfCover');
      expect(warning).toHaveProperty('daysOfCoverStatus');
      expect(['ok', 'risk', 'insufficient-data']).toContain(warning.daysOfCoverStatus ?? 'insufficient-data');
    });
  });

  it('GET /api/dashboard attaches inbound coverage details where available', async () => {
    const res = await getJson(`/api/dashboard?range=7`, {
      headers: {
        ...authHeaders(ACCESS_TOKEN)
      }
    });

    expect(res.status).toBe(200);
    const warnings = res.body?.warnings ?? [];

    warnings.forEach((warning: any) => {
      if (!warning.inboundCoverage) return;
      expect(typeof warning.inboundCoverage.totalInboundUnits).toBe('number');
      expect(Array.isArray(warning.inboundCoverage.references)).toBe(true);
    });
  });
});
