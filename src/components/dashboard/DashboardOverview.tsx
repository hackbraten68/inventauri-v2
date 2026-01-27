import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Wallet,
  ShoppingCart,
  AlertTriangle,
  History,
  Activity,
  Calendar,
  LayoutDashboard
} from 'lucide-react';

type SalesDirection = 'up' | 'down' | 'flat' | 'na';
type ChartMetric = 'revenue' | 'units' | 'orders' | 'aov';

interface SalesDelta {
  currentTotal: number;
  priorTotal: number;
  absolute: number;
  percentage: number | null;
  direction: SalesDirection;
  metric: 'revenue' | 'units';
}

interface TimeSeriesPoint {
  date: string;
  revenue: number;
  units: number;
  orders: number;
  aov?: number;
}

interface DashboardSnapshot {
  totals: {
    itemCount: number;
    totalOnHand: number;
    totalValue: number;
    salesQuantity: number;
    salesRevenue: number;
    totalOrders: number;
    salesDelta?: SalesDelta;
  };
  salesHistory: TimeSeriesPoint[];
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
    inboundCoverage?: {
      totalInboundUnits: number;
      nextArrivalDate: string | null;
      references: string[];
    } | null;
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

const METRICS: { label: string; value: ChartMetric }[] = [
  { label: 'Umsatz', value: 'revenue' },
  { label: 'Menge', value: 'units' },
  { label: 'Orders', value: 'orders' },
  { label: 'Ø Warenkorb', value: 'aov' }
];

export function DashboardOverview() {
  const [range, setRange] = useState<number | 'custom'>(7);
  const [activeMetric, setActiveMetric] = useState<ChartMetric>('units');
  const [customRange, setCustomRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
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

        let url = `/api/dashboard?range=${range === 'custom' ? '' : range}`;
        if (range === 'custom') {
          url = `/api/dashboard?from=${customRange.from}&to=${customRange.to}`;
        }

        const response = await fetch(url);
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error ?? 'Dashboard konnte nicht geladen werden.');
        }
        if (active) {
          setData(json);
          // Auto-switch to revenue if there is any, otherwise stay on units
          if (activeMetric === 'units' && json.totals.salesRevenue > 0) {
            setActiveMetric('revenue');
          }
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
  }, [range, customRange]);

  const warningCount = data?.warnings.length ?? 0;
  const totalSold = data?.mostSold.reduce((sum, entry) => sum + entry.quantity, 0) ?? 0;
  const salesDelta = data?.totals.salesDelta;
  const salesMetric = salesDelta?.metric ?? 'revenue';
  const salesValue =
    salesDelta?.currentTotal ??
    (salesMetric === 'revenue' ? data?.totals.salesRevenue ?? 0 : data?.totals.salesQuantity ?? 0);

  const avgOrderValue = useMemo(() => {
    if (!data?.totals.totalOrders || data.totals.totalOrders === 0) return 0;
    return data.totals.salesRevenue / data.totals.totalOrders;
  }, [data]);

  const chartData = useMemo(() => {
    if (!data?.salesHistory) return [];
    return data.salesHistory.map(point => ({
      ...point,
      aov: point.orders > 0 ? point.revenue / point.orders : 0
    }));
  }, [data]);

  function formatSalesValue(value: number, metric: 'revenue' | 'units') {
    return metric === 'revenue' ? currencyFormatter.format(value ?? 0) : numberFormatter.format(value ?? 0);
  }

  function deltaBadgeContent(delta?: SalesDelta) {
    if (!delta || delta.direction === 'na') {
      return { text: 'Keine Vergleichsdaten', variant: 'secondary' as const, icon: null };
    }

    const sign = delta.absolute > 0 ? '+' : delta.absolute < 0 ? '−' : '';
    const Icon = delta.direction === 'up' ? TrendingUp : delta.direction === 'down' ? TrendingDown : Activity;
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

    return { text: textValue, variant, icon: Icon };
  }

  function deltaDescription(delta?: SalesDelta) {
    if (!delta || delta.direction === 'na') {
      return 'Keine Vergleichsdaten.';
    }
    const absolute = formatSalesValue(Math.abs(delta.absolute), delta.metric);
    const prefix = delta.absolute >= 0 ? '+' : '−';
    return `${prefix}${absolute} vs. Vorperiode`;
  }

  const badge = deltaBadgeContent(salesDelta);

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Business Overview</h2>
          </div>
          <p className="text-sm text-muted-foreground font-medium">Monitoring your inventory performance in real-time.</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 bg-muted/50 p-1 rounded-lg border border-border">
          {ranges.map((option) => (
            <Button
              key={option.value}
              variant={range === option.value ? 'secondary' : 'ghost'}
              size="sm"
              className={`h-8 px-4 text-xs font-semibold transition-all ${range === option.value ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              onClick={() => setRange(option.value)}
            >
              {option.label}
            </Button>
          ))}
          <Button
            variant={range === 'custom' ? 'secondary' : 'ghost'}
            size="sm"
            className={`h-8 px-4 text-xs font-semibold transition-all ${range === 'custom' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
              }`}
            onClick={() => setRange('custom')}
          >
            Custom
          </Button>

          {range === 'custom' && (
            <div className="flex items-center gap-2 ml-1 px-2 border-l border-border animate-in fade-in slide-in-from-left-2 transition-all">
              <input
                type="date"
                value={customRange.from}
                onChange={(e) => setCustomRange(prev => ({ ...prev, from: e.target.value }))}
                className="bg-transparent text-xs font-bold focus:outline-none w-[110px] accent-primary"
              />
              <span className="text-[10px] text-muted-foreground font-bold opacity-50 px-1">bis</span>
              <input
                type="date"
                value={customRange.to}
                onChange={(e) => setCustomRange(prev => ({ ...prev, to: e.target.value }))}
                className="bg-transparent text-xs font-bold focus:outline-none w-[110px] accent-primary"
              />
            </div>
          )}
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">{error}</span>
        </div>
      ) : null}

      {/* Primary KPIs */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mt-4">
        <Card className="border-none bg-card shadow-sm ring-1 ring-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Umsatz Total</CardTitle>
            <Wallet className="h-4 w-4 text-primary opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground tabular-nums">
              {loading ? '—' : currencyFormatter.format(data?.totals.salesRevenue ?? 0)}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              {badge.icon && <badge.icon className={`h-3 w-3 ${badge.variant === 'destructive' ? 'text-destructive' : 'text-primary'}`} />}
              <span className={`text-[10px] font-bold ${badge.variant === 'destructive' ? 'text-destructive' : 'text-primary'}`}>
                {badge.text}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">vs. Vorperiode</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-sm ring-1 ring-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ø Best.-Wert</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500 opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground tabular-nums">
              {loading ? '—' : currencyFormatter.format(avgOrderValue)}
            </div>
            <p className="text-[10px] text-muted-foreground font-medium mt-1">Average order value per checkout</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-sm ring-1 ring-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Checkouts</CardTitle>
            <Calendar className="h-4 w-4 text-indigo-500 opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground tabular-nums">
              {loading ? '—' : numberFormatter.format(data?.totals.totalOrders ?? 0)}
            </div>
            <p className="text-[10px] text-muted-foreground font-medium mt-1">Total orders processed</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-sm ring-1 ring-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lagerwert</CardTitle>
            <Package className="h-4 w-4 text-orange-500 opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground tabular-nums">
              {loading ? '—' : currencyFormatter.format(data?.totals.totalValue ?? 0)}
            </div>
            <p className="text-[10px] text-muted-foreground font-medium mt-1">Current total inventory value</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-sm ring-1 ring-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Items In Stock</CardTitle>
            <Activity className="h-4 w-4 text-green-500 opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground tabular-nums">
              {loading ? '—' : numberFormatter.format(data?.totals.totalOnHand ?? 0)}
            </div>
            <p className="text-[10px] text-muted-foreground font-medium mt-1">Total physical units</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-sm ring-1 ring-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kritisch</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${warningCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-black tabular-nums ${warningCount > 0 ? 'text-destructive' : 'text-foreground'}`}>
              {loading ? '—' : warningCount}
            </div>
            <p className="text-[10px] text-muted-foreground font-medium mt-1">Items below threshold</p>
          </CardContent>
        </Card>
      </section>

      {/* Visualization and Top Lists */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main Chart */}
        <Card className="lg:col-span-8 border-none shadow-premium ring-1 ring-border/50 overflow-hidden bg-card">
          <CardHeader className="px-6 py-6 border-b border-border/50">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold">
                  {METRICS.find(m => m.value === activeMetric)?.label || 'Performance'}
                </CardTitle>
                <CardDescription className="font-medium">
                  {activeMetric === 'revenue' ? 'Täglicher Umsatzverlauf' :
                    activeMetric === 'units' ? 'Verkaufte Einheiten pro Tag' :
                      activeMetric === 'orders' ? 'Gesamtbestellungen pro Tag' : 'Durchschnittlicher Warenkorbwert'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border">
                {METRICS.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setActiveMetric(m.value)}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${activeMetric === m.value
                        ? 'bg-background text-primary shadow-sm ring-1 ring-border/50'
                        : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[320px] w-full">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => {
                        const d = new Date(val);
                        return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
                      }}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => (activeMetric === 'revenue' || activeMetric === 'aov') ? `€${val}` : val}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '12px',
                        fontSize: '12px',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                      }}
                      formatter={(val: any) => [
                        (activeMetric === 'revenue' || activeMetric === 'aov')
                          ? currencyFormatter.format(Number(val) || 0)
                          : numberFormatter.format(Number(val) || 0),
                        METRICS.find(m => m.value === activeMetric)?.label
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey={activeMetric}
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorActive)"
                      animationDuration={400}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="lg:col-span-4 border-none shadow-premium ring-1 ring-border/50 bg-card">
          <CardHeader className="px-6 py-6 border-b border-border/50">
            <CardTitle className="text-lg font-bold">Top Seller</CardTitle>
            <CardDescription className="font-medium">Meistverkaufte Artikel</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-5">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 w-full bg-muted animate-pulse rounded-xl" />)}
                </div>
              ) : data && data.mostSold.length > 0 ? (
                data.mostSold.map((entry, index) => (
                  <div key={entry.itemId} className="group flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-xs font-black text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        {index + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground truncate max-w-[150px]">{entry.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground opacity-70">{entry.sku}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="font-black tabular-nums h-7 rounded-lg">
                      {numberFormatter.format(entry.quantity)}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 opacity-40">Keine Daten verfügbar</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Recent Transactions */}
        <Card className="lg:col-span-8 border-none shadow-premium ring-1 ring-border/50 bg-card">
          <CardHeader className="px-6 py-6 border-b border-border/50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Lager-Journal</CardTitle>
              <CardDescription className="font-medium">Letzte 15 Transaktionen</CardDescription>
            </div>
            <History className="h-5 w-5 text-muted-foreground opacity-30" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {loading ? (
                <div className="p-12 text-center text-muted-foreground text-sm">Lade Transaktionen...</div>
              ) : data && data.recentTransactions.length > 0 ? (
                data.recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/30">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-[10px] ${tx.type === 'sale' ? 'bg-green-100 text-green-700' :
                        tx.type === 'inbound' ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground'
                        }`}>
                        {tx.type.slice(0, 3).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{tx.itemName}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {tx.warehouseName} · {new Date(tx.occurredAt).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black ${tx.type === 'sale' ? 'text-destructive' : 'text-green-600'}`}>
                        {tx.type === 'sale' ? '-' : '+'}{tx.quantity}
                      </p>
                      {tx.reference && (
                        <p className="text-[10px] font-mono text-muted-foreground opacity-50">{tx.reference}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-muted-foreground text-sm">Keine Bewegungen vorhanden.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Warnings / Inventory Health */}
        <Card className="lg:col-span-4 border-none shadow-premium ring-1 ring-border/50 bg-card">
          <CardHeader className="px-6 py-6 border-b border-border/50">
            <CardTitle className="text-lg font-bold">Inventory Health</CardTitle>
            <CardDescription className="font-medium">Kritische Bestände</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Prüfe Bestände...</p>
              ) : data && data.warnings.length > 0 ? (
                data.warnings.map((warning) => (
                  <div key={`${warning.itemId}-${warning.warehouseId}`} className="p-4 rounded-2xl border border-destructive/20 bg-destructive/5 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-destructive">{warning.itemName}</p>
                        <p className="text-[10px] font-semibold text-muted-foreground opacity-70 uppercase tracking-wider">{warning.warehouseName}</p>
                      </div>
                      <Badge variant="destructive" className="font-black">{warning.quantityOnHand}</Badge>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-destructive/10">
                      <Activity className="h-3 w-3 text-destructive" />
                      <span className="text-[10px] font-bold text-destructive">Threshold: {warning.threshold}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center opacity-30">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-sm font-bold">Alles im grünen Bereich</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
