/* eslint-disable no-console */
import { getCTToken } from "../../../lib/ctAuth";

const REGION      = process.env.CT_REGION || "eu-central-1";
const PROJECT_KEY = process.env.CT_PROJECT_KEY;
const API_URL     = `https://api.${REGION}.aws.commercetools.com`;

// Map of group keys to IDs (must match your CT project)
const groupMap = {
  standard:   "d7a14b96-ca48-4a3f-b35d-6bce624e3b16",
  contractA:  "20304c81-f448-4c7e-9231-ba55488251e5",
  distributor:"a1aff334-3def-4937-9116-5f2f96f93214",
  special:    "68baca5b-b96b-4751-9f85-215fb1a7417c",
  testoverlap:"fc05910d-ec00-4d7a-abaa-967d352af9fc",
};

async function readCTError(resp) {
  const correlationId =
    resp.headers.get("X-Correlation-ID") ||
    resp.headers.get("x-correlation-id") ||
    null;

  let text = "";
  try { text = await resp.text(); } catch {}
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch {}

  return { status: resp.status, correlationId, json, text };
}

// Translate CT errors to user-friendly + field-specific messages
function toClientError(ctErr) {
  const j = ctErr.json || {};
  const errors = Array.isArray(j.errors) ? j.errors : [];

  // Duplicate email
  const dupEmail = errors.find(
    (e) =>
      e.code === "DuplicateField" &&
      (e.field === "email" || e.duplicateField === "email")
  );
  if (dupEmail || (ctErr.status === 409 && /email/i.test(j?.message || ""))) {
    return { status: 409, error: "Email already in use. Try logging in.", field: "email" };
  }

  // Invalid email format
  const invalidEmail = errors.find(
    (e) => (e.code === "InvalidField" || e.code === "PatternMismatch") && e.field === "email"
  );
  if (invalidEmail) {
    return { status: 422, error: "Invalid email address.", field: "email" };
  }

  // Missing required fields
  const missingEmail = errors.find((e) => e.code === "MissingField" && e.field === "email");
  if (missingEmail) return { status: 422, error: "Email is required.", field: "email" };

  const missingPassword = errors.find((e) => e.code === "MissingField" && e.field === "password");
  if (missingPassword) return { status: 422, error: "Password is required.", field: "password" };

  const missingFirstName = errors.find((e) => e.code === "MissingField" && e.field === "firstName");
  if (missingFirstName) return { status: 422, error: "First name is required.", field: "firstName" };

  const missingLastName = errors.find((e) => e.code === "MissingField" && e.field === "lastName");
  if (missingLastName) return { status: 422, error: "Last name is required.", field: "lastName" };

  // Fallback: show CT's top-level message if present
  const msg = j?.message || ctErr.text || "Signup failed";
  return { status: ctErr.status || 400, error: msg };
}

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const {
    email, password, firstName, lastName, companyName, groupKey = "standard",
  } = req.body || {};

  // Minimal validation — let CT handle deeper validation
  if (!email || !password || !firstName || !lastName) {
    return res.status(422).json({ error: "Please fill all required fields." });
  }

  try {
    // Project access token
    const tokenObj = await getCTToken();
    const accessToken = tokenObj?.access_token || tokenObj; // supports either object or string
    if (!accessToken) {
      return res.status(500).json({ error: "Auth token unavailable" });
    }
    const AUTH = `Bearer ${accessToken}`;

    // 1) Create customer
    const draft = {
      email: String(email).trim(),
      password,
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      ...(companyName ? { companyName: String(companyName).trim() } : {}),
    };

    const createRes = await fetch(`${API_URL}/${PROJECT_KEY}/customers`, {
      method: "POST",
      headers: { Authorization: AUTH, "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });

    if (!createRes.ok) {
      const ctErr = await readCTError(createRes);
      const client = toClientError(ctErr);
      // Log detailed info for debugging but return clean message to client
      console.error("CT create error", { correlationId: ctErr.correlationId, server: client, raw: ctErr.text });
      return res.status(client.status).json(client);
    }

    const created = await createRes.json();
    const customer = created?.customer || created;

    // 2) Assign chosen customer group
    const groupId = groupMap[groupKey] || groupMap.standard;
    const updRes = await fetch(`${API_URL}/${PROJECT_KEY}/customers/${customer.id}`, {
      method: "POST",
      headers: { Authorization: AUTH, "Content-Type": "application/json" },
      body: JSON.stringify({
        version: customer.version,
        actions: [
          { action: "setCustomerGroup", customerGroup: { typeId: "customer-group", id: groupId } },
        ],
      }),
    });

    const updated = updRes.ok ? await updRes.json() : customer;

    // 3) Respond with ready customer
    return res.status(200).json({
      success: true,
      customer: updated.customer || updated,
    });
  } catch (err) {
    console.error("Signup error", err);
    return res.status(500).json({ error: "Internal error", details: String(err?.message || err) });
  }
}
