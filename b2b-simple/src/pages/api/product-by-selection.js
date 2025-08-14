export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { selectionId, customerEmail } = req.query;
  if (!selectionId) {
    return res.status(400).json({ error: "Selection ID required" });
  }

  try {
    // 1) Get OAuth token
    const authRes = await fetch(
      "https://auth.eu-central-1.aws.commercetools.com/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            process.env.CT_CLIENT_ID + ":" + process.env.CT_CLIENT_SECRET
          ).toString("base64")}`,
        },
        body: "grant_type=client_credentials",
      }
    );

    if (!authRes.ok) {
      console.error("Auth failed:", authRes.status);
      return res.status(500).json({ error: "Authentication failed" });
    }

    const auth = await authRes.json();

    // 2) Fetch customer group ID (if customerEmail is provided)
    let customerGroupId = null;
    if (customerEmail) {
      const custRes = await fetch(
        `https://api.eu-central-1.aws.commercetools.com/${process.env.CT_PROJECT_KEY}/customers?where=email="${customerEmail}"`,
        {
          headers: { Authorization: `Bearer ${auth.access_token}` },
        }
      );
      if (custRes.ok) {
        const customerData = await custRes.json();
        if (
          customerData.results?.[0]?.customerGroup?.id
        ) {
          customerGroupId = customerData.results[0].customerGroup.id;
        }
      }
    }

    // 3) Get products in the selection
    const productsRes = await fetch(
      `https://api.eu-central-1.aws.commercetools.com/${process.env.CT_PROJECT_KEY}/product-selections/${selectionId}/products?limit=100`,
      {
        headers: { Authorization: `Bearer ${auth.access_token}` },
      }
    );

    if (!productsRes.ok) {
      console.error("Failed to fetch products in selection:", productsRes.status);
      return res.status(200).json({ products: [] });
    }

    const productsData = await productsRes.json();
    const productIds = productsData.results.map((p) => p.product.id);
    if (productIds.length === 0) {
      return res.status(200).json({ products: [] });
    }

    // 4) Fetch product projections with customer group pricing
    const whereClause = productIds.map((id) => `"${id}"`).join(",");
    const searchUrl = new URL(
      `https://api.eu-central-1.aws.commercetools.com/${process.env.CT_PROJECT_KEY}/product-projections/search`
    );
    searchUrl.searchParams.set("filter", `id:(${whereClause})`);
    if (customerGroupId) {
      searchUrl.searchParams.set("priceCustomerGroup.id", customerGroupId);
    }
    searchUrl.searchParams.set("limit", "100");

    const productProjectionsRes = await fetch(searchUrl.toString(), {
      headers: { Authorization: `Bearer ${auth.access_token}` },
    });

    if (!productProjectionsRes.ok) {
      console.error(
        "Failed to fetch product projections:",
        productProjectionsRes.status
      );
      return res.status(200).json({ products: [] });
    }

    const projectionsData = await productProjectionsRes.json();
    const products = projectionsData.results.map((p) => ({
      id: p.id,
      name: p.name?.["en-GB"] || p.name?.["en"] || "No name",
      sku: p.masterVariant?.sku || "",
      image: p.masterVariant?.images?.[0]?.url || null,
      prices: p.masterVariant?.prices || [],
    }));

    res.status(200).json({ products });
  } catch (error) {
    console.error("Error in products-by-selection API:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
}
