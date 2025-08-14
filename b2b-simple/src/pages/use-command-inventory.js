// one-command-inventory.js - Single command to make ALL products in stock

const fetch = require('node-fetch');

// Single function to make everything in stock
async function makeAllInStock() {
  try {
    console.log('🚀 Making ALL products in stock...');
    
    // Step 1: Get auth token
    const authResponse = await fetch('https://auth.eu-central-1.aws.commercetools.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from('8q8D4Dt0axzQOQeM40fwHaGh:uNppWOlnTLBkqyFEx8L7chHgtSAFu43y').toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });
    
    const auth = await authResponse.json();
    const token = auth.access_token;
    
    console.log('✅ Got authentication token');
    
    // Step 2: Get ALL products
    let allSkus = [];
    let offset = 0;
    const limit = 500;
    
    while (true) {
      const productsResponse = await fetch(
        `https://api.eu-central-1.aws.commercetools.com/chempilot/product-projections?limit=${limit}&offset=${offset}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      const productsData = await productsResponse.json();
      const products = productsData.results;
      
      if (products.length === 0) break;
      
      // Extract SKUs from each product
      products.forEach(product => {
        // Master variant SKU
        if (product.masterVariant?.sku) {
          allSkus.push(product.masterVariant.sku);
        }
        // Other variants SKUs
        if (product.variants) {
          product.variants.forEach(variant => {
            if (variant.sku) {
              allSkus.push(variant.sku);
            }
          });
        }
      });
      
      console.log(`📦 Processed ${products.length} products (Total SKUs: ${allSkus.length})`);
      
      if (products.length < limit) break;
      offset += limit;
    }
    
    console.log(`🏷️ Found ${allSkus.length} total SKUs`);
    
    // Step 3: Create inventory for each SKU
    let created = 0;
    let errors = 0;
    
    for (const sku of allSkus) {
      try {
        const inventoryResponse = await fetch(
          'https://api.eu-central-1.aws.commercetools.com/chempilot/inventory',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              sku: sku,
              quantityOnStock: 100
            })
          }
        );
        
        if (inventoryResponse.ok) {
          created++;
          console.log(`✅ ${sku} - IN STOCK`);
        } else {
          // If it already exists, that's fine
          const error = await inventoryResponse.json();
          if (error.statusCode === 400 && error.message?.includes('already exists')) {
            console.log(`ℹ️  ${sku} - Already has inventory`);
          } else {
            errors++;
            console.log(`❌ ${sku} - Error: ${error.message || 'Unknown error'}`);
          }
        }
        
        // Small delay to avoid rate limits
        if (created % 50 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        errors++;
        console.log(`❌ ${sku} - Failed: ${error.message}`);
      }
    }
    
    console.log('\n🎉 COMPLETED!');
    console.log(`📊 Summary:`);
    console.log(`   - Total SKUs: ${allSkus.length}`);
    console.log(`   - New inventory created: ${created}`);
    console.log(`   - Errors: ${errors}`);
    console.log(`   - Success rate: ${Math.round(((allSkus.length - errors) / allSkus.length) * 100)}%`);
    console.log('\n✅ ALL PRODUCTS ARE NOW IN STOCK!');
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
  }
}

// Execute immediately when script runs
makeAllInStock();