import type { APIRoute } from 'astro';
export const prerender = false;
import { requireUser } from '../../../lib/auth/server';
import { json, errorResponse } from '../../../lib/api/response';
import { getItemHistory } from '../../../lib/services/stock';
import { TransactionType } from '@prisma/client';
import { getUserShopIdOrThrow } from '../../../lib/tenant';

export const GET: APIRoute = async ({ request }) => {
  try {
    const user = await requireUser(request);
    const shopId = await getUserShopIdOrThrow(user.id);

    const url = new URL(request.url);
    const itemId = url.searchParams.get('itemId');

    if (!itemId) {
      return errorResponse('itemId ist erforderlich.');
    }

    const limitParam = url.searchParams.get('limit');
    const offsetParam = url.searchParams.get('offset');
    const typesParam = url.searchParams.get('types');
    const warehouseId = url.searchParams.get('warehouseId');
    const fromParam = url.searchParams.get('from');
    const toParam = url.searchParams.get('to');

    const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 50, 200) : 50;
    const offset = offsetParam ? parseInt(offsetParam, 10) || 0 : 0;
    const transactionTypes = typesParam
      ? typesParam
          .split(',')
          .map((type) => type.trim())
          .filter((type): type is TransactionType => Object.values(TransactionType).includes(type as TransactionType))
      : undefined;

    const from = fromParam ? new Date(fromParam) : undefined;
    const to = toParam ? new Date(toParam) : undefined;

    const history = await getItemHistory({
      itemId,
      limit,
      offset,
      transactionTypes,
      warehouseId: warehouseId ?? undefined,
      from,
      to,
      shopId
    });

    return json({
      data: history,
      pagination: {
        limit,
        offset
      }
    });
  } catch (error) {
    const status = typeof (error as { status?: number }).status === 'number' ? (error as { status?: number }).status : 500;
    return errorResponse((error as Error).message ?? 'Unbekannter Fehler', status);
  }
};
