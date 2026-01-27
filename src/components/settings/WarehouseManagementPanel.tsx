import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Plus, Store, Building, Package, Loader2, Edit2, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Warehouse {
    id: string;
    name: string;
    slug: string;
    type: 'central' | 'pos' | 'virtual';
    address?: string | null;
    posProfile?: {
        contactName?: string | null;
        contactEmail?: string | null;
    } | null;
}

const TYPE_LABELS = {
    pos: 'POS / Verkauf',
    central: 'Zentrallager',
    virtual: 'Virtuell'
};

const TYPE_ICONS = {
    pos: Store,
    central: Building,
    virtual: Package
};

export function WarehouseManagementPanel() {
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: '',
        type: 'pos' as 'central' | 'pos' | 'virtual',
        address: '',
        contactName: '',
        contactEmail: ''
    });

    useEffect(() => {
        fetchWarehouses();
    }, []);

    const fetchWarehouses = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/warehouses');
            const data = await res.json();
            if (res.ok) {
                setWarehouses(data.warehouses);
            }
        } catch (e) {
            console.error('Fetch failed:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (w: Warehouse) => {
        setEditId(w.id);
        setIsCreating(true);
        setForm({
            name: w.name,
            type: w.type,
            address: w.address || '',
            contactName: w.posProfile?.contactName || '',
            contactEmail: w.posProfile?.contactEmail || ''
        });
    };

    const handleCancel = () => {
        setIsCreating(false);
        setEditId(null);
        setForm({ name: '', type: 'pos', address: '', contactName: '', contactEmail: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            const url = editId ? `/api/warehouses/${editId}` : '/api/warehouses';
            const method = editId ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Fehler beim Speichern');

            setSuccess(`Standort "${data.warehouse.name}" wurde ${editId ? 'aktualisiert' : 'erstellt'}.`);
            handleCancel();
            await fetchWarehouses();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-foreground">Standorte & Lager</h3>
                    <p className="text-sm text-muted-foreground">Verwalte deine physischen und virtuellen Lagerorte.</p>
                </div>
                {!isCreating && (
                    <Button onClick={() => setIsCreating(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Neuer Standort
                    </Button>
                )}
            </div>

            {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            {success && <p className="rounded-lg bg-primary/10 p-3 text-sm text-primary">{success}</p>}

            {isCreating && (
                <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border p-4 bg-background/40">
                    <div className="flex items-center justify-between border-b border-border pb-2 mb-4">
                        <h4 className="font-semibold">{editId ? 'Standort bearbeiten' : 'Neuen Standort anlegen'}</h4>
                        <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name des Standorts</Label>
                            <Input
                                id="name"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="z.B. Store Berlin Mitte"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Typ</Label>
                            <select
                                id="type"
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                value={form.type}
                                onChange={e => setForm({ ...form, type: e.target.value as any })}
                            >
                                <option value="pos">POS / Verkaufsstelle</option>
                                <option value="central">Zentrallager</option>
                                <option value="virtual">Virtuelles Lager</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Adresse (Optional)</Label>
                        <Input
                            id="address"
                            value={form.address}
                            onChange={e => setForm({ ...form, address: e.target.value })}
                            placeholder="Musterstr. 123, 12345 Berlin"
                        />
                    </div>

                    {form.type === 'pos' && !editId && (
                        <div className="grid gap-4 sm:grid-cols-2 border-t border-border pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="contactName">Ansprechpartner</Label>
                                <Input
                                    id="contactName"
                                    value={form.contactName}
                                    onChange={e => setForm({ ...form, contactName: e.target.value })}
                                    placeholder="Vorname Nachname"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contactEmail">Kontakt E-Mail</Label>
                                <Input
                                    id="contactEmail"
                                    type="email"
                                    value={form.contactEmail}
                                    onChange={e => setForm({ ...form, contactEmail: e.target.value })}
                                    placeholder="pos@inventauri.app"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 pt-2">
                        <Button type="submit" disabled={loading} className="gap-2">
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {editId ? 'Aktualisieren' : 'Speichern'}
                        </Button>
                        <Button type="button" variant="ghost" onClick={handleCancel}>
                            Abbrechen
                        </Button>
                    </div>
                </form>
            )}

            {!isCreating && (
                <div className="rounded-lg border border-border overflow-hidden">
                    <table className="min-w-full divide-y divide-border text-sm">
                        <thead className="bg-muted/40 text-xs uppercase text-muted-foreground font-medium">
                            <tr>
                                <th className="px-4 py-3 text-left">Standort</th>
                                <th className="px-4 py-3 text-left">Typ</th>
                                <th className="px-4 py-3 text-left">Adresse</th>
                                <th className="px-4 py-3 text-right">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading && warehouses.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground animate-pulse">
                                        Wird geladen...
                                    </td>
                                </tr>
                            ) : warehouses.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                                        Noch keine Standorte definiert.
                                    </td>
                                </tr>
                            ) : (
                                warehouses.map(w => {
                                    const Icon = TYPE_ICONS[w.type] || Package;
                                    return (
                                        <tr key={w.id} className="hover:bg-accent/40 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                                                        <Icon className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-foreground">{w.name}</span>
                                                        <span className="text-xs text-muted-foreground">{w.slug}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {TYPE_LABELS[w.type]}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                                                {w.address || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button size="sm" variant="ghost" onClick={() => handleEdit(w)}>
                                                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                                                    Bearbeiten
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
