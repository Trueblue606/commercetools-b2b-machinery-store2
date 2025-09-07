// src/pages/api/_diag/ct.js
import * as ctAuthModule from "@/lib/ctAuth";
import * as ctRestModule from "@/lib/ct-rest";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const report = {
    imports: {
      ctAuth_has_getCTToken: typeof ctAuthModule.getCTToken === "function",
      ctRest_has_ctGet: typeof ctRestModule.ctGet === "function",
      ctRest_has_ctPost: typeof ctRestModule.ctPost === "function",
    },
    env: {
      CT_AUTH_URL: !!process.env.CT_AUTH_URL,
      CT_API_URL: !!process.env.CT_API_URL,
      CT_PROJECT_KEY: !!process.env.CT_PROJECT_KEY,
      CT_CLIENT_ID: !!process.env.CT_CLIENT_ID,
      CT_CLIENT_SECRET: !!process.env.CT_CLIENT_SECRET,
      CT_SCOPE: !!process.env.CT_SCOPE,
    },
    token: { ok: false, error: null },
    ping: { ok: false, status: null, error: null },
  };

  try {
    const token = await ctAuthModule.getCTToken();
    report.token.ok = !!token;
    if (!token) report.token.error = "No token returned";
    else {
      try {
        // Use ctGet if available; otherwise skip
        if (typeof ctRestModule.ctGet === "function") {
          const ping = await ctRestModule.ctGet(`/${process.env.CT_PROJECT_KEY}/project`);
          report.ping.ok = true;
          report.ping.status = ping?.status || 200;
        } else {
          report.ping.error = "ctGet not found (likely export drift)";
        }
      } catch (e) {
        report.ping.error = e?.message || String(e);
      }
    }
  } catch (e) {
    report.token.error = e?.message || String(e);
  }

  return res.status(200).json(report);
}