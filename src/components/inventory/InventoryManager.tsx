import { Fragment, useMemo, useState } from 'react';
import type { InventoryItemSummary, InventorySnapshot, InventoryWarehouseBreakdown } from '../../lib/data/inventory';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { postStockAction, fetchItemHistory } from '../../lib/api/client';

const numberFormatter = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 });
const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  dateStyle: 'short',
  timeStyle: 'short'
});

const ACTION_LABELS = {
  transfer: 'Umbuchung',
  inbound: 'Einbuchung',
  sale: 'Verkauf',
  writeoff: 'Abschreibung',
  donation: 'Spende',
  return: 'Retoure',
  adjust: 'Korrektur'
} as const;

type StockAction = keyof typeof ACTION_LABELS;

type MutationResponse = {
  result: {
    transactionId: string;
  };
  snapshot: InventorySnapshot;
};

type HistoryEntry = {
  id: string;
  transactionType: string;
  quantity: string;
  reference?: string | null;
  notes?: string | null;
  performedBy?: string | null;
  occurredAt: string;
  sourceWarehouseId?: string | null;
  targetWarehouseId?: string | null;
};

interface InventoryManagerProps {
  initialSnapshot: InventorySnapshot;
}

interface ActionFormState {
  action: StockAction;
  sourceWarehouseId: string;
  targetWarehouseId: string;
  quantity: string;
  reference: string;
  notes: string;
}

const ACTIONS_REQUIRING_TARGET: StockAction[] = ['transfer'];
const ACTIONS_ALLOWING_NEGATIVE: StockAction[] = ['adjust'];

function formatQty(value: number) {
  return numberFormatter.format(value);
}

function getWarehouseName(warehouses: InventoryWarehouseBreakdown[], id?: string | null) {
  if (!id) return '—';
  return warehouses.find((warehouse) => warehouse.warehouseId === id)?.warehouseName ?? 'Unbekannt';
}

export function InventoryManager({ initialSnapshot }: InventoryManagerProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [historyItem, setHistoryItem] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<Record<string, HistoryEntry[]>>({});
  const [historyLoading, setHistoryLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const defaultWarehouse = snapshot.warehouseTotals[0]?.warehouseId ?? '';

  const [formState, setFormState] = useState<ActionFormState>({
    action: 'transfer',
    sourceWarehouseId: defaultWarehouse,
    targetWarehouseId: snapshot.warehouseTotals[1]?.warehouseId ?? '',
    quantity: '',
    reference: '',
    notes: ''
  });

  const posTotals = useMemo(
    () => snapshot.warehouseTotals.filter((warehouse) => warehouse.warehouseType === 'pos'),
    [snapshot.warehouseTotals]
  );
  const centralTotals = useMemo(
    () => snapshot.warehouseTotals.find((warehouse) => warehouse.warehouseType === 'central'),
    [snapshot.warehouseTotals]
  );

  const handleActionSubmit = async (item: InventoryItemSummary) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const quantityValue = Number(formState.quantity);
      if (!Number.isFinite(quantityValue)) {
        throw new Error('Bitte eine gültige Menge angeben.');
      }

      const payloadBase = {
        itemId: item.itemId,
        reference: formState.reference || undefined,
        notes: formState.notes || undefined
      };

      let response: MutationResponse;

      switch (formState.action) {
        case 'transfer': {
          if (!formState.sourceWarehouseId || !formState.targetWarehouseId) {
            throw new Error('Quelle und Ziel müssen gewählt werden.');
          }
          if (formState.sourceWarehouseId === formState.targetWarehouseId) {
            throw new Error('Quelle und Ziel dürfen nicht identisch sein.');
          }
          if (quantityValue <= 0) {
            throw new Error('Menge muss größer als 0 sein.');
          }
          response = await postStockAction<MutationResponse>('transfer', {
            ...payloadBase,
            sourceWarehouseId: formState.sourceWarehouseId,
            targetWarehouseId: formState.targetWarehouseId,
            quantity: quantityValue
          });
          break;
        }
        case 'inbound': {
          const targetWarehouseId = formState.targetWarehouseId || formState.sourceWarehouseId;
          if (!targetWarehouseId) {
            throw new Error('Ziel-Lager wählen.');
          }
          if (quantityValue <= 0) {
            throw new Error('Menge muss größer als 0 sein.');
          }
          response = await postStockAction<MutationResponse>('inbound', {
            ...payloadBase,
            warehouseId: targetWarehouseId,
            quantity: quantityValue
          });
          break;
        }
        case 'sale':
        case 'writeoff':
        case 'donation':
        case 'return': {
          if (!formState.sourceWarehouseId) {
            throw new Error('Lager wählen.');
          }
          if (quantityValue <= 0) {
            throw new Error('Menge muss größer als 0 sein.');
          }
          response = await postStockAction<MutationResponse>(formState.action, {
            ...payloadBase,
            warehouseId: formState.sourceWarehouseId,
            quantity: quantityValue
          });
          break;
        }
        case 'adjust': {
          if (!formState.sourceWarehouseId) {
            throw new Error('Lager wählen.');
          }
          if (quantityValue === 0) {
            throw new Error('Der Wert darf nicht 0 sein.');
          }
          response = await postStockAction<MutationResponse>('adjust', {
            ...payloadBase,
            warehouseId: formState.sourceWarehouseId,
            delta: quantityValue
          });
          break;
        }
        default:
          throw new Error('Unbekannte Aktion.');
      }

      setSnapshot(response.snapshot);
      setSuccess(`${ACTION_LABELS[formState.action]} erfolgreich.`);

      setHistoryData((prev) => {
        if (!prev[item.itemId]) {
          return prev;
        }
        const next = { ...prev };
        delete next[item.itemId];
        return next;
      });

      if (historyItem === item.itemId) {
        try {
          setHistoryLoading(item.itemId);
          const refreshed = await fetchItemHistory({ itemId: item.itemId, limit: 10 });
          setHistoryData((prev) => ({
            ...prev,
            [item.itemId]: refreshed.data as HistoryEntry[]
          }));
        } catch (cause) {
          console.error('Historie konnte nicht aktualisiert werden.', cause);
        } finally {
          setHistoryLoading(null);
        }
      }

      setActiveItem(null);
      setFormState((prev) => ({
        ...prev,
        quantity: '',
        reference: '',
        notes: ''
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unbekannter Fehler.');
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryToggle = async (itemId: string) => {
    if (historyItem === itemId) {
      setHistoryItem(null);
      return;
    }

    if (historyData[itemId]) {
      setHistoryItem(itemId);
      return;
    }

    try {
      setHistoryLoading(itemId);
      const response = await fetchItemHistory({ itemId, limit: 10 });
      setHistoryData((prev) => ({
        ...prev,
        [itemId]: response.data as HistoryEntry[]
      }));
      setHistoryItem(itemId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Historie konnte nicht geladen werden.');
    } finally {
      setHistoryLoading(null);
    }
  };

  const handleFormValue = (key: keyof ActionFormState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const unitLabel = snapshot.items[0]?.unit ?? 'stk';

  return (
    <div className="flex flex-col gap-4">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Aktive Artikel" value={snapshot.items.length} description="Anzahl SKUs mit Bestand" />
        <KpiCard
          title="Gesamtbestand"
          value={`${formatQty(snapshot.totals.onHand)} ${unitLabel}`}
          description={`Reserviert: ${formatQty(snapshot.totals.reserved)}`}
        />
        <KpiCard
          title="Zentrallager"
          value={`${formatQty(centralTotals?.quantityOnHand ?? 0)} ${unitLabel}`}
          description={centralTotals?.warehouseName ?? 'Noch kein Zentrallager vorhanden'}
        />
        <KpiCard
          title="POS Lager"
          value={`${formatQty(posTotals.reduce((acc, warehouse) => acc + warehouse.quantityOnHand, 0))} ${unitLabel}`}
          description={`${posTotals.length} aktive POS Standorte`}
        />
      </section>

      {error ? <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
      {success ? <p className="rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm text-primary">{success}</p> : null}

      <div className="rounded-xl border border-border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary font-semibold text-secondary-foreground">
              {snapshot.warehouseTotals.length}
            </span>
            <div>
              <p className="font-medium text-foreground">Lagerübersicht</p>
              <p className="text-xs">
                {centralTotals?.warehouseName ?? 'Zentrallager fehlt'} • {posTotals.length} POS Standorte
              </p>
            </div>
          </div>
          <span className="text-xs uppercase tracking-[0.2em]">
            Gesamt: {formatQty(snapshot.totals.onHand)} {unitLabel}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Artikel</th>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-left">Gesamt</th>
                <th className="px-4 py-3 text-left">Reserviert</th>
                <th className="px-4 py-3 text-left">Verfügbar</th>
                {snapshot.warehouseTotals.map((warehouse) => (
                  <th className="px-4 py-3 text-left" key={warehouse.warehouseId}>
                    {warehouse.warehouseName}
                  </th>
                ))}
                <th className="px-4 py-3 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {snapshot.items.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={5 + snapshot.warehouseTotals.length}>
                    Noch keine Artikel mit Bestand.
                  </td>
                </tr>
              ) : (
                snapshot.items.map((item) => {
                  const available = item.totalOnHand - item.totalReserved;
                  return (
                    <Fragment key={item.itemId}>
                      <tr className="bg-background/60 hover:bg-accent/40">
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{item.name}</span>
                            {item.description ? (
                              <span className="text-xs text-muted-foreground">{item.description}</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{item.sku}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{formatQty(item.totalOnHand)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatQty(item.totalReserved)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatQty(available)}</td>
                        {snapshot.warehouseTotals.map((warehouse) => {
                          const breakdown = item.breakdown.find((entry) => entry.warehouseId === warehouse.warehouseId);
                          return (
                            <td className="px-4 py-3 text-muted-foreground" key={`${item.itemId}-${warehouse.warehouseId}`}>
                              {formatQty(breakdown?.quantityOnHand ?? 0)}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => void handleHistoryToggle(item.itemId)}
                              disabled={historyLoading === item.itemId}
                            >
                              Details
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setActiveItem((prev) => (prev === item.itemId ? null : item.itemId));
                                setFormState((prev) => ({
                                  ...prev,
                                  sourceWarehouseId: prev.sourceWarehouseId || defaultWarehouse,
                                  targetWarehouseId:
                                    prev.targetWarehouseId ||
                                    snapshot.warehouseTotals.find((warehouse) => warehouse.warehouseId !== prev.sourceWarehouseId)?.warehouseId ||
                                    ''
                                }));
                              }}
                            >
                              Aktion
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {historyItem === item.itemId ? (
                        <tr className="bg-muted/20">
                          <td colSpan={6 + snapshot.warehouseTotals.length} className="px-4 py-4">
                            {historyLoading === item.itemId ? (
                              <p className="text-sm text-muted-foreground">Historie wird geladen …</p>
                            ) : historyData[item.itemId]?.length ? (
                              <div className="space-y-2 text-sm">
                                {historyData[item.itemId]?.map((entry) => (
                                  <div key={entry.id} className="flex flex-col rounded-md border border-border/60 p-3">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-foreground">{ACTION_LABELS[entry.transactionType as StockAction] ?? entry.transactionType}</span>
                                      <span className="text-xs text-muted-foreground">{dateFormatter.format(new Date(entry.occurredAt))}</span>
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                      <span>Menge: {formatQty(Number(entry.quantity))}</span>
                                      {entry.sourceWarehouseId ? (
                                        <span>Quelle: {getWarehouseName(snapshot.warehouseTotals, entry.sourceWarehouseId)}</span>
                                      ) : null}
                                      {entry.targetWarehouseId ? (
                                        <span>Ziel: {getWarehouseName(snapshot.warehouseTotals, entry.targetWarehouseId)}</span>
                                      ) : null}
                                      {entry.reference ? <span>Referenz: {entry.reference}</span> : null}
                                      {entry.performedBy ? <span>Von: {entry.performedBy}</span> : null}
                                    </div>
                                    {entry.notes ? (
                                      <p className="mt-2 text-xs text-muted-foreground">Notiz: {entry.notes}</p>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">Noch keine Historie vorhanden.</p>
                            )}
                          </td>
                        </tr>
                      ) : null}
                      {activeItem === item.itemId ? (
                        <tr className="bg-muted/30">
                          <td colSpan={6 + snapshot.warehouseTotals.length} className="px-4 py-5">
                            <form
                              className="grid gap-4 md:grid-cols-2"
                              onSubmit={(event) => {
                                event.preventDefault();
                                void handleActionSubmit(item);
                              }}
                            >
                              <div className="space-y-2">
                                <Label htmlFor="action">Aktion</Label>
                                <select
                                  id="action"
                                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                  value={formState.action}
                                  onChange={(event) =>
                                    handleFormValue('action', event.target.value as StockAction)
                                  }
                                >
                                  {Object.entries(ACTION_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>
                                      {label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="quantity">Menge</Label>
                                <Input
                                  id="quantity"
                                  type="number"
                                  step="0.01"
                                  value={formState.quantity}
                                  onChange={(event) => handleFormValue('quantity', event.target.value)}
                                  placeholder={ACTIONS_ALLOWING_NEGATIVE.includes(formState.action) ? 'z. B. -2 oder 5' : 'z. B. 5'}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="source">Quelle</Label>
                                <select
                                  id="source"
                                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                  value={formState.sourceWarehouseId}
                                  onChange={(event) => handleFormValue('sourceWarehouseId', event.target.value)}
                                >
                                  <option value="">Lager wählen…</option>
                                  {snapshot.warehouseTotals.map((warehouse) => (
                                    <option key={warehouse.warehouseId} value={warehouse.warehouseId}>
                                      {warehouse.warehouseName}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              {ACTIONS_REQUIRING_TARGET.includes(formState.action) || formState.action === 'inbound' ? (
                                <div className="space-y-2">
                                  <Label htmlFor="target">Ziel</Label>
                                  <select
                                    id="target"
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                    value={formState.targetWarehouseId}
                                    onChange={(event) => handleFormValue('targetWarehouseId', event.target.value)}
                                  >
                                    <option value="">Lager wählen…</option>
                                    {snapshot.warehouseTotals
                                      .filter((warehouse) =>
                                        formState.action !== 'transfer' || warehouse.warehouseId !== formState.sourceWarehouseId
                                      )
                                      .map((warehouse) => (
                                        <option key={warehouse.warehouseId} value={warehouse.warehouseId}>
                                          {warehouse.warehouseName}
                                        </option>
                                      ))}
                                  </select>
                                </div>
                              ) : null}
                              <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="reference">Referenz</Label>
                                <Input
                                  id="reference"
                                  value={formState.reference}
                                  onChange={(event) => handleFormValue('reference', event.target.value)}
                                  placeholder="z. B. Belegnummer"
                                />
                              </div>
                              <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="notes">Notiz</Label>
                                <textarea
                                  id="notes"
                                  className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                  value={formState.notes}
                                  onChange={(event) => handleFormValue('notes', event.target.value)}
                                  placeholder="Optional, z. B. Begründung"
                                />
                              </div>
                              <div className="flex gap-3 md:col-span-2">
                                <Button type="submit" disabled={loading}>
                                  {loading ? 'Wird ausgeführt …' : ACTION_LABELS[formState.action]}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setActiveItem(null);
                                    setError(null);
                                    setSuccess(null);
                                  }}
                                >
                                  Abbrechen
                                </Button>
                              </div>
                            </form>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface KpiCardProps {
  title: string;
  value: string | number;
  description: string;
}

function KpiCard({ title, value, description }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card/70 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
