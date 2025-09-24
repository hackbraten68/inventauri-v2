import type { APIRoute } from 'astro';
export const prerender = false;
import { requireUser } from '../../../lib/auth/server';
import { json, errorResponse } from '../../../lib/api/response';
import { getUserShopIdOrThrow } from '../../../lib/tenant';
import { listProducts } from '../../../lib/data/products';

export const GET: APIRoute = async ({ request }) => {
  try {
    const user = await requireUser(request);
    const shopId = await getUserShopIdOrThrow(user.id);

    const products = await listProducts(shopId);
    return json({ data: products });
  } catch (error) {
    const status = typeof (error as { status?: number }).status === 'number' ? (error as { status?: number }).status : 500;
    return errorResponse((error as Error).message ?? 'Unbekannter Fehler', status);
  }
};
