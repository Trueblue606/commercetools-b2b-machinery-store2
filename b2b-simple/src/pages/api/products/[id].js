// pages/api/products/[id].js - Fixed to include prices
export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing product id in query' });
  }

  try {
    // Use central token helper and env-driven API base
  const { getCTToken } = await import('../../../../lib/ctAuth.js');
  const { API, buildPriceSelection } = await import('../../../../lib/ct-rest.js');

    const { access_token } = await getCTToken();
    const qs = buildPriceSelection({}).toString();
    const productRes = await fetch(
      API(`/product-projections/${encodeURIComponent(id)}?${qs}`),
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (!productRes.ok) {
      const error = await productRes.text();
      return res.status(productRes.status).json({ error });
    }

  const productData = await productRes.json();

    // The prices should already be in the response, but let's make sure
    console.log('Product API response:', {
      id: productData.id,
      name: productData.name?.['en-GB'],
      hasPrices: !!productData.masterVariant?.prices,
      priceCount: productData.masterVariant?.prices?.length || 0,
      prices: productData.masterVariant?.prices?.map(p => ({
        amount: p.value.centAmount,
        currency: p.value.currencyCode,
        country: p.country
      }))
    });

  return res.status(200).json(productData);
  } catch (err) {
    console.error('Product API error:', err);
    return res.status(500).json({ error: err.message });
  }
}