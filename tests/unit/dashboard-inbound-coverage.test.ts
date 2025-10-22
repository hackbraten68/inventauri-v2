import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    stockTransaction: {
      findMany: vi.fn()
    }
  }
}));

import { prisma } from '../../src/lib/prisma';
import { computeInboundCoverage } from '../../src/lib/data/dashboard-metrics';

const findManyMock = prisma.stockTransaction.findMany as unknown as vi.Mock;

describe('computeInboundCoverage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-08T00:00:00Z'));
    findManyMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('aggregates inbound quantities and identifies earliest arrival', async () => {
    findManyMock.mockResolvedValue([
      { quantity: 5, occurredAt: new Date('2025-01-05T00:00:00Z'), reference: 'PO-001' },
      { quantity: 10, occurredAt: new Date('2025-01-03T00:00:00Z'), reference: 'PO-002' }
    ]);

    const inbound = await computeInboundCoverage({ itemId: 'item-1', rangeDays: 7 });
    expect(inbound.totalInboundUnits).toBe(15);
    expect(inbound.nextArrivalDate?.toISOString()).toBe('2025-01-03T00:00:00.000Z');
    expect(inbound.references).toEqual(['PO-001', 'PO-002']);
  });

  it('truncates references list to five unique entries', async () => {
    findManyMock.mockResolvedValue(
      Array.from({ length: 7 }).map((_, index) => ({
        quantity: 1,
        occurredAt: new Date('2025-01-07T00:00:00Z'),
        reference: `PO-${index}`
      }))
    );

    const inbound = await computeInboundCoverage({ itemId: 'item-1', rangeDays: 7 });
    expect(inbound.references.length).toBe(5);
    expect(inbound.references[0]).toBe('PO-0');
  });

  it('returns zeroed structure when no inbound exists', async () => {
    findManyMock.mockResolvedValue([]);
    const inbound = await computeInboundCoverage({ itemId: 'item-1', rangeDays: 7 });
    expect(inbound.totalInboundUnits).toBe(0);
    expect(inbound.nextArrivalDate).toBeNull();
    expect(inbound.references).toEqual([]);
  });
});
