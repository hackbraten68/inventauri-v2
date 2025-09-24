import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSaleReference(warehouseSlug?: string) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const core = `${y}${m}${d}-${h}${min}${s}`;
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  const prefix = warehouseSlug ? warehouseSlug.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : 'POS';
  return `${prefix}-${core}-${random}`;
}
