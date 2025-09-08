/**
 * Compatibility layer for legacy imports of ../../lib/ctRest and @/lib/ct-rest
 * Re-exports the modern implementation and provides legacy-named helpers.
 */
import * as impl from '../src/lib/ct-rest.js';
export * from '../src/lib/ct-rest.js';

// Legacy helpers expected by older code. We try to wire them to modern funcs.

export const get =
  impl.get ||
  (impl.request ? ((url, opts) => impl.request('GET', url, opts)) : undefined);

export const post =
  impl.post ||
  (impl.request ? ((url, body, opts) => impl.request('POST', url, { body, ...(opts||{}) })) : undefined);

export const getProductByKey =
  impl.getProductByKey ||
  (impl.getProduct ? ((key, opts) => impl.getProduct({ key }, opts)) :
   (impl.get ? ((key, opts) => impl.get(`/products/key=${encodeURIComponent(key)}`, opts)) :
    undefined));

// Preserve default if the modern module has one
export default impl.default ?? undefined;
