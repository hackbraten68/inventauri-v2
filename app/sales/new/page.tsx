'use client';

import Link from 'next/link';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRightCircle, PlusCircle, Trash2 } from 'lucide-react';

import ProtectedRoute from '@/components/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { money } from '@/lib/utils';

interface Item {
  id: string;
  name: string;
  priceCents: number;
}

interface CartItem {
  itemId: string;
  qty: number;
  unitPriceCents: number;
}

export default function NewSalePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      const response = await fetch('/api/items');
      const data = await response.json();
      setItems(data);
    };
    void fetchItems();
  }, []);

  const addToCart = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    setCart((current) => {
      const existingIndex = current.findIndex((line) => line.itemId === itemId);
      if (existingIndex !== -1) {
        const updated = [...current];
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: updated[existingIndex].qty + 1,
        };
        return updated;
      }
      return [...current, { itemId, qty: 1, unitPriceCents: item.priceCents }];
    });
  };

  const removeFromCart = (index: number) => {
    setCart((current) => current.filter((_, i) => i !== index));
  };

  const updateCartItem = (index: number, field: 'qty' | 'unitPriceCents', value: number) => {
    setCart((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: field === 'qty' ? Math.max(0.01, value) : Math.max(0, Math.round(value)),
            }
          : item
      )
    );
  };

  const totalCents = useMemo(
    () => cart.reduce((sum, line) => sum + line.qty * line.unitPriceCents, 0),
    [cart]
  );

  const checkout = async () => {
    try {
      setSubmitting(true);
      await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: cart }),
      });
      setCart([]);
    } catch (error) {
      console.error('Failed to record sale:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        <Button variant="ghost" size="sm" asChild className="w-fit gap-2 border border-transparent hover:border-border/40">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>

        <div className="flex flex-col gap-6 lg:flex-row">
          <Card className="w-full border border-border/40 bg-muted/20 lg:w-1/2">
            <CardHeader>
              <CardTitle>Catalog</CardTitle>
              <CardDescription>Select products to build the order. Click a product to add it to the cart.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item.id)}
                    className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-4 py-3 text-left transition hover:border-primary/60 hover:bg-primary/5"
                    type="button"
                  >
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{money(item.priceCents)}</p>
                    </div>
                    <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary">
                      <PlusCircle className="h-3.5 w-3.5" /> Add
                    </Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="w-full border border-border/40 bg-muted/20 lg:w-1/2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cart</CardTitle>
                  <CardDescription>Adjust quantities or override price per unit before checking out.</CardDescription>
                </div>
                <Badge variant="secondary">{cart.length} lines</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/40 p-8 text-center text-sm text-muted-foreground">
                  Cart is empty. Start by adding items from the catalog.
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((line, index) => {
                    const item = items.find((i) => i.id === line.itemId);
                    return (
                      <div key={`${line.itemId}-${index}`} className="space-y-3 rounded-lg border border-border/40 bg-background/50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{item?.name ?? 'Unknown Item'}</p>
                            <p className="text-xs text-muted-foreground">Unit price {money(line.unitPriceCents)}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeFromCart(index)} aria-label="Remove from cart">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`qty-${index}`} className="text-xs uppercase tracking-wide text-muted-foreground">
                              Quantity
                            </Label>
                            <Input
                              id={`qty-${index}`}
                              type="number"
                              min={0.01}
                              step={0.01}
                              value={line.qty}
                              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                updateCartItem(index, 'qty', parseFloat(event.target.value) || 0)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`price-${index}`} className="text-xs uppercase tracking-wide text-muted-foreground">
                              Unit price (cents)
                            </Label>
                            <Input
                              id={`price-${index}`}
                              type="number"
                              min={0}
                              step={1}
                              value={line.unitPriceCents}
                              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                updateCartItem(index, 'unitPriceCents', parseInt(event.target.value, 10) || 0)
                              }
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Line total</span>
                          <span className="font-semibold text-foreground">
                            {money(Math.round(line.qty * line.unitPriceCents))}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/70 px-4 py-3">
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Order total</p>
                      <p>{cart.length} item(s)</p>
                    </div>
                    <p className="text-2xl font-semibold text-foreground">{money(totalCents)}</p>
                  </div>

                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={checkout}
                    disabled={submitting || cart.length === 0}
                  >
                    <ArrowRightCircle className="h-5 w-5" />
                    {submitting ? 'Processing…' : 'Complete sale'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
