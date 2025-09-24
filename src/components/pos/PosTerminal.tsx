import { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { fetchSaleByReference, postStockAction } from '../../lib/api/client';
import type { InventorySnapshot } from '../../lib/data/inventory';
import { generateSaleReference } from '../../lib/utils';

const numberFormatter = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 });

type PosMode = 'sale' | 'return';

interface StockItem {
  itemId: string;
  name: string;
  sku: string;
  unit: string;
  quantityOnHand: number;
  quantityReserved: number;
}

interface SaleLookupItem {
  itemId: string;
  name: string;
  sku: string;
  unit: string;
  quantity: number;
  transactionIds: string[];
}

interface SaleLookupResponse {
  reference: string;
  warehouseId?: string | null;
  warehouseName?: string | null;
  items: SaleLookupItem[];
}

interface PosTerminalProps {
  warehouseId: string;
  warehouseSlug: string;
  warehouseName: string;
  items: StockItem[];
}

interface CartLine {
  itemId: string;
  name: string;
  sku: string;
  unit: string;
  quantity: number;
}

export function PosTerminal({ warehouseId, warehouseSlug, warehouseName, items }: PosTerminalProps) {
  const [mode, setMode] = useState<PosMode>('sale');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [stock, setStock] = useState(items);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [returnReference, setReturnReference] = useState('');
  const [returnData, setReturnData] = useState<SaleLookupResponse | null>(null);
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = useState('');

  useEffect(() => {
    setStock(items);
  }, [items]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return stock;
    return stock.filter((item) =>
      item.name.toLowerCase().includes(term) || item.sku.toLowerCase().includes(term)
    );
  }, [stock, search]);

  const subtotal = cart.reduce((sum, line) => sum + line.quantity, 0);

  const addToCart = (item: StockItem) => {
    setCart((prev) => {
      const existing = prev.find((line) => line.itemId === item.itemId);
      if (existing) {
        return prev.map((line) =>
          line.itemId === item.itemId
            ? { ...line, quantity: line.quantity + 1 }
            : line
        );
      }
      return [...prev, { itemId: item.itemId, name: item.name, sku: item.sku, unit: item.unit, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    setCart((prev) =>
      prev.map((line) =>
        line.itemId === itemId
          ? { ...line, quantity: Math.max(quantity, 1) }
          : line
      )
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((line) => line.itemId !== itemId));
  };

  const clearCart = () => setCart([]);

  const resetReturnState = () => {
    setReturnData(null);
    setReturnReference('');
    setReturnReason('');
    setReturnQuantities({});
  };

  const handleModeChange = (nextMode: PosMode) => {
    setMode(nextMode);
    setError(null);
    setSuccess(null);
    if (nextMode === 'sale') {
      resetReturnState();
    } else {
      clearCart();
    }
  };

  const refreshStockFromSnapshot = (snapshot: InventorySnapshot) => {
    const updatedStock = snapshot.items.map((item) => {
      const breakdown = item.breakdown.find((entry) => entry.warehouseId === warehouseId);
      return breakdown
        ? {
            itemId: item.itemId,
            name: item.name,
            sku: item.sku,
            unit: item.unit,
            quantityOnHand: breakdown.quantityOnHand,
            quantityReserved: breakdown.quantityReserved
          }
        : null;
    });

    setStock((prev) =>
      prev.map((entry) => {
        const fresh = updatedStock.find((update) => update?.itemId === entry.itemId);
        return fresh ?? entry;
      })
    );
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (cart.length === 0) {
        setError('Warenkorb ist leer.');
        return;
      }

      let latestSnapshot: InventorySnapshot | null = null;
      const reference = generateSaleReference(warehouseSlug);

      for (const line of cart) {
        const response = await postStockAction<{ snapshot: InventorySnapshot }>('sale', {
          itemId: line.itemId,
          warehouseId,
          quantity: line.quantity,
          reference
        });
        latestSnapshot = response.snapshot;
      }

      setSuccess(`Verkauf erfolgreich gebucht. Referenz: ${reference}`);
      clearCart();

      if (latestSnapshot) {
        refreshStockFromSnapshot(latestSnapshot);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Verkauf fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  const loadReturnReference = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (!returnReference.trim()) {
        setError('Bitte eine Referenz eingeben.');
        return;
      }

      const data = (await fetchSaleByReference(returnReference.trim())) as SaleLookupResponse;

      if (!data.items || data.items.length === 0) {
        setError('Keine Verkäufe zu dieser Referenz gefunden.');
        setReturnData(null);
        return;
      }

      if (data.warehouseId && data.warehouseId !== warehouseId) {
        setError('Diese Referenz gehört zu einem anderen POS-Lager.');
        setReturnData(null);
        return;
      }

      const quantities: Record<string, number> = {};
      data.items.forEach((item) => {
        quantities[item.itemId] = item.quantity;
      });

      setReturnData(data);
      setReturnQuantities(quantities);
      setSuccess('Verkauf gefunden. Bitte Mengen prüfen und Rückgabe buchen.');
    } catch (cause) {
      setReturnData(null);
      setError(cause instanceof Error ? cause.message : 'Referenz konnte nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (!returnData) {
        setError('Bitte zuerst eine Referenz laden.');
        return;
      }

      const itemsToReturn = returnData.items
        .map((item) => ({
          ...item,
          requestedQuantity: returnQuantities[item.itemId] ?? 0
        }))
        .filter((item) => item.requestedQuantity > 0);

      if (itemsToReturn.length === 0) {
        setError('Keine Mengen für die Rückgabe ausgewählt.');
        return;
      }

      let latestSnapshot: InventorySnapshot | null = null;

      for (const item of itemsToReturn) {
        if (item.requestedQuantity > item.quantity) {
          throw new Error(`Rückgabemenge für ${item.name} übersteigt den Verkauf.`);
        }

        const response = await postStockAction<{ snapshot: InventorySnapshot }>('return', {
          itemId: item.itemId,
          warehouseId,
          quantity: item.requestedQuantity,
          reference: returnData.reference,
          reason: returnReason || undefined
        });

        latestSnapshot = response.snapshot;
      }

      if (latestSnapshot) {
        refreshStockFromSnapshot(latestSnapshot);
      }

      setSuccess('Rückgabe erfolgreich eingebucht.');
      resetReturnState();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Rückgabe fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{warehouseName}</h2>
        <p className="text-sm text-muted-foreground">
          Wähle Artikel, ergänze Mengen und buche Verkäufe oder Retouren direkt ins System.
        </p>
      </header>

      <div className="flex gap-2">
        <Button type="button" variant={mode === 'sale' ? 'default' : 'outline'} onClick={() => handleModeChange('sale')}>
          Verkauf
        </Button>
        <Button type="button" variant={mode === 'return' ? 'default' : 'outline'} onClick={() => handleModeChange('return')}>
          Retoure
        </Button>
      </div>

      {mode === 'sale' ? (
        <>
          <div className="flex gap-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Artikel, SKU, Barcode"
            />
            <Button type="button" variant="outline" onClick={() => setSearch('')}>
              Löschen
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Artikel ({filteredItems.length})
              </h3>
              <div className="h-[360px] space-y-2 overflow-y-auto rounded-lg border border-border p-2">
                {filteredItems.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-muted-foreground">Keine Artikel gefunden.</p>
                ) : (
                  filteredItems.map((item) => (
                    <button
                      key={item.itemId}
                      type="button"
                      onClick={() => addToCart(item)}
                      className="flex w-full items-center justify-between rounded-md border border-border bg-card/70 px-3 py-2 text-left transition hover:border-primary hover:bg-primary/5"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{item.name}</span>
                        <span className="text-xs text-muted-foreground">{item.sku}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Bestand: {numberFormatter.format(item.quantityOnHand)} {item.unit}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3">
              <header className="flex items-center justify-between">
                <h3 className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Warenkorb</h3>
                <Button type="button" variant="ghost" size="sm" onClick={clearCart} disabled={cart.length === 0}>
                  Leeren
                </Button>
              </header>

              <div className="space-y-3 rounded-lg border border-border p-3">
                {error ? <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
                {success ? <p className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">{success}</p> : null}

                {cart.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Füge Artikel hinzu, indem du sie links auswählst.</p>
                ) : (
                  <div className="space-y-2">
                    {cart.map((line) => (
                      <div key={line.itemId} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{line.name}</p>
                          <p className="text-xs text-muted-foreground">{line.sku}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-muted-foreground" htmlFor={`qty-${line.itemId}`}>
                            Menge
                          </label>
                          <input
                            id={`qty-${line.itemId}`}
                            type="number"
                            className="h-9 w-20 rounded-md border border-input bg-background px-2 text-sm"
                            value={line.quantity}
                            min={1}
                            onChange={(event) => updateQuantity(line.itemId, Number(event.target.value))}
                          />
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeFromCart(line.itemId)}>
                            Entfernen
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/40 p-4 text-sm">
                <span>Summe Positionen</span>
                <span className="text-lg font-semibold text-foreground">
                  {numberFormatter.format(subtotal)}
                </span>
              </div>

              <Button type="button" className="w-full" size="lg" onClick={handleCheckout} disabled={loading || cart.length === 0}>
                {loading ? 'Buchen …' : 'Verkauf abschließen'}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground">Rückgabe anhand Belegnummer</h3>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={returnReference}
                onChange={(event) => setReturnReference(event.target.value)}
                placeholder="Referenz eingeben oder scannen"
                className="flex-1"
              />
              <Button type="button" onClick={loadReturnReference} disabled={loading}>
                Referenz laden
              </Button>
            </div>
            <textarea
              className="min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Grund der Rückgabe (optional)"
              value={returnReason}
              onChange={(event) => setReturnReason(event.target.value)}
            />
          </div>

          <div className="space-y-3 rounded-lg border border-border p-4">
            {error ? <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
            {success ? <p className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">{success}</p> : null}

            {returnData ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {returnData.items.length} Position(en) aus Verkauf {returnData.reference}
                </p>
                <div className="space-y-2">
                  {returnData.items.map((item) => (
                    <div key={item.itemId} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.sku}</p>
                        <p className="text-xs text-muted-foreground">Verkauft: {numberFormatter.format(item.quantity)} {item.unit}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground" htmlFor={`return-${item.itemId}`}>
                          Rückgabe Menge
                        </label>
                        <input
                          id={`return-${item.itemId}`}
                          type="number"
                          min={0}
                          max={item.quantity}
                          className="h-9 w-24 rounded-md border border-input bg-background px-2 text-sm"
                          value={returnQuantities[item.itemId] ?? 0}
                          onChange={(event) =>
                            setReturnQuantities((prev) => ({
                              ...prev,
                              [item.itemId]: Number(event.target.value)
                            }))
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Noch keine Referenz geladen.</p>
            )}
          </div>

          <Button type="button" className="w-full" size="lg" onClick={handleReturn} disabled={loading || !returnData}>
            {loading ? 'Buchen …' : 'Rückgabe buchen'}
          </Button>
        </div>
      )}
    </div>
  );
}
