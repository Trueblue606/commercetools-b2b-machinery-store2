#!/usr/bin/env node
/*
  Extract product keys and inventory status from products.json
  Output: keys-inventory.csv with columns: key,onStock,totalAvailable
*/

const fs = require('fs');
const path = require('path');

function readJson(filePath) {
  const p = path.resolve(filePath);
  const raw = fs.readFileSync(p, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse JSON from', p, e.message);
    process.exit(1);
  }
}

function itemsFromData(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  if (data && Array.isArray(data.products)) return data.products;
  // Some exports wrap in { data: { results: [] } }
  if (data && data.data && Array.isArray(data.data.results)) return data.data.results;
  return [];
}

function summarizeVariantAvailability(variant) {
  const avail = (variant && variant.availability) || {};
  let onStock = Boolean(avail.isOnStock);
  let total = 0;
  if (typeof avail.availableQuantity === 'number') {
    total += avail.availableQuantity;
  }
  if (avail.channels && typeof avail.channels === 'object') {
    for (const ch of Object.values(avail.channels)) {
      if (!ch || typeof ch !== 'object') continue;
      if (ch.isOnStock) onStock = true;
      if (typeof ch.availableQuantity === 'number') total += ch.availableQuantity;
    }
  }
  return { onStock, totalAvailable: total };
}

function summarizeProduct(product) {
  const variants = [];
  if (product && product.masterVariant) variants.push(product.masterVariant);
  if (product && Array.isArray(product.variants)) variants.push(...product.variants);
  let onStock = false;
  let totalAvailable = 0;
  for (const v of variants) {
    const { onStock: vOn, totalAvailable: vTotal } = summarizeVariantAvailability(v);
    onStock = onStock || vOn;
    totalAvailable += vTotal;
  }
  return { key: product.key || '', onStock, totalAvailable };
}

function main() {
  const input = process.argv[2] || 'products.json';
  const out = process.argv[3] || 'keys-inventory.csv';
  const data = readJson(input);
  const items = itemsFromData(data);
  if (!items.length) {
    console.error('No products found in', input);
    process.exit(2);
  }

  const rows = [];
  rows.push(['key', 'onStock', 'totalAvailable'].join(','));
  for (const p of items) {
    const { key, onStock, totalAvailable } = summarizeProduct(p);
    if (!key) continue;
    rows.push([key, String(onStock), String(totalAvailable)].join(','));
  }

  fs.writeFileSync(out, rows.join('\n'), 'utf8');
  console.log(`Wrote ${rows.length - 1} rows to ${out}`);
}

main();
