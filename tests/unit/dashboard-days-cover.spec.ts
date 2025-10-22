import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    stockTransaction: {
      aggregate: vi.fn()
    }
  }
}));

import { prisma } from '../../src/lib/prisma';
import { calculateDaysOfCover, computeSalesVelocity } from '../../src/lib/data/dashboard-metrics';

const aggregateMock = prisma.stockTransaction.aggregate as unknown as vi.Mock;

describe('dashboard days of cover helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-08T00:00:00Z'));
    aggregateMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('computes sales velocity when sufficient history exists', async () => {
    aggregateMock.mockResolvedValue({
      _sum: { quantity: 21 },
      _min: { occurredAt: new Date('2025-01-01T00:00:00Z') }
    });

    const velocity = await computeSalesVelocity({ itemId: 'item-1', warehouseId: 'wh-1', rangeDays: 7 });
    expect(velocity.observedDays).toBeGreaterThanOrEqual(7);
    expect(velocity.averageDaily).toBeCloseTo(3);
  });

  it('treats sparse history as insufficient data', async () => {
    aggregateMock.mockResolvedValue({
      _sum: { quantity: 1 },
      _min: { occurredAt: new Date('2025-01-07T00:00:00Z') }
    });

    const velocity = await computeSalesVelocity({ itemId: 'item-1', warehouseId: 'wh-1', rangeDays: 7 });
    expect(velocity.observedDays).toBe(1);
    expect(velocity.averageDaily).toBeNull();
  });

  it('calculates days of cover with risk classification', async () => {
    aggregateMock.mockResolvedValue({
      _sum: { quantity: 18 },
      _min: { occurredAt: new Date('2025-01-01T00:00:00Z') }
    });

    const result = await calculateDaysOfCover({
      itemId: 'item-1',
      warehouseId: 'wh-1',
      onHandQuantity: 12,
      rangeDays: 7
    });

    expect(result.daysOfCover).toBeCloseTo(4.0);
    expect(result.status).toBe('ok');
    expect(result.averageDaily).toBeGreaterThan(0);
  });

  it('flags risk status when cover days are below threshold', async () => {
    aggregateMock.mockResolvedValue({
      _sum: { quantity: 18 },
      _min: { occurredAt: new Date('2025-01-01T00:00:00Z') }
    });

    const result = await calculateDaysOfCover({
      itemId: 'item-1',
      warehouseId: 'wh-1',
      onHandQuantity: 6,
      rangeDays: 7
    });

    expect(result.daysOfCover).toBeCloseTo(2.0);
    expect(result.status).toBe('risk');
  });

  it('returns insufficient-data status when averageDaily is null', async () => {
    aggregateMock.mockResolvedValue({
      _sum: { quantity: 0 },
      _min: { occurredAt: new Date('2025-01-07T00:00:00Z') }
    });

    const result = await calculateDaysOfCover({
      itemId: 'item-1',
      warehouseId: 'wh-1',
      onHandQuantity: 10,
      rangeDays: 7
    });

    expect(result.daysOfCover).toBeNull();
    expect(result.status).toBe('insufficient-data');
  });
});
