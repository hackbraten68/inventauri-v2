import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../src/lib/prisma', () => {
  return {
    prisma: {
      stockTransaction: {
        findMany: vi.fn()
      }
    }
  };
});

import { prisma } from '../../src/lib/prisma';
import { computeSalesDelta } from '../../src/lib/data/dashboard-metrics';

const findManyMock = prisma.stockTransaction.findMany as unknown as vi.Mock;

describe('computeSalesDelta', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-08T00:00:00Z'));
    findManyMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calculates absolute and percentage deltas for unit sales', async () => {
    const now = new Date('2025-01-08T00:00:00Z');
    const currentRangeSale = {
      quantity: 10,
      occurredAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    };
    const priorRangeSale = {
      quantity: 5,
      occurredAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000)
    };

    findManyMock.mockResolvedValue([currentRangeSale, priorRangeSale] as any);

    const result = await computeSalesDelta({ rangeDays: 7, metric: 'units' });
    expect(result.absolute).toBe(5);
    expect(result.percentage).toBeCloseTo(100);
    expect(result.direction).toBe('up');
  });

  it('returns direction "na" when prior period has no sales for revenue metric', async () => {
    const now = new Date('2025-01-08T00:00:00Z');
    const currentRangeSale = {
      quantity: 4,
      occurredAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      item: { metadata: { price: 2.5 } }
    };

    findManyMock.mockResolvedValue([currentRangeSale] as any);

    const result = await computeSalesDelta({ rangeDays: 7, metric: 'revenue' });
    expect(result.absolute).toBeCloseTo(10);
    expect(result.percentage).toBeNull();
    expect(result.direction).toBe('na');
  });
});
