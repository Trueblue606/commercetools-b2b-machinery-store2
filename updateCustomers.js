// updateCustomers.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always load .env.local from b2b-simple
dotenv.config({ path: path.join(__dirname, "b2b-simple", ".env.local") });

// Validate environment variables
const requiredVars = ["CT_PROJECT_KEY", "CT_REGION", "CT_CLIENT_ID", "CT_CLIENT_SECRET"];
for (const v of requiredVars) {
  if (!process.env[v]) {
    console.error(`❌ Missing required env var: ${v}`);
    process.exit(1);
  }
}

const API_URL = `https://api.${process.env.CT_REGION}.aws.commercetools.com/${process.env.CT_PROJECT_KEY}`;
const CUSTOMER_TYPE_ID = "a9a2ce5b-4669-48a5-9886-a3623f5508fc";

// Default values for required fields
const DEFAULT_FIELD_VALUES = {
  approvalStatus: "pending",
  requestedGroup: "none",
  siteAccess: "not granted",
  chemlab: "disabled"
};

// Get OAuth token with Basic Auth
async function getCTToken() {
  const authUrl = `https://auth.${process.env.CT_REGION}.aws.commercetools.com/oauth/token`;
  const basicAuth = Buffer.from(
    `${process.env.CT_CLIENT_ID}:${process.env.CT_CLIENT_SECRET}`
  ).toString("base64");

  const resp = await fetch(authUrl, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  if (!resp.ok) {
    throw new Error(`❌ Failed to get token: ${resp.status} ${await resp.text()}`);
  }

  const data = await resp.json();
  return data.access_token;
}

// Fetch the customer type definition
async function getCustomerType(token) {
  const resp = await fetch(`${API_URL}/types/${CUSTOMER_TYPE_ID}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!resp.ok) {
    throw new Error(`❌ Failed to fetch customer type: ${resp.status} ${await resp.text()}`);
  }

  return resp.json();
}

// Fetch ALL customers via pagination
async function getAllCustomers(token) {
  let customers = [];
  let limit = 100;
  let offset = 0;
  let total = 0;

  do {
    const resp = await fetch(`${API_URL}/customers?limit=${limit}&offset=${offset}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!resp.ok) {
      throw new Error(`❌ Failed to fetch customers: ${resp.status} ${await resp.text()}`);
    }

    const data = await resp.json();
    customers = customers.concat(data.results);
    total = data.total;
    offset += limit;
  } while (customers.length < total);

  return customers;
}

async function updateAllCustomers() {
  const token = await getCTToken();
  const typeDef = await getCustomerType(token);
  const requiredFields = typeDef.fieldDefinitions
    .filter(field => field.required)
    .map(field => field.name);

  console.log(`ℹ️ Required fields: ${requiredFields.join(", ")}`);

  const customers = await getAllCustomers(token);
  console.log(`ℹ️ Total customers fetched: ${customers.length}`);

  for (const customer of customers) {
    const actions = [];

    // If no custom type, set it with required default values
    if (!customer.custom) {
      const fieldValues = {};
      requiredFields.forEach(name => {
        fieldValues[name] = DEFAULT_FIELD_VALUES[name] || null;
      });
      actions.push({
        action: "setCustomType",
        type: { typeId: "type", id: CUSTOMER_TYPE_ID },
        fields: fieldValues
      });
    } else {
      // Ensure required fields have a value
      requiredFields.forEach(name => {
        const currentValue = customer.custom.fields?.[name];
        if (!currentValue) {
          actions.push({
            action: "setCustomField",
            name,
            value: DEFAULT_FIELD_VALUES[name] || null
          });
        }
      });
    }

    // Always ensure our extra defaults are set if missing
    for (const [name, value] of Object.entries(DEFAULT_FIELD_VALUES)) {
      if (!customer.custom?.fields?.[name]) {
        actions.push({ action: "setCustomField", name, value });
      }
    }

    if (actions.length > 0) {
      const updateResp = await fetch(`${API_URL}/customers/${customer.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: customer.version,
          actions,
        }),
      });

      if (updateResp.ok) {
        console.log(`✅ Updated ${customer.email}`);
      } else {
        console.error(`❌ Failed for ${customer.email}`, await updateResp.text());
      }
    } else {
      console.log(`⏩ Skipped ${customer.email} (already up to date)`);
    }
  }
}

updateAllCustomers().catch(err => {
  console.error("❌ Script failed:", err);
});
