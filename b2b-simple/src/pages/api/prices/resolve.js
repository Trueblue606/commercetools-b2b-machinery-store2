// Chemopilot Price Resolver (UK-only, embedded pricing)
import { getProductByKey } from "../../../../lib/ctRest";

// 🔒 Eligibility check
function checkEligibility(customer, product) {
  if (!customer || customer.regulatoryStatus !== "verified")
    return { restricted: true, reason: "status" };

  if (["PROSPECT", "PROHIBITED"].includes(customer.customerType))
    return { restricted: true, reason: "type" };

  const licenseRequired = product?.masterVariant?.attributes?.find(
    (a) => a.name === "licenseRequired"
  )?.value;

  if (
    licenseRequired &&
    !customer.certifications?.includes(licenseRequired)
  ) {
    return { restricted: true, reason: "licenseMissing" };
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const { sku, key } = req.query;
  if (!sku && !key)
    return res.status(400).json({ error: "sku or key is required" });

  // Demo: load customer context from headers
  const customer = {
    id: req.headers["x-customer-id"] || "demo",
    customerGroupId: req.headers["x-customer-group-id"],
    customerType: req.headers["x-customer-type"] || "PCO",
    certifications: (req.headers["x-customer-certs"] || "").split(","),
    regulatoryStatus: req.headers["x-customer-status"] || "verified",
  };

  try {
    const product = await getProductByKey(key || sku, {
      customerGroupId: customer.customerGroupId,
      priceCountry: "GB",
      priceCurrency: "GBP",
    });

    if (!product) return res.status(404).json({ error: "Product not found" });

    const fail = checkEligibility(customer, product);
    if (fail) return res.status(200).json(fail);

    const variant = product.masterVariant;
    const price = variant?.price;
    if (!price)
      return res
        .status(404)
        .json({ error: "No GBP/GB price for this group" });

    return res.status(200).json({
      price: price.value,
      priceId: price.id,
      key: `${sku || key}|${customer.customerGroupId}|GB|GBP`,
      group: customer.customerGroupId,
      source: "embedded",
    });
  } catch (err) {
    console.error("❌ Price resolve error", err);
    return res.status(500).json({ error: err.message });
  }
}
