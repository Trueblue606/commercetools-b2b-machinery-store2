/**
 * Compatibility layer for legacy imports.
 * We import * as impl to avoid requiring specific named exports from src/lib/ct-rest.js.
 * Then we provide the expected surface (request/get/post/getProduct/getProductByKey),
 * delegating to whatever the new module exposes, or falling back to simple wrappers.
 */
import * as impl from "../src/lib/ct-rest.js";

const _request =
  impl.request ||
  impl.default?.request ||
  ((method, url, opts = {}) => {
    // Defer to fetch-based request if available
    if (impl.fetchRequest) return impl.fetchRequest(method, url, opts);
    throw new Error("ct-rest: request() not available in impl");
  });

export const request = (...args) => _request(...args);

export const get =
  impl.get ||
  impl.default?.get ||
  ((url, opts = {}) => _request("GET", url, opts));

export const post =
  impl.post ||
  impl.default?.post ||
  ((url, body, opts = {}) =>
    _request("POST", url, { ...opts, body: typeof body === "string" ? body : JSON.stringify(body) }));

export const getProduct =
  impl.getProduct ||
  impl.default?.getProduct ||
  ((id) => get(`/products/${id}`));

export const getProductByKey =
  impl.getProductByKey ||
  impl.default?.getProductByKey ||
  ((key) => get(`/product-projections/key=${encodeURIComponent(key)}`));

export default { request, get, post, getProduct, getProductByKey };
