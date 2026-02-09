import { Fragment, useMemo, useState } from 'react';
import type { InventoryItemSummary, InventorySnapshot, InventoryWarehouseBreakdown, StockAction } from '../../lib/data/inventory';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { postStockAction, fetchItemHistory } from '../../lib/api/client';
import { useTranslation } from '../../i18n/hooks';
import { LocaleProvider } from '../../i18n/context';
import type { Locale } from '../../i18n/constants';

interface InventoryManagerProps {
  initialSnapshot: InventorySnapshot;
  locale: Locale;
}

export function InventoryManager({ initialSnapshot, locale }: InventoryManagerProps) {
  return (
    <LocaleProvider locale={locale}>
      <InventoryManagerContent initialSnapshot={initialSnapshot} />
    </LocaleProvider>
  );
}

function InventoryManagerContent({ initialSnapshot }: { initialSnapshot: InventorySnapshot }) {
  const { t, formatNumber, formatDateTime } = useTranslation();

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

  const formatQty = (value: number) => {
    return formatNumber(value);
  };

  const getWarehouseName = (warehouses: InventoryWarehouseBreakdown[], id?: string | null) => {
    if (!id) return '—';
    return warehouses.find((warehouse) => warehouse.warehouseId === id)?.warehouseName ?? t('common.error');
  };

  const KpiCard = ({ title, value, unit, description }: KpiCardProps) => {
    const displayValue = typeof value === 'number' ? formatQty(value) : value;
    return (
      <div className="rounded-xl border border-border bg-card/70 p-4 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-semibold text-foreground">
          {displayValue}{unit ? ` ${unit}` : ''}
        </p>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </div>
    );
  };

  const ACTION_LABELS = {
    transfer: t('inventory.actions.transfer'),
    inbound: t('inventory.actions.inbound'),
    sale: t('inventory.actions.sale'),
    writeoff: t('inventory.actions.writeoff'),
    donation: t('inventory.actions.donation'),
    return: t('inventory.actions.return'),
    adjust: t('inventory.actions.adjust')
  } as const;
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
        throw new Error(t('inventory.validation.validQuantity'));
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
            throw new Error(t('inventory.validation.warehousesRequired'));
          }
          if (formState.sourceWarehouseId === formState.targetWarehouseId) {
            throw new Error(t('inventory.warehouse.sameWarehouse'));
          }
          if (quantityValue <= 0) {
            throw new Error(t('inventory.validation.quantityGreaterThanZero'));
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
            throw new Error(t('inventory.validation.selectTarget'));
          }
          if (quantityValue <= 0) {
            throw new Error(t('inventory.validation.quantityGreaterThanZero'));
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
            throw new Error(t('inventory.validation.selectSource'));
          }
          if (quantityValue <= 0) {
            throw new Error(t('inventory.validation.quantityGreaterThanZero'));
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
            throw new Error(t('inventory.validation.selectSource'));
          }
          if (quantityValue === 0) {
            throw new Error(t('inventory.validation.quantityGreaterThanZero'));
          }
          response = await postStockAction<MutationResponse>('adjust', {
            ...payloadBase,
            warehouseId: formState.sourceWarehouseId,
            delta: quantityValue
          });
          break;
        }
        default:
          throw new Error(t('common.error'));
      }

      setSnapshot(response.snapshot);
      setSuccess(`${t(`inventory.actions.${formState.action}`)} ${t('inventory.status.success')}.`);

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
          setHistoryLoading(t('inventory.status.loading'));
          const refreshed = await fetchItemHistory({ itemId: item.itemId, limit: 10 });
          setHistoryData((prev) => ({
            ...prev,
            [item.itemId]: refreshed.data as HistoryEntry[]
          }));
        } catch (cause) {
          console.error(t('inventory.history.error'), cause);
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
      setError(cause instanceof Error ? cause.message : t('inventory.messages.unknownError'));
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
      setError(cause instanceof Error ? cause.message : t('inventory.status.error'));
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
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title={t('inventory.stats.totalItems')} value={snapshot.items.length} />
        <KpiCard
          title={t('inventory.stats.totalValue')}
          value={snapshot.totals.onHand}
          unit={unitLabel}
        />
        <KpiCard
          title={t('inventory.stats.totalValue')}
          value={centralTotals?.quantityOnHand ?? 0}
          unit={unitLabel}
          description={centralTotals?.warehouseName ?? t('common.error')}
        />
        <KpiCard
          title={t('navigation.totalInventory')}
          value={posTotals.reduce((acc, warehouse) => acc + warehouse.quantityOnHand, 0)}
          unit={unitLabel}
          description={`${posTotals.length} ${t('inventory.warehouse.activePosLocations') || 'POS Locations'}`}
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
              <p className="font-medium text-foreground">{t('inventory.warehouse.overview')}</p>
              <p className="text-xs">
                {centralTotals?.warehouseName ?? t('inventory.warehouse.missingCentral')} • {posTotals.length} {t('inventory.warehouse.posLocations') || 'POS'}
              </p>
            </div>
          </div>
          <span className="text-xs uppercase tracking-[0.2em]">
            {t('inventory.table.total')}: {formatQty(snapshot.totals.onHand)} {unitLabel}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">{t('inventory.table.item')}</th>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-left">{t('inventory.table.total')}</th>
                <th className="px-4 py-3 text-left">{t('inventory.table.reserved')}</th>
                <th className="px-4 py-3 text-left">{t('inventory.table.available')}</th>
                {snapshot.warehouseTotals.map((warehouse) => (
                  <th className="px-4 py-3 text-left" key={warehouse.warehouseId}>
                    {warehouse.warehouseName}
                  </th>
                ))}
                <th className="px-4 py-3 text-right">{t('inventory.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {snapshot.items.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={5 + snapshot.warehouseTotals.length}>
                    {t('inventory.messages.noItemsWithStock')}
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
                              {t('common.details') || 'Details'}
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
                              {t('common.action') || 'Action'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {historyItem === item.itemId ? (
                        <tr className="bg-muted/20">
                          <td colSpan={6 + snapshot.warehouseTotals.length} className="px-4 py-4">
                            {historyLoading === item.itemId ? (
                              <p className="text-sm text-muted-foreground">{t('inventory.messages.historyLoading')}</p>
                            ) : historyData[item.itemId]?.length ? (
                              <div className="space-y-2 text-sm">
                                {historyData[item.itemId]?.map((entry) => (
                                  <div key={entry.id} className="flex flex-col rounded-md border border-border/60 p-3">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-foreground">{t(`inventory.actions.${entry.transactionType}`) || entry.transactionType}</span>
                                      <span className="text-xs text-muted-foreground">{formatDateTime(new Date(entry.occurredAt))}</span>
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                      <span>{t('inventory.history.item')}: {formatQty(Number(entry.quantity))}</span>
                                      {entry.sourceWarehouseId ? (
                                        <span>{t('inventory.warehouse.selectSource')}: {getWarehouseName(snapshot.warehouseTotals, entry.sourceWarehouseId)}</span>
                                      ) : null}
                                      {entry.targetWarehouseId ? (
                                        <span>{t('inventory.warehouse.selectTarget')}: {getWarehouseName(snapshot.warehouseTotals, entry.targetWarehouseId)}</span>
                                      ) : null}
                                      {entry.reference ? <span>{t('inventory.form.reference')}: {entry.reference}</span> : null}
                                      {entry.performedBy ? <span>{t('common.from')}: {entry.performedBy}</span> : null}
                                    </div>
                                    {entry.notes ? (
                                      <p className="mt-2 text-xs text-muted-foreground">{t('inventory.form.notesLabel')} {entry.notes}</p>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">{t('inventory.history.noHistory')}</p>
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
                                <Label htmlFor="action">{t('inventory.form.submit')}</Label>
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
                                <Label htmlFor="quantity">{t('inventory.form.quantity')}</Label>
                                <Input
                                  id="quantity"
                                  type="number"
                                  step="0.01"
                                  value={formState.quantity}
                                  onChange={(event) => handleFormValue('quantity', event.target.value)}
                                  placeholder={ACTIONS_ALLOWING_NEGATIVE.includes(formState.action) ? t('inventory.form.quantityPlaceholder') : t('inventory.form.exampleQuantity') || '5'}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="source">{t('inventory.warehouse.selectSource')}</Label>
                                <select
                                  id="source"
                                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                  value={formState.sourceWarehouseId}
                                  onChange={(event) => handleFormValue('sourceWarehouseId', event.target.value)}
                                >
                                  <option value="">{t('inventory.warehouse.selectPlaceholder')}</option>
                                  {snapshot.warehouseTotals.map((warehouse) => (
                                    <option key={warehouse.warehouseId} value={warehouse.warehouseId}>
                                      {warehouse.warehouseName}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              {ACTIONS_REQUIRING_TARGET.includes(formState.action) || formState.action === 'inbound' ? (
                                <div className="space-y-2">
                                  <Label htmlFor="target">{t('inventory.warehouse.selectTarget')}</Label>
                                  <select
                                    id="target"
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                    value={formState.targetWarehouseId}
                                    onChange={(event) => handleFormValue('targetWarehouseId', event.target.value)}
                                  >
                                    <option value="">{t('inventory.warehouse.selectPlaceholder')}</option>
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
                                <Label htmlFor="reference">{t('inventory.form.reference')}</Label>
                                <Input
                                  id="reference"
                                  value={formState.reference}
                                  onChange={(event) => handleFormValue('reference', event.target.value)}
                                  placeholder={t('inventory.form.referencePlaceholder')}
                                />
                              </div>
                              <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="notes">{t('inventory.form.notes')}</Label>
                                <textarea
                                  id="notes"
                                  className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                  value={formState.notes}
                                  onChange={(event) => handleFormValue('notes', event.target.value)}
                                  placeholder={t('inventory.form.notes')}
                                />
                              </div>
                              <div className="flex gap-3 md:col-span-2">
                                <Button type="submit" disabled={loading}>
                                  {loading ? t('inventory.status.loading') : t(`inventory.actions.${formState.action}`)}
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
                                  {t('common.cancel')}
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
  value: number | string;
  unit?: string;
  description?: string;
}

interface HistoryEntry {
  id: string;
  transactionType: string;
  quantity: string;
  reference?: string | null;
  notes?: string | null;
  performedBy?: string | null;
  occurredAt: string;
  sourceWarehouseId?: string | null;
  targetWarehouseId?: string | null;
}

interface MutationResponse {
  result: {
    transactionId: string;
  };
  snapshot: InventorySnapshot;
}


