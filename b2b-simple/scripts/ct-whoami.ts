// scripts/ct-whoami.ts
import { projectKey, scope } from '../lib/ctConfig';
import { getAppToken } from '../lib/ctToken';

(async () => {
  try {
    const tok = await getAppToken();
    console.log('✅ Token acquired');
    console.log(`Project: ${projectKey}`);
    console.log(`Scope: ${scope}`);
    console.log(`Expires in: ${tok.expires_in}s`);
    process.exit(0);
  } catch (e: any) {
    console.error('❌ Token failed:', e?.message || e);
    process.exit(1);
  }
})();
