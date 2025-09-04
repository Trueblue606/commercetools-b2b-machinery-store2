// lib/ct-rest.js - REST helpers for commercetools

// Canonical REST helper for commercetools. Single source of truth.

export const API = (p = "") =>
	`https://api.${process.env.CT_HOST}/${process.env.CT_PROJECT_KEY}${p}`;

// Build price-selection query params
export function buildPriceSelection({ customerGroupId, priceCountry, priceCurrency } = {}) {
	const country = priceCountry || process.env.NEXT_PUBLIC_CT_PRICE_COUNTRY || "GB";
	const currency = priceCurrency || process.env.NEXT_PUBLIC_CT_PRICE_CURRENCY || "GBP";
	const sp = new URLSearchParams();
	if (country) sp.set("priceCountry", country);
	if (currency) sp.set("priceCurrency", currency);
	if (customerGroupId) sp.set("priceCustomerGroup.id", customerGroupId);
	return sp;
}

async function parseJsonSafe(res) {
	const text = await res.text().catch(() => "");
	try {
		return text ? JSON.parse(text) : null;
	} catch {
		return null;
	}
}

async function ctFetch(method, path, body, token) {
	const res = await fetch(API(path), {
		method,
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: body !== undefined ? JSON.stringify(body) : undefined,
		cache: "no-store",
	});

	const json = await parseJsonSafe(res);
	if (!res.ok) {
		throw Object.assign(new Error(`CT ${method} ${path} failed`), {
			status: res.status,
			body: json,
		});
	}
	return json ?? {};
}

export function ctGet(path, token) {
	return ctFetch("GET", path, undefined, token);
}

export function ctPost(path, body, token) {
	return ctFetch("POST", path, body, token);
}

// Optional helpers if you ever need them:
// export function ctDelete(path, token) { return ctFetch("DELETE", path, undefined, token); }
// export function ctPatch(path, body, token) { return ctFetch("PATCH", path, body, token); }