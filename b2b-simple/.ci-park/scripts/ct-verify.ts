// scripts/ct-verify.ts
import { projectKey } from '../lib/ctConfig';
import { getAppToken } from '../lib/ctToken';
import { buildPriceSelection } from '../lib/ctRest';

const expectedCategories = [
  'Chemicals',
  'Equipment',
  'Protective Gear',
  'Monitoring & Traps',
  'Bundles & Kits',
];

const expectedKeys = [
  'CP-EQP-002', 'CP-MON-001', 'CP-EQP-001', 'CP-CHEM-001', 'CP-MON-002',
  'CP-CHM-002', 'CP-PPE-001', 'CP-PPE-002', 'CP-BND-PRO', 'CP-BND-START'
];

const groupKeys = [
  process.env.CT_GROUP_KEY_STANDARD || 'STANDARD',
  process.env.CT_GROUP_KEY_CONTRACT_A || 'CONTRACT_A',
  process.env.CT_GROUP_KEY_DISTRIBUTOR || 'DISTRIBUTOR',
  process.env.CT_GROUP_KEY_SPECIAL_PROJECT || 'SPECIAL_PROJECT',
  process.env.CT_GROUP_KEY_TEST_OVERLAP || 'TEST_OVERLAP',
];

(async () => {
  let ok = true;
  try {
    const { access_token } = await getAppToken();

    const apiBase = (process.env.CT_API_URL || (process.env.CT_HOST ? `https://api.${process.env.CT_HOST}` : '')) as string;
    const h = { Authorization: `Bearer ${access_token}` };

    // Categories
    const catsRes = await fetch(`${apiBase}/${projectKey}/categories?limit=200` , { headers: h });
    const cats = await catsRes.json();
    const rootNames = (cats.results || []).filter((c: any) => !c.parent).map((c: any) => c.name?.['en-GB'] || c.name?.en).filter(Boolean);
    for (const name of expectedCategories) {
      const found = rootNames.includes(name);
      console.log(`${found ? '✅' : '❌'} Category: ${name}`);
      if (!found) ok = false;
    }

    // Products by key via search filter
    const filter = expectedKeys.map(k => `key:\"${k}\"`).join(',');
    const sp = buildPriceSelection();
    sp.set('filter', `(${filter})`);
    sp.set('limit', String(expectedKeys.length));
    const prodRes = await fetch(`${apiBase}/${projectKey}/product-projections/search?${sp.toString()}`, { headers: h });
    const prods = await prodRes.json();
    const foundKeys = new Set((prods.results || []).map((p: any) => p.key));
    for (const k of expectedKeys) {
      const found = foundKeys.has(k);
      console.log(`${found ? '✅' : '❌'} Product key: ${k}`);
      if (!found) ok = false;
    }

    // Customer groups by key
    for (const gk of groupKeys) {
      const gRes = await fetch(`${apiBase}/${projectKey}/customer-groups/key=${encodeURIComponent(gk)}`, { headers: h });
      const gj = await gRes.json();
      const id = gj?.id;
      const found = Boolean(id);
      console.log(`${found ? '✅' : '❌'} Customer group ${gk}: ${id || 'not found'}`);
      if (!found) ok = false;
    }
  } catch (e: any) {
    console.error('Verification error:', e?.message || e);
    ok = false;
  }

  process.exit(ok ? 0 : 1);
})();
