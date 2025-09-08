// lib/customerGroups.ts - keys and resolver
import { getCustomerGroupByKey } from './ctRest';

export const STANDARD = process.env.CT_GROUP_KEY_STANDARD || 'STANDARD';
export const CONTRACT_A = process.env.CT_GROUP_KEY_CONTRACT_A || 'CONTRACT_A';
export const DISTRIBUTOR = process.env.CT_GROUP_KEY_DISTRIBUTOR || 'DISTRIBUTOR';
export const SPECIAL_PROJECT = process.env.CT_GROUP_KEY_SPECIAL_PROJECT || 'SPECIAL_PROJECT';
export const TEST_OVERLAP = process.env.CT_GROUP_KEY_TEST_OVERLAP || 'TEST_OVERLAP';

const cache = new Map<string, string>();

export async function resolveCustomerGroupIdByKey(key: string): Promise<string | null> {
  if (cache.has(key)) return cache.get(key)!;
  try {
    const json: any = await getCustomerGroupByKey(key);
    const id = json?.id || null;
    if (id) cache.set(key, id);
    return id;
  } catch {
    return null;
  }
}
