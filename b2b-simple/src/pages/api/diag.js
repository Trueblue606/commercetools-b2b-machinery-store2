/**
 * /api/diag — runtime introspection (safe)
 * - Shows which env vars are present (masks secrets)
 * - Attempts CT token to confirm server can auth
 */
import { getCTToken } from '../../lib/ctAuth';

export default async function handler(req, res) {
  const keys = [
    'CT_AUTH_URL','CT_API_URL','CT_CLIENT_ID','CT_CLIENT_SECRET',
    'CT_PROJECT_KEY','CT_SCOPE','CT_SCOPES',
    'NEXT_PUBLIC_API_URL','NEXT_PUBLIC_CT_PRICE_COUNTRY','NEXT_PUBLIC_CT_PRICE_CURRENCY'
  ];
  const env = {};
  for (const k of keys) {
    const v = process.env[k];
    env[k] = v == null ? null
           : /SECRET|CLIENT_ID/i.test(k) ? '[set]' 
           : v;
  }

  let tokenOk = false, tokenError = null;
  try {
    const t = await getCTToken(); // throws if env missing or bad creds
    tokenOk = !!(t && (t.access_token || String(t)));
  } catch (err) {
    tokenError = err && (err.message || String(err));
  }

  res.status(200).json({ env, tokenOk, tokenError });
}
