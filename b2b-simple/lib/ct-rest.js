// lib/ct.js
import { getCTToken } from "./ctAuth.js";

const CT_HOST = process.env.CT_HOST;
const CT_PROJECT_KEY = process.env.CT_PROJECT_KEY;

function assertEnv() {
  if (!CT_HOST) throw new Error("Missing env CT_HOST");
  if (!CT_PROJECT_KEY) throw new Error("Missing env CT_PROJECT_KEY");
}

export function API(path) {
  assertEnv();
  if (!path.startsWith("/")) path = `/${path}`;
  return `https://api.${CT_HOST}/${CT_PROJECT_KEY}${path}`;
}

async function ctFetch(method, path, body, token) {
  assertEnv();
  const authToken = token || (await getCTToken());
  const res = await fetch(API(path), {
    method,
    headers: {
      Authorization: `Bearer ${authToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
    const err = new Error(`CT ${res.status} ${res.statusText}`);
    err.status = res.status;
    err.body = parsed;
    throw err;
  }
  return res.json();
}

export async function ctGet(path, token) {
  return ctFetch("GET", path, undefined, token);
}

export async function ctPost(path, body, token) {
  return ctFetch("POST", path, body, token);
}