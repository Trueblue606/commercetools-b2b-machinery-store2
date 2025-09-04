// Embedded Price Delta Importer (publishes immediately)
import { getCTToken } from "../../../../lib/ctAuth.js";
import { ctGet, ctPost } from "../../../../lib/ct-rest.js";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { sku, customerGroupId, centAmount } = body || {};
  if (!sku || !customerGroupId || centAmount == null)
    return res
      .status(400)
      .json({ error: "Missing sku, customerGroupId, or centAmount" });

  const { access_token } = await getCTToken();

  try {
    // 1) Find product by SKU
    const search = await ctGet(
      `/product-projections/search?filter=variants.sku:"${encodeURIComponent(
        sku
      )}"&staged=true`,
      access_token
    );
    if (!search.results?.length)
      return res.status(404).json({ error: "SKU not found" });

    const prod = await ctGet(
      `/products/${search.results[0].id}`,
      access_token
    );

    const variant = [prod.masterData.staged.masterVariant, ...prod.masterData.staged.variants].find(
      (v) => v.sku === sku
    );
    if (!variant)
      return res.status(400).json({ error: "Variant not found" });

    // 2) Set new price for that variant/group
    const actions = [
      {
        action: "setPrices",
        variantId: variant.id,
        prices: [
          {
            value: { currencyCode: "GBP", centAmount: Number(centAmount) },
            country: "GB",
            customerGroup: { typeId: "customer-group", id: customerGroupId },
          },
        ],
        staged: true,
      },
    ];

    const updated = await ctPost(
      `/products/${prod.id}`,
      { version: prod.version, actions },
      access_token
    );

    // 3) Publish prices so carts pick them up
    const published = await ctPost(
      `/products/${prod.id}`,
      {
        version: updated.version,
        actions: [{ action: "publish", scope: "Prices" }],
      },
      access_token
    );

    return res.status(200).json({ ok: true, product: published });
  } catch (err) {
    console.error("❌ Upsert embedded price error", err);
    return res.status(500).json({ error: err.message });
  }
}
