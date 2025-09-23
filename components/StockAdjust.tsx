'use client';

import { useState, ChangeEvent } from 'react';
import { ArrowDownRight, ArrowUpRight, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface StockAdjustProps {
  itemId: string;
  currentStock: number;
  onChanged?: () => void;
  className?: string;
}

export default function StockAdjust({ 
  itemId, 
  currentStock,
  onChanged, 
  className 
}: StockAdjustProps) {
  const [qty, setQty] = useState<number>(1);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQtyChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value || '0');
    setQty(Number.isNaN(value) ? 0 : Math.max(0, value));
  };

  const move = async (sign: 1 | -1) => {
    if (qty <= 0) return;
    
    try {
      setIsSubmitting(true);
      await fetch('/api/stock-moves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          qty: qty * sign,
          reason: sign > 0 ? 'adjust_in' : 'adjust_out',
        }),
      });
      setQty(1);
      onChanged?.();
    } catch (error) {
      console.error('Failed to update stock:', error);
    } finally {
      setIsSubmitting(false);
      setIsAdjusting(false);
    }
  };

  if (!isAdjusting) {
    return (
      <div className={cn("flex items-center justify-end gap-2", className)}>
        <span className="text-sm font-medium">{currentStock}</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsAdjusting(true)}
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => move(-1)}
        disabled={isSubmitting || qty <= 0}
        className="h-7 w-7 p-0"
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <div className="relative w-20">
        <Input
          type="number"
          min={0}
          step={1}
          value={qty}
          onChange={handleQtyChange}
          className="h-7 text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          autoFocus
        />
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => move(1)}
        disabled={isSubmitting || qty <= 0}
        className="h-7 w-7 p-0"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
      <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => move(1)}>
        <ArrowUpRight className="h-4 w-4" />
      </Button>
      <Button type="button" variant="destructive" size="icon" className="h-9 w-9" onClick={() => move(-1)}>
        <ArrowDownRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
