// make-realistic-stock.js - Creates realistic stock levels (In Stock, Limited, Out of Stock)

const https = require('https');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ statusCode: res.statusCode, data });
        }
      });
    });
    
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// Generate realistic stock quantity based on distribution
function generateStockQuantity(index, total) {
  const rand = Math.random();
  
  // 60% In Stock (15-100+ units)
  if (rand < 0.6) {
    return Math.floor(Math.random() * 85) + 15; // 15-100 units
  }
  // 25% Limited Stock (1-10 units)  
  else if (rand < 0.85) {
    return Math.floor(Math.random() * 10) + 1; // 1-10 units
  }
  // 15% Out of Stock (0 units)
  else {
    return 0; // Out of stock
  }
}

// Get stock status description
function getStockDescription(quantity) {
  if (quantity === 0) return '🔴 OUT OF STOCK';
  else if (quantity <= 10) return `🟡 LIMITED (${quantity} left)`;
  else return `🟢 IN STOCK (${quantity} units)`;
}

async function makeRealisticStock() {
  try {
    console.log('🚀 Creating realistic stock levels...');
    console.log('📊 Distribution: 60% In Stock | 25% Limited | 15% Out of Stock');
    
    // Step 1: Get auth token
    const authOptions = {
      hostname: 'auth.eu-central-1.aws.commercetools.com',
      path: '/oauth/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from('8q8D4Dt0axzQOQeM40fwHaGh:uNppWOlnTLBkqyFEx8L7chHgtSAFu43y').toString('base64')}`,
      }
    };
    
    const auth = await makeRequest(authOptions, 'grant_type=client_credentials');
    
    if (!auth.access_token) {
      throw new Error('Failed to get access token');
    }
    
    const token = auth.access_token;
    console.log('✅ Got authentication token');
    
    // Step 2: Get ALL products
    let allSkus = [];
    let offset = 0;
    const limit = 500;
    
    while (true) {
      console.log(`📡 Fetching products (offset: ${offset})...`);
      
      const productsOptions = {
        hostname: 'api.eu-central-1.aws.commercetools.com',
        path: `/chempilot/product-projections?limit=${limit}&offset=${offset}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      };
      
      const productsData = await makeRequest(productsOptions);
      
      if (!productsData.results) {
        console.log('❌ No results found or API error');
        break;
      }
      
      const products = productsData.results;
      
      if (products.length === 0) {
        console.log('📋 No more products found');
        break;
      }
      
      // Extract SKUs from each product with product info
      products.forEach(product => {
        const productName = product.name['en-GB'] || product.name['en'] || Object.values(product.name)[0] || 'Unnamed Product';
        
        // Master variant SKU
        if (product.masterVariant?.sku) {
          allSkus.push({
            sku: product.masterVariant.sku,
            productName: productName,
            variantType: 'Master'
          });
        }
        // Other variants SKUs
        if (product.variants) {
          product.variants.forEach((variant, index) => {
            if (variant.sku) {
              allSkus.push({
                sku: variant.sku,
                productName: productName,
                variantType: `Variant ${index + 1}`
              });
            }
          });
        }
      });
      
      console.log(`📦 Processed ${products.length} products (Total SKUs: ${allSkus.length})`);
      
      if (products.length < limit) break;
      offset += limit;
      
      // Small delay between product fetches
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`🏷️ Found ${allSkus.length} total SKUs`);
    
    if (allSkus.length === 0) {
      console.log('⚠️ No SKUs found. Check your products have SKUs assigned.');
      return;
    }
    
    // Step 3: First, get existing inventory to update it
    console.log('🔍 Checking existing inventory...');
    let existingInventory = [];
    let invOffset = 0;
    
    while (true) {
      const inventoryOptions = {
        hostname: 'api.eu-central-1.aws.commercetools.com',
        path: `/chempilot/inventory?limit=500&offset=${invOffset}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      };
      
      const inventoryData = await makeRequest(inventoryOptions);
      
      if (!inventoryData.results) break;
      
      const inventory = inventoryData.results;
      if (inventory.length === 0) break;
      
      existingInventory = [...existingInventory, ...inventory];
      
      if (inventory.length < 500) break;
      invOffset += 500;
    }
    
    console.log(`📦 Found ${existingInventory.length} existing inventory entries`);
    
    // Step 4: Create/Update inventory with realistic stock levels
    let created = 0;
    let updated = 0;
    let errors = 0;
    let stockStats = { inStock: 0, limited: 0, outOfStock: 0 };
    
    console.log('🏭 Creating realistic inventory...');
    console.log('');
    
    for (let i = 0; i < allSkus.length; i++) {
      const skuInfo = allSkus[i];
      const quantity = generateStockQuantity(i, allSkus.length);
      
      // Update stats
      if (quantity === 0) stockStats.outOfStock++;
      else if (quantity <= 10) stockStats.limited++;
      else stockStats.inStock++;
      
      try {
        // Check if inventory already exists
        const existingInv = existingInventory.find(inv => inv.sku === skuInfo.sku);
        
        if (existingInv) {
          // Update existing inventory
          const updateOptions = {
            hostname: 'api.eu-central-1.aws.commercetools.com',
            path: `/chempilot/inventory/${existingInv.id}`,
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          };
          
          const updateData = JSON.stringify({
            version: existingInv.version,
            actions: [{
              action: 'changeQuantity',
              quantity: quantity
            }]
          });
          
          const result = await makeRequest(updateOptions, updateData);
          
          if (result.id) {
            updated++;
            console.log(`🔄 ${skuInfo.sku} | ${skuInfo.productName} | ${getStockDescription(quantity)} [${i + 1}/${allSkus.length}]`);
          } else {
            errors++;
            console.log(`❌ ${skuInfo.sku} | Update failed [${i + 1}/${allSkus.length}]`);
          }
          
        } else {
          // Create new inventory
          const inventoryOptions = {
            hostname: 'api.eu-central-1.aws.commercetools.com',
            path: '/chempilot/inventory',
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          };
          
          const inventoryData = JSON.stringify({
            sku: skuInfo.sku,
            quantityOnStock: quantity
          });
          
          const result = await makeRequest(inventoryOptions, inventoryData);
          
          if (result.id) {
            created++;
            console.log(`✅ ${skuInfo.sku} | ${skuInfo.productName} | ${getStockDescription(quantity)} [${i + 1}/${allSkus.length}]`);
          } else {
            errors++;
            console.log(`❌ ${skuInfo.sku} | Creation failed [${i + 1}/${allSkus.length}]`);
          }
        }
        
        // Delay every 20 items to avoid rate limits
        if ((i + 1) % 20 === 0) {
          console.log('⏳ Pausing to avoid rate limits...');
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
      } catch (error) {
        errors++;
        console.log(`❌ ${skuInfo.sku} | Failed: ${error.message} [${i + 1}/${allSkus.length}]`);
      }
    }
    
    console.log('\n🎉 REALISTIC STOCK SETUP COMPLETED!');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Final Summary:`);
    console.log(`   - Total SKUs processed: ${allSkus.length}`);
    console.log(`   - New inventory created: ${created}`);
    console.log(`   - Existing inventory updated: ${updated}`);
    console.log(`   - Errors: ${errors}`);
    console.log(`   - Success rate: ${Math.round(((created + updated) / allSkus.length) * 100)}%`);
    console.log('');
    console.log(`📈 Stock Distribution:`);
    console.log(`   🟢 IN STOCK (15+ units): ${stockStats.inStock} products (${Math.round((stockStats.inStock / allSkus.length) * 100)}%)`);
    console.log(`   🟡 LIMITED STOCK (1-10): ${stockStats.limited} products (${Math.round((stockStats.limited / allSkus.length) * 100)}%)`);
    console.log(`   🔴 OUT OF STOCK (0): ${stockStats.outOfStock} products (${Math.round((stockStats.outOfStock / allSkus.length) * 100)}%)`);
    console.log('');
    console.log('✅ YOUR PRODUCTS NOW HAVE REALISTIC STOCK LEVELS!');
    console.log('🔄 Refresh your product pages to see:');
    console.log('   • Green "In Stock" badges for high inventory');
    console.log('   • Yellow "Limited Stock" with quantity shown'); 
    console.log('   • Red "Out of Stock" with disabled add to cart');
    console.log('   • Smart quantity selectors that respect limits');
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    console.log('📝 Check your credentials and network connection.');
  }
}

// Alternative function to set specific stock levels
async function setSpecificStockLevels() {
  console.log('🎯 Setting specific stock examples...');
  
  // Example stock configurations - you can modify these
  const specificStock = [
    { sku: 'PUMP-001', quantity: 50, description: 'High Stock' },
    { sku: 'PUMP-002', quantity: 5, description: 'Limited Stock' },
    { sku: 'PUMP-003', quantity: 0, description: 'Out of Stock' },
    { sku: 'VALVE-001', quantity: 25, description: 'Good Stock' },
    { sku: 'VALVE-002', quantity: 2, description: 'Very Limited' },
    { sku: 'MOTOR-001', quantity: 0, description: 'Sold Out' },
  ];
  
  try {
    // Get auth token (same as above)
    const authOptions = {
      hostname: 'auth.eu-central-1.aws.commercetools.com',
      path: '/oauth/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from('8q8D4Dt0axzQOQeM40fwHaGh:uNppWOlnTLBkqyFEx8L7chHgtSAFu43y').toString('base64')}`,
      }
    };
    
    const auth = await makeRequest(authOptions, 'grant_type=client_credentials');
    const token = auth.access_token;
    
    console.log('✅ Got authentication token');
    
    for (const item of specificStock) {
      try {
        const inventoryOptions = {
          hostname: 'api.eu-central-1.aws.commercetools.com',
          path: '/chempilot/inventory',
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };
        
        const inventoryData = JSON.stringify({
          sku: item.sku,
          quantityOnStock: item.quantity
        });
        
        const result = await makeRequest(inventoryOptions, inventoryData);
        
        if (result.id) {
          console.log(`✅ ${item.sku} - ${getStockDescription(item.quantity)} (${item.description})`);
        } else {
          console.log(`ℹ️  ${item.sku} - May already exist`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`❌ ${item.sku} - Error: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Specific stock levels set!');
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

// Execute based on argument or default to realistic stock
const args = process.argv.slice(2);

if (args.includes('--specific')) {
  console.log('🎯 Running specific stock setup...\n');
  setSpecificStockLevels();
} else {
  console.log('🎲 Running realistic stock distribution...\n');
  makeRealisticStock();
}