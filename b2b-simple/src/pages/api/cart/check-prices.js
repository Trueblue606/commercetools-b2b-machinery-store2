// pages/api/products/check-prices.js
// Endpoint to check product prices in Commercetools

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { productId } = req.query;
    
    // Get auth token
    const authRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cart/auth`);
    const { token } = await authRes.json();

    // Fetch product details
    const productResponse = await fetch(
      `https://api.eu-central-1.aws.commercetools.com/chempilot/products/${productId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!productResponse.ok) {
      const error = await productResponse.json();
      return res.status(productResponse.status).json({ error: error.message });
    }

    const product = await productResponse.json();
    
    // Extract price information
    const priceInfo = {
      productId: product.id,
      productName: product.masterData.current.name,
      masterVariant: {
        id: product.masterData.current.masterVariant.id,
        sku: product.masterData.current.masterVariant.sku,
        prices: product.masterData.current.masterVariant.prices || []
      },
      variants: product.masterData.current.variants.map(v => ({
        id: v.id,
        sku: v.sku,
        prices: v.prices || []
      }))
    };

    // Check for GBP prices
    const allPrices = [
      ...priceInfo.masterVariant.prices,
      ...priceInfo.variants.flatMap(v => v.prices)
    ];
    
    const gbpPrices = allPrices.filter(p => p.value.currencyCode === 'GBP');
    const gbPrices = gbpPrices.filter(p => p.country === 'GB');

    return res.status(200).json({
      priceInfo,
      summary: {
        totalPrices: allPrices.length,
        gbpPrices: gbpPrices.length,
        gbpWithCountryGB: gbPrices.length,
        currencies: [...new Set(allPrices.map(p => p.value.currencyCode))],
        countries: [...new Set(allPrices.filter(p => p.country).map(p => p.country))]
      }
    });
  } catch (error) {
    console.error('Error checking prices:', error);
    res.status(500).json({ error: error.message });
  }
}