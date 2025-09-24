import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase-client';
import { setAccessTokenCookie } from '../../lib/auth/cookies';
import type { InventoryItemSummary } from '../../lib/data/inventory';

interface ItemListProps {
  items: InventoryItemSummary[];
  warehouseTotals: {
    warehouseId: string;
    warehouseName: string;
  }[];
}

export function ItemList({ items, warehouseTotals }: ItemListProps) {
  const [list, setList] = useState(items);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setList(items);
  }, [items]);

  const handleDelete = async (itemId: string) => {
    try {
      setLoadingId(itemId);
      setError(null);
      setSuccess(null);

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const token = data.session?.access_token;
      if (!token) throw new Error('Keine aktive Supabase Session.');
      setAccessTokenCookie(token, data.session?.expires_in ?? undefined);

      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${token}`
        }
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? 'Artikel konnte nicht gelöscht werden.');
      }

      setList((prev) => prev.filter((item) => item.itemId !== itemId));
      setSuccess('Artikel wurde gelöscht. Inventar aktualisiert.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Löschen fehlgeschlagen.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {error ? <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
      {success ? <p className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">{success}</p> : null}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Artikel</th>
              <th className="px-4 py-3 text-left">SKU</th>
              <th className="px-4 py-3 text-left">Gesamt</th>
              <th className="px-4 py-3 text-left">Reserviert</th>
              <th className="px-4 py-3 text-left">Verfügbar</th>
              {warehouseTotals.map((warehouse) => (
                <th key={warehouse.warehouseId} className="px-4 py-3 text-left">
                  {warehouse.warehouseName}
                </th>
              ))}
              <th className="px-4 py-3 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map((item) => (
              <tr key={item.itemId} className="bg-background/60 hover:bg-accent/40">
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.description ?? '—'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{item.sku}</td>
                <td className="px-4 py-3 font-medium text-foreground">{item.totalOnHand}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.totalReserved}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.totalOnHand - item.totalReserved}</td>
                {warehouseTotals.map((warehouse) => {
                  const breakdown = item.breakdown.find((entry) => entry.warehouseId === warehouse.warehouseId);
                  return (
                    <td key={`${item.itemId}-${warehouse.warehouseId}`} className="px-4 py-3 text-muted-foreground">
                      {breakdown?.quantityOnHand ?? 0}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/items/${item.itemId}`}>Details</a>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm(`Artikel "${item.name}" wirklich löschen?`)) {
                          void handleDelete(item.itemId);
                        }
                      }}
                      disabled={loadingId === item.itemId}
                    >
                      {loadingId === item.itemId ? 'Löscht …' : 'Löschen'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
