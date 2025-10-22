import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

type SalesDirection = 'up' | 'down' | 'flat' | 'na';

interface SalesDelta {
  currentTotal: number;
  priorTotal: number;
  absolute: number;
  percentage: number | null;
  direction: SalesDirection;
  metric: 'revenue' | 'units';
}

interface DashboardSnapshot {
  totals: {
    itemCount: number;
    totalOnHand: number;
    totalValue: number;
    salesQuantity: number;
    salesRevenue: number;
    salesDelta?: SalesDelta;
  };
  warnings: Array<{
    itemId: string;
    itemName: string;
    sku: string;
    warehouseId: string;
    warehouseName: string;
    quantityOnHand: number;
    threshold: number;
    daysOfCover?: number | null;
    daysOfCoverStatus?: 'ok' | 'risk' | 'insufficient-data';
    avgDailySales?: number | null;
  }>;
  mostSold: Array<{
    itemId: string;
    name: string;
    sku: string;
    quantity: number;
  }>;
  recentTransactions: Array<{
    id: string;
    itemId: string;
    itemName: string;
    sku: string;
    warehouseName: string;
    quantity: number;
    type: string;
    occurredAt: string;
    reference?: string | null;
  }>;
}

const numberFormatter = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
const currencyFormatter = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

const ranges = [
  { label: '7 Tage', value: 7 },
  { label: '14 Tage', value: 14 },
  { label: '30 Tage', value: 30 }
];

export function DashboardOverview() {
  const [range, setRange] = useState(7);
  const [data, setData] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let interval: ReturnType<typeof setInterval> | null = null;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/dashboard?range=${range}`);
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error ?? 'Dashboard konnte nicht geladen werden.');
        }
        if (active) {
          setData(json);
        }
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'Unbekannter Fehler.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void fetchData();
    interval = setInterval(fetchData, 30000);

    return () => {
      active = false;
      if (interval) clearInterval(interval);
    };
  }, [range]);

  const warningCount = data?.warnings.length ?? 0;
  const totalSold = data?.mostSold.reduce((sum, entry) => sum + entry.quantity, 0) ?? 0;
  const salesDelta = data?.totals.salesDelta;
  const salesMetric = salesDelta?.metric ?? 'revenue';
  const salesValue =
    salesDelta?.currentTotal ??
    (salesMetric === 'revenue' ? data?.totals.salesRevenue ?? 0 : data?.totals.salesQuantity ?? 0);

  function formatSalesValue(value: number, metric: 'revenue' | 'units') {
    return metric === 'revenue' ? currencyFormatter.format(value ?? 0) : numberFormatter.format(value ?? 0);
  }

  function deltaBadgeContent(delta?: SalesDelta) {
    if (!delta || delta.direction === 'na') {
      return { text: 'Keine Vergleichsdaten', variant: 'secondary' as const };
    }

    const sign = delta.absolute > 0 ? '+' : delta.absolute < 0 ? '−' : '';
    const arrow = delta.direction === 'up' ? '▲' : delta.direction === 'down' ? '▼' : '→';
    let percentage: string | null = null;
    if (delta.percentage !== null) {
      const value = Math.abs(delta.percentage).toFixed(1);
      if (delta.percentage > 0) {
        percentage = `+${value}%`;
      } else if (delta.percentage < 0) {
        percentage = `−${value}%`;
      } else {
        percentage = `${value}%`;
      }
    }
    const textValue = percentage ?? `${sign}${formatSalesValue(Math.abs(delta.absolute), delta.metric)}`;

    const variant: 'default' | 'secondary' | 'destructive' =
      delta.direction === 'down' ? 'destructive' : delta.direction === 'up' ? 'default' : 'secondary';
    return { text: `${arrow} ${textValue}`.trim(), variant };
  }

  function deltaDescription(delta?: SalesDelta) {
    if (!delta || delta.direction === 'na') {
      return 'Keine Vergleichsdaten für den vorherigen Zeitraum.';
    }
    const absolute = formatSalesValue(Math.abs(delta.absolute), delta.metric);
    let percentage: string | null = null;
    if (delta.percentage !== null) {
      const value = Math.abs(delta.percentage).toFixed(1);
      if (delta.percentage > 0) {
        percentage = `+${value}%`;
      } else if (delta.percentage < 0) {
        percentage = `−${value}%`;
      } else {
        percentage = `${value}%`;
      }
    }
    const prefix = delta.absolute >= 0 ? '+' : '−';
    if (percentage) {
      return `${prefix}${absolute} (${percentage}) gegenüber dem vorherigen Zeitraum.`;
    }
    return `${prefix}${absolute} gegenüber dem vorherigen Zeitraum.`;
  }

  const badge = deltaBadgeContent(salesDelta);

  function coverMeta(warning: DashboardSnapshot['warnings'][number]) {
    if (warning.daysOfCover === null || warning.daysOfCover === undefined) {
      return {
        text: 'Zu wenig Daten für Prognose.',
        className: 'text-muted-foreground'
      } as const;
    }

    const formatter = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const formatted = formatter.format(warning.daysOfCover);

    if (warning.daysOfCoverStatus === 'risk') {
      return {
        text: `≈ ${formatted} Tage Abdeckung – kritisch`,
        className: 'text-destructive font-medium'
      } as const;
    }

    return {
      text: `≈ ${formatted} Tage Abdeckung verfügbar`,
      className: 'text-muted-foreground'
    } as const;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Kennzahlen</h2>
          <p className="text-sm text-muted-foreground">Live-Update alle 30 Sekunden.</p>
        </div>
        <div className="flex gap-2">
          {ranges.map((option) => (
            <Button
              key={option.value}
              variant={range === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader>
            <CardTitle>Artikel gesamt</CardTitle>
            <CardDescription>Aktive Produkte mit Bestand</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">
              {loading ? '—' : numberFormatter.format(data?.totals.itemCount ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bestand (Stück)</CardTitle>
            <CardDescription>Zentral + POS</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">
              {loading ? '—' : numberFormatter.format(data?.totals.totalOnHand ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bestandswert</CardTitle>
            <CardDescription>VK auf Basis Artikelpreis</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">
              {loading ? '—' : currencyFormatter.format(data?.totals.totalValue ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Verkäufe</CardTitle>
              <CardDescription>Vergleich der letzten {range} Tage</CardDescription>
            </div>
            <Badge variant={badge.variant}>{badge.text}</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">
              {loading ? '—' : formatSalesValue(salesValue, salesMetric)}
            </p>
            <p className="text-sm text-muted-foreground">{loading ? 'Wird geladen …' : deltaDescription(salesDelta)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Warnungen</CardTitle>
              <CardDescription>Bestände unter Schwelle</CardDescription>
            </div>
            <Badge variant={warningCount > 0 ? 'destructive' : 'secondary'}>{warningCount}</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {warningCount > 0 ? 'Überprüfe Lager und löse Nachbestellungen aus.' : 'Keine Warnungen aktiv.'}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Verkaufte Artikel</CardTitle>
            <CardDescription>
              {loading ? '—' : `${numberFormatter.format(totalSold)} Stück in den letzten ${range} Tagen`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Lade Daten …</p>
            ) : data && data.mostSold.length > 0 ? (
              <div className="space-y-2">
                {data.mostSold.map((entry) => (
                  <div key={entry.itemId} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{entry.name}</p>
                      <p className="text-xs text-muted-foreground">{entry.sku}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{numberFormatter.format(entry.quantity)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Noch keine Verkäufe im ausgewählten Zeitraum.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Warnungen</CardTitle>
            <CardDescription>Artikel unter Mindestbestand pro Lager</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Lade Daten …</p>
            ) : data && data.warnings.length > 0 ? (
              <div className="space-y-2">
                {data.warnings.map((warning) => {
                  const meta = coverMeta(warning);
                  return (
                    <div key={`${warning.itemId}-${warning.warehouseId}`} className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs">
                      <p className="font-medium text-destructive">{warning.itemName}</p>
                      <p className="text-muted-foreground">{warning.warehouseName}</p>
                      <p className="text-muted-foreground">
                        Bestand {warning.quantityOnHand} / Schwelle {warning.threshold}
                      </p>
                      <p className={meta.className}>{meta.text}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aktuell keine Warnungen.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Letzte Bewegungen</CardTitle>
              <CardDescription>Transaktionen der letzten {range} Tage</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setRange(range)} disabled={loading}>
              Aktualisieren
            </Button>
          </CardHeader>
          <CardContent>
            {loading && !data ? (
              <p className="text-sm text-muted-foreground">Lade Daten …</p>
            ) : data && data.recentTransactions.length > 0 ? (
              <div className="space-y-2 text-sm">
                {data.recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                    <div>
                      <p className="font-medium text-foreground">{transaction.itemName}</p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.type.toUpperCase()} · {transaction.warehouseName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{transaction.quantity}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.occurredAt).toLocaleString('de-DE')} {transaction.reference ? `· ${transaction.reference}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Keine Bewegungen im ausgewählten Zeitraum.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
