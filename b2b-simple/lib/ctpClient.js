// lib/ctpClient.js — SDK (AWS URLs)
import fetch from "node-fetch";
import { createClient } from "@commercetools/sdk-client";
import { createAuthMiddlewareForClientCredentialsFlow } from "@commercetools/sdk-middleware-auth";
import { createHttpMiddleware } from "@commercetools/sdk-middleware-http";
import { createApiBuilderFromCtpClient } from "@commercetools/platform-sdk";

const projectKey   = process.env.CTP_PROJECT_KEY;
const clientId     = process.env.CTP_CLIENT_ID;
const clientSecret = process.env.CTP_CLIENT_SECRET;
const authUrl      = process.env.CTP_AUTH_URL; // e.g. https://auth.eu-central-1.aws.commercetools.com
const apiUrl       = process.env.CTP_API_URL;  // e.g. https://api.eu-central-1.aws.commercetools.com
const scopes       = (process.env.CTP_SCOPES || `manage_project:${projectKey}`).split(/[,\s]+/).filter(Boolean);

if (!projectKey || !clientId || !clientSecret || !authUrl || !apiUrl) {
  throw new Error("CT SDK env missing: CTP_PROJECT_KEY, CTP_CLIENT_ID, CTP_CLIENT_SECRET, CTP_AUTH_URL, CTP_API_URL");
}

const ctpClient = createClient({
  middlewares: [
    createAuthMiddlewareForClientCredentialsFlow({
      host: authUrl,
      projectKey,
      credentials: { clientId, clientSecret },
      scopes,
      fetch,
    }),
    createHttpMiddleware({ host: apiUrl, fetch }),
  ],
});

export function createApiClient() {
  return createApiBuilderFromCtpClient(ctpClient).withProjectKey({ projectKey });
}