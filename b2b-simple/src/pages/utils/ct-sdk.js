// src/pages/utils/ct.js
import { ClientBuilder } from "@commercetools/sdk-client-v2";
import { createApiBuilderFromCtpClient } from "@commercetools/platform-sdk";

// Project config from env
const projectKey = process.env.CT_PROJECT_KEY;

// Prefer CT_HOST (e.g. europe-west1.gcp.commercetools.com). Fallback to legacy CT_REGION if present.
const hostBase =
  process.env.CT_HOST
    ? process.env.CT_HOST
    : process.env.CT_REGION
      ? `${process.env.CT_REGION}.aws.commercetools.com`
      : null;

if (!hostBase) {
  throw new Error("CT_HOST (preferred) or CT_REGION must be set in env");
}
if (!process.env.CT_CLIENT_ID || !process.env.CT_CLIENT_SECRET || !projectKey) {
  throw new Error("CT_CLIENT_ID, CT_CLIENT_SECRET, and CT_PROJECT_KEY must be set in env");
}

const scopes =
  (process.env.CT_SCOPES && process.env.CT_SCOPES.split(/\s+/).filter(Boolean)) ||
  [`manage_project:${projectKey}`];

const authMiddlewareOptions = {
  host: `https://auth.${hostBase}`,
  projectKey,
  credentials: {
    clientId: process.env.CT_CLIENT_ID,
    clientSecret: process.env.CT_CLIENT_SECRET,
  },
  scopes,
  fetch, // use global fetch (Node 18+/Next)
};

const httpMiddlewareOptions = {
  host: `https://api.${hostBase}`,
  fetch, // use global fetch
};

// Build client
const ctpClient = new ClientBuilder()
  .withProjectKey(projectKey)
  .withClientCredentialsFlow(authMiddlewareOptions)
  .withHttpMiddleware(httpMiddlewareOptions)
  .withLoggerMiddleware()
  .build();

export const getApiRoot = () =>
  createApiBuilderFromCtpClient(ctpClient).withProjectKey({ projectKey });
