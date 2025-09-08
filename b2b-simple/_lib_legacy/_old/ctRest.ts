// lib/ctRest.ts - Thin typed REST helpers
import { apiUrl, projectKey, priceCountry as dfCountry, priceCurrency as dfCurrency } from './ctConfig';
import { getAppToken } from './ctToken';

export type PriceSelection = {
  priceCountry?: string;
  priceCurrency?: string;
  priceCustomerGroup?: { id: string } | null;
};

export function buildPriceSelection(sel?: { customerGroupId?: string | null; priceCountry?: string; priceCurrency?: string }): URLSearchParams {
  const params = new URLSearchParams();
  params.set('priceCountry', sel?.priceCountry || dfCountry);
  params.set('priceCurrency', sel?.priceCurrency || dfCurrency);
  if (sel?.customerGroupId) params.set('priceCustomerGroup.id', sel.customerGroupId);
  return params;
}

// Build a full commercetools API URL for the current project
export function API(path: string): string {
  return `${apiUrl}/${projectKey}${path}`;
}

async function ctFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { access_token } = await getAppToken();
  const res = await fetch(`${apiUrl}/${projectKey}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => ({}))) as T;
  if (!res.ok) throw new Error(`CT ${init?.method || 'GET'} ${path} failed: ${res.status}`);
  return json;
}

export async function getProductByKey(key: string, sel?: { customerGroupId?: string | null; priceCountry?: string; priceCurrency?: string }) {
  const qs = buildPriceSelection(sel).toString();
  return ctFetch(`/product-projections/key=${encodeURIComponent(key)}?${qs}`);
}

export async function getProductsByKeys(keys: string[], sel?: { customerGroupId?: string | null; priceCountry?: string; priceCurrency?: string }) {
  const filter = keys.map(k => `key:"${k}"`).join(',');
  const sp = buildPriceSelection(sel);
  sp.set('filter', `(${filter})`);
  sp.set('limit', String(keys.length || 50));
  return ctFetch(`/product-projections/search?${sp.toString()}`);
}

export async function getCategoriesRoot() {
  return ctFetch(`/categories?where=parent is not defined&limit=100`);
}

export async function getCustomerGroupByKey(key: string) {
  return ctFetch(`/customer-groups/key=${encodeURIComponent(key)}`);
}

export async function searchProducts(qs: URLSearchParams) {
  return ctFetch(`/product-projections/search?${qs.toString()}`);
}
