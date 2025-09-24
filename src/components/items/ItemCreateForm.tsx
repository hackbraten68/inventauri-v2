import { useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase-client';
import { setAccessTokenCookie } from '../../lib/auth/cookies';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface WarehouseOption {
  id: string;
  name: string;
  slug: string;
  type: string;
}

interface ItemCreateFormProps {
  warehouses: WarehouseOption[];
  defaultWarehouseId: string | null;
}

interface FormState {
  name: string;
  sku: string;
  unit: string;
  barcode: string;
  description: string;
  price: string;
  supplier: string;
  initialStock: string;
  warehouseId: string;
}

const initialState = (defaultWarehouseId: string | null): FormState => ({
  name: '',
  sku: '',
  unit: 'stk',
  barcode: '',
  description: '',
  price: '',
  supplier: '',
  initialStock: '0',
  warehouseId: defaultWarehouseId ?? ''
});

export function ItemCreateForm({ warehouses, defaultWarehouseId }: ItemCreateFormProps) {
  const [form, setForm] = useState<FormState>(() => initialState(defaultWarehouseId));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const hasWarehouses = warehouses.length > 0;

  const handleChange = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({
      ...prev,
      [key]: event.target.value
    }));
  };

  const resetForm = () => {
    setForm(initialState(defaultWarehouseId));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!form.name.trim() || !form.sku.trim()) {
        throw new Error('Name und SKU sind erforderlich.');
      }

      const stockValue = Number(form.initialStock || '0');
      if (Number.isNaN(stockValue) || stockValue < 0) {
        throw new Error('Startbestand muss eine Zahl >= 0 sein.');
      }

      if (stockValue > 0 && !form.warehouseId) {
        throw new Error('Für einen Startbestand muss ein Lager ausgewählt werden.');
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        throw sessionError;
      }
      const token = data.session?.access_token;
      if (!token) {
        throw new Error('Keine aktive Supabase Session gefunden.');
      }
      setAccessTokenCookie(token, data.session?.expires_in ?? undefined);

      const metadata: Record<string, unknown> = {};
      if (form.price) metadata.price = Number(form.price);
      if (form.supplier) metadata.supplier = form.supplier;

      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: form.name,
          sku: form.sku,
          unit: form.unit,
          barcode: form.barcode || null,
          description: form.description || null,
          metadata: Object.keys(metadata).length ? metadata : undefined,
          initialStock: stockValue,
          warehouseId: stockValue > 0 ? form.warehouseId : null,
          notes: form.supplier ? `Angelegt für ${form.supplier}` : undefined
        })
      });

      const dataJson = await response.json();
      if (!response.ok) {
        throw new Error(dataJson.error ?? 'Artikel konnte nicht angelegt werden.');
      }

      setSuccess('Artikel erfolgreich angelegt.');
      resetForm();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unbekannter Fehler beim Anlegen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="grid gap-6 lg:grid-cols-[1.5fr_1fr]" onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Stammdaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Artikelname</Label>
            <Input id="name" placeholder="z.B. Kaffee Premium 250g" value={form.name} onChange={handleChange('name')} required />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" placeholder="KAFFEE-250" value={form.sku} onChange={handleChange('sku')} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input id="barcode" placeholder="Scan Code" value={form.barcode} onChange={handleChange('barcode')} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="unit">Einheit</Label>
              <Input id="unit" placeholder="z.B. stk, kg" value={form.unit} onChange={handleChange('unit')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Lieferant</Label>
              <Input id="supplier" placeholder="z.B. Rösterei XYZ" value={form.supplier} onChange={handleChange('supplier')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <textarea
              id="description"
              className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Kurzbeschreibung, Verkaufsargumente"
              value={form.description}
              onChange={handleChange('description')}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Preis & Bestand</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="price">Preis (EUR)</Label>
            <Input id="price" type="number" step="0.01" placeholder="0.00" value={form.price} onChange={handleChange('price')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="initialStock">Startbestand</Label>
            <Input id="initialStock" type="number" min="0" placeholder="0" value={form.initialStock} onChange={handleChange('initialStock')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="warehouse">Lager für Startbestand</Label>
            <select
              id="warehouse"
              value={form.warehouseId}
              onChange={handleChange('warehouseId')}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              disabled={!hasWarehouses}
            >
              <option value="">Bitte wählen</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
            {!hasWarehouses ? (
              <p className="text-xs text-muted-foreground">Noch keine Lager vorhanden. Lege zuerst ein Lager im Inventar an.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
      <div className="lg:col-span-2 flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={resetForm} disabled={loading}>
          Zurücksetzen
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Speichern …' : 'Artikel speichern'}
        </Button>
      </div>
      {error ? <p className="lg:col-span-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
      {success ? <p className="lg:col-span-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">{success}</p> : null}
    </form>
  );
}
