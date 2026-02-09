import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { fetchSaleByReference, postStockAction } from '../../lib/api/client';
import type { InventorySnapshot } from '../../lib/data/inventory';
import { generateSaleReference } from '../../lib/utils';
import {
  LayoutDashboard,
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Package,
  Star,
  ScanLine
} from 'lucide-react';
import { useTranslation } from '../../i18n/hooks';
import { LocaleProvider } from '../../i18n/context';
import type { Locale } from '../../i18n/constants';
type PosMode = 'sale' | 'return';

interface StockItem {
  itemId: string;
  name: string;
  sku: string;
  unit: string;
  quantityOnHand: number;
  quantityReserved: number;
  isQuickAdd?: boolean; // New property for quick selection
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

interface PosTerminalProps {
  warehouseId: string;
  warehouseSlug: string;
  warehouseName: string;
  items: StockItem[];
  locale: Locale;
}

export function PosTerminal({ warehouseId, warehouseSlug, warehouseName, items, locale }: PosTerminalProps) {
  return (
    <LocaleProvider locale={locale}>
      <PosTerminalContent
        warehouseId={warehouseId}
        warehouseSlug={warehouseSlug}
        warehouseName={warehouseName}
        items={items}
      />
    </LocaleProvider>
  );
}

function PosTerminalContent({ warehouseId, warehouseSlug, warehouseName, items }: Omit<PosTerminalProps, 'locale'>) {
  const { t, formatNumber } = useTranslation();
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
          ? { ...line, quantity: Math.max(quantity, 0) } // Allow 0 to potentially let it be empty/removed
          : line
      ).filter(line => line.quantity > 0) // Auto-remove if quantity set to 0
    );
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim()) {
      // Find exact match by SKU or Barcode (simulated)
      const exactMatch = stock.find(item =>
        item.sku.toLowerCase() === search.trim().toLowerCase()
      );

      if (exactMatch) {
        addToCart(exactMatch);
        setSearch('');
        setSuccess(t('pos.sale.added', { name: exactMatch.name }));
        setTimeout(() => setSuccess(null), 2000);
      } else if (filteredItems.length === 1) {
        // If only one partial match, add it
        addToCart(filteredItems[0]);
        setSearch('');
        setSuccess(t('pos.sale.added', { name: filteredItems[0].name }));
        setTimeout(() => setSuccess(null), 2000);
      }
    }
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
        setError(t('pos.cart.empty'));
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

      setSuccess(t('pos.sale.success', { reference }));
      clearCart();

      if (latestSnapshot) {
        refreshStockFromSnapshot(latestSnapshot);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('common.error'));
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
        setError(t('pos.return.lookup.noReference'));
        return;
      }

      const data = (await fetchSaleByReference(returnReference.trim())) as SaleLookupResponse;

      if (!data.items || data.items.length === 0) {
        setError(t('pos.return.lookup.notFound'));
        setReturnData(null);
        return;
      }

      if (data.warehouseId && data.warehouseId !== warehouseId) {
        setError(t('pos.return.lookup.wrongWarehouse'));
        setReturnData(null);
        return;
      }

      const quantities: Record<string, number> = {};
      data.items.forEach((item) => {
        quantities[item.itemId] = item.quantity;
      });

      setReturnData(data);
      setReturnQuantities(quantities);
      setSuccess(t('pos.return.lookup.found'));
    } catch (cause) {
      setReturnData(null);
      setError(cause instanceof Error ? cause.message : t('pos.return.lookup.loadError'));
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
        setError(t('pos.return.process.noReference'));
        return;
      }

      const itemsToReturn = returnData.items
        .map((item) => ({
          ...item,
          requestedQuantity: returnQuantities[item.itemId] ?? 0
        }))
        .filter((item) => item.requestedQuantity > 0);

      if (itemsToReturn.length === 0) {
        setError(t('pos.return.process.noQuantities'));
        return;
      }

      let latestSnapshot: InventorySnapshot | null = null;

      for (const item of itemsToReturn) {
        if (item.requestedQuantity > item.quantity) {
          throw new Error(t('pos.return.process.itemOverReturn', { name: item.name }));
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

      setSuccess(t('pos.return.process.success'));
      resetReturnState();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('pos.return.process.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{warehouseName}</h2>
        <p className="text-sm text-muted-foreground">
          {t('pos.subtitle')}
        </p>
      </header>

      <div className="flex gap-2">
        <Button type="button" variant={mode === 'sale' ? 'default' : 'outline'} onClick={() => handleModeChange('sale')}>
          {t('pos.modes.sale')}
        </Button>
        <Button type="button" variant={mode === 'return' ? 'default' : 'outline'} onClick={() => handleModeChange('return')}>
          {t('pos.modes.return')}
        </Button>
      </div>

      {mode === 'sale' ? (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column: Product Selection & Search */}
          <div className="lg:col-span-7 space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={t('pos.search.placeholder')}
                className="pl-10 h-12 text-base ring-offset-background transition-all focus:ring-2 focus:ring-primary"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <ScanLine size={16} className="text-muted-foreground opacity-50" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => setSearch('')}
                >
                  {t('pos.search.clear')}
                </Button>
              </div>
            </div>

            {/* Quick Select Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <Star size={14} className="text-primary fill-primary/20" />
                <span>{t('pos.quickSelect')}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {stock.slice(0, 6).map((item) => (
                  <button
                    key={`quick-${item.itemId}`}
                    onClick={() => addToCart(item)}
                    className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card p-3 text-center transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm active:scale-95"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5 text-primary">
                      <Plus size={20} />
                    </div>
                    <span className="text-xs font-bold truncate w-full">{item.name}</span>
                    <span className="text-[10px] text-muted-foreground">{t('pos.stock.standard')}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <Package size={14} />
                <span>{t('pos.allItems')} ({filteredItems.length})</span>
              </div>
              <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-border bg-muted/20">
                    <Search className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">{t('pos.noItemsFound')}</p>
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <button
                      key={item.itemId}
                      type="button"
                      onClick={() => addToCart(item)}
                      className="group flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left transition-all hover:border-primary/50 hover:bg-primary/5 active:bg-primary/10"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <Package size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground">{item.name}</span>
                          <span className="text-xs text-muted-foreground font-mono">{item.sku}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{item.quantityOnHand > 5 ? t('pos.stock.inStock') : t('pos.stock.standard')}</span>
                        <div className={`text-xs font-bold rounded-full px-2 py-0.5 ${item.quantityOnHand > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                          {formatNumber(item.quantityOnHand)} {item.unit}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Checkout / Cart */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex flex-col rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <header className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ShoppingCart size={16} />
                  </div>
                  <h3 className="font-bold text-foreground">{t('pos.cart.title')}</h3>
                </div>
                {cart.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearCart} className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 size={14} className="mr-1" />
                    {t('pos.cart.clear')}
                  </Button>
                )}
              </header>

              <div className="flex-1 p-6 space-y-4 min-h-[300px]">
                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    <span className="font-bold">{t('pos.error.prefix')}</span> {error}
                  </div>
                )}
                {success && (
                  <div className="animate-in fade-in slide-in-from-top-1 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    {success}
                  </div>
                )}

                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                    <ShoppingCart size={48} strokeWidth={1} />
                    <p className="mt-4 text-sm font-medium">{t('pos.cart.isEmpty')}</p>
                    <p className="text-xs">{t('pos.cart.scanOrSelect')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((line) => (
                      <div key={line.itemId} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-muted/30 border border-border transition-all hover:border-primary/20">
                        <div className="flex flex-col gap-0.5 overflow-hidden">
                          <p className="text-sm font-bold text-foreground truncate">{line.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{line.sku}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center bg-background rounded-lg border border-border overflow-hidden">
                            <button
                              onClick={() => updateQuantity(line.itemId, line.quantity - 1)}
                              className="h-8 w-8 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-10 text-center text-sm font-bold border-x border-border">
                              {line.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(line.itemId, line.quantity + 1)}
                              className="h-8 w-8 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(line.itemId)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-auto border-t border-border bg-muted/20 p-6 space-y-4">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-muted-foreground">{t('pos.checkout.amount')} ({cart.length} Pos.)</span>
                  <span className="text-foreground">{formatNumber(subtotal)} {cart.length > 0 ? cart[0].unit : ''}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-foreground">{t('pos.checkout.total')}</span>
                  <span className="text-3xl font-black text-primary tabular-nums tracking-tighter">
                    {formatNumber(subtotal)}
                  </span>
                </div>
                <Button
                  className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={loading || cart.length === 0}
                >
                  {loading ? t('pos.checkout.processing') : (
                    <div className="flex items-center gap-2">
                      <ShoppingCart size={20} />
                      <span>{t('pos.checkout.complete')}</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground">{t('pos.return.lookup.title')}</h3>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={returnReference}
                onChange={(event) => setReturnReference(event.target.value)}
                placeholder={t('pos.return.lookup.inputPlaceholder')}
                className="flex-1"
              />
              <Button type="button" onClick={loadReturnReference} disabled={loading}>
                {t('pos.return.lookup.loadButton')}
              </Button>
            </div>
            <textarea
              className="min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder={t('pos.return.reasonPlaceholder')}
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
                  {t('pos.return.itemsFrom', { count: returnData.items.length, reference: returnData.reference })}
                </p>
                <div className="space-y-2">
                  {returnData.items.map((item) => (
                    <div key={item.itemId} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.sku}</p>
                        <p className="text-xs text-muted-foreground">                          {t('pos.return.soldInfo', { quantity: formatNumber(item.quantity), unit: item.unit })}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground" htmlFor={`return-${item.itemId}`}>
                          {t('pos.return.quantityLabel')}
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
              <p className="text-sm text-muted-foreground">{t('pos.return.noReferenceLoaded')}</p>
            )}
          </div>

          <Button type="button" className="w-full" size="lg" onClick={handleReturn} disabled={loading || !returnData}>
            {loading ? t('pos.return.processing') : t('pos.return.book')}
          </Button>
        </div>
      )}
    </div>
  );

}
