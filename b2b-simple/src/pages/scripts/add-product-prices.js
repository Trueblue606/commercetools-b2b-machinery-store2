// scripts/add-product-prices.js
// Run this script to add GBP prices to your products

const PROJECT_KEY = 'chempilot';
const API_URL = 'https://api.eu-central-1.aws.commercetools.com';
const AUTH_TOKEN = 'Bearer pJpjFDbbo0isbG82blSpW4lvRPSlodVL'; // Replace with fresh token

async function addPricesToProduct(productId, priceInPounds) {
  try {
    // Get current product
    const productResponse = await fetch(
      `${API_URL}/${PROJECT_KEY}/products/${productId}`,
      {
        headers: {
          'Authorization': AUTH_TOKEN,
        },
      }
    );

    if (!productResponse.ok) {
      console.error('Failed to fetch product:', await productResponse.text());
      return;
    }

    const product = await productResponse.json();
    const currentVersion = product.version;

    // Add price to master variant
    const updatePayload = {
      version: currentVersion,
      actions: [{
        action: 'addPrice',
        variantId: 1, // Master variant
        price: {
          value: {
            type: 'centPrecision',
            centAmount: Math.round(priceInPounds * 100), // Convert pounds to cents
            currencyCode: 'GBP',
            fractionDigits: 2
          },
          country: 'GB' // Optional - remove if you want price for all countries
        }
      }]
    };

    const updateResponse = await fetch(
      `${API_URL}/${PROJECT_KEY}/products/${productId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': AUTH_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      }
    );

    if (!updateResponse.ok) {
      console.error('Failed to update product:', await updateResponse.text());
      return;
    }

    console.log(`✓ Added £${priceInPounds} price to product ${productId}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example usage - add your products and prices here
async function addPricesForAllProducts() {
  const products = [
    { id: 'a5d684de-54b3-4a27-876e-21de51ed1090', price: 15.99 }, // Fuel filter
    // Add more products here
  ];

  for (const product of products) {
    await addPricesToProduct(product.id, product.price);
  }
}

// Run the script
addPricesForAllProducts();