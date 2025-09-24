import { supabase } from '../supabase-client';

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  const token = data.session?.access_token;
  if (!token) {
    throw new Error('Keine aktive Supabase Session gefunden. Melde dich erneut an.');
  }
  return token;
}

async function handleResponse(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error ?? 'Unbekannter Fehler');
  }
  return data;
}

export async function postStockAction<TResult = unknown>(
  path: string,
  payload: Record<string, unknown>
): Promise<TResult> {
  const token = await getAccessToken();
  const response = await fetch(`/api/stock/${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  return handleResponse(response);
}

export interface HistoryQueryParams {
  itemId: string;
  limit?: number;
  offset?: number;
  types?: string[];
  warehouseId?: string;
  from?: string;
  to?: string;
}

export async function fetchItemHistory(params: HistoryQueryParams) {
  const token = await getAccessToken();
  const url = new URL(`/api/stock/history`, window.location.origin);

  url.searchParams.set('itemId', params.itemId);
  if (params.limit) url.searchParams.set('limit', String(params.limit));
  if (params.offset) url.searchParams.set('offset', String(params.offset));
  if (params.types && params.types.length > 0) url.searchParams.set('types', params.types.join(','));
  if (params.warehouseId) url.searchParams.set('warehouseId', params.warehouseId);
  if (params.from) url.searchParams.set('from', params.from);
  if (params.to) url.searchParams.set('to', params.to);

  const response = await fetch(url.toString(), {
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  return handleResponse(response);
}

export async function fetchSaleByReference(reference: string) {
  const token = await getAccessToken();
  const url = new URL(`/api/stock/sale`, window.location.origin);
  url.searchParams.set('reference', reference);

  const response = await fetch(url.toString(), {
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  return handleResponse(response);
}
