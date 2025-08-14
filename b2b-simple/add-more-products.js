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
          resolve({ statusCode: res.statusCode, data, rawData: data });
        }
      });
    });
    
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

const products = [
  { name: 'Industrial Centrifugal Pump A1', sku: 'PUMP-A1-001', price: 2500, category: 'pumps' },
  { name: 'Heavy Duty Water Pump B2', sku: 'PUMP-B2-002', price: 3200, category: 'pumps' },
  { name: 'Chemical Transfer Pump C3', sku: 'PUMP-C3-003', price: 4100, category: 'pumps' },
  { name: 'High Pressure Pump D4', sku: 'PUMP-D4-004', price: 5500, category: 'pumps' },
  { name: 'Submersible Pump E5', sku: 'PUMP-E5-005', price: 1800, category: 'pumps' },
  { name: 'Gear Pump F6', sku: 'PUMP-F6-006', price: 2200, category: 'pumps' },
  { name: 'Diaphragm Pump G7', sku: 'PUMP-G7-007', price: 3800, category: 'pumps' },
  { name: 'Peristaltic Pump H8', sku: 'PUMP-H8-008', price: 4500, category: 'pumps' },
  { name: 'Vortex Pump I9', sku: 'PUMP-I9-009', price: 2800, category: 'pumps' },
  { name: 'Screw Pump J10', sku: 'PUMP-J10-010', price: 3900, category: 'pumps' },
  { name: 'Turbine Pump K11', sku: 'PUMP-K11-011', price: 6200, category: 'pumps' },
  { name: 'Jet Pump L12', sku: 'PUMP-L12-012', price: 1900, category: 'pumps' },
  { name: 'Booster Pump M13', sku: 'PUMP-M13-013', price: 2700, category: 'pumps' },
  { name: 'Fire Fighting Pump N14', sku: 'PUMP-N14-014', price: 8500, category: 'pumps' },
  { name: 'Sewage Pump O15', sku: 'PUMP-O15-015', price: 3300, category: 'pumps' },
  
  { name: 'Ball Valve Stainless Steel 2"', sku: 'VALVE-SS2-001', price: 350, category: 'valves' },
  { name: 'Gate Valve Cast Iron 4"', sku: 'VALVE-CI4-002', price: 580, category: 'valves' },
  { name: 'Check Valve Bronze 1.5"', sku: 'VALVE-BZ15-003', price: 280, category: 'valves' },
  { name: 'Butterfly Valve Carbon Steel 6"', sku: 'VALVE-CS6-004', price: 920, category: 'valves' },
  { name: 'Globe Valve Brass 1"', sku: 'VALVE-BR1-005', price: 225, category: 'valves' },
  { name: 'Safety Relief Valve 3"', sku: 'VALVE-SR3-006', price: 1200, category: 'valves' },
  { name: 'Solenoid Valve Electric 0.5"', sku: 'VALVE-EL05-007', price: 180, category: 'valves' },
  { name: 'Pressure Regulating Valve 2.5"', sku: 'VALVE-PR25-008', price: 680, category: 'valves' },
  { name: 'Needle Valve 0.75"', sku: 'VALVE-NV075-009', price: 145, category: 'valves' },
  { name: 'Plug Valve 3"', sku: 'VALVE-PV3-010', price: 480, category: 'valves' },
  { name: 'Throttle Valve 5"', sku: 'VALVE-TV5-011', price: 750, category: 'valves' },
  { name: 'Pinch Valve 2"', sku: 'VALVE-PIN2-012', price: 320, category: 'valves' },
  { name: 'Control Valve 4"', sku: 'VALVE-CV4-013', price: 1800, category: 'valves' },
  { name: 'Isolation Valve 6"', sku: 'VALVE-IV6-014', price: 990, category: 'valves' },
  { name: 'Emergency Shut-off Valve 8"', sku: 'VALVE-ESV8-015', price: 2200, category: 'valves' },
  
  { name: 'AC Induction Motor 5.5kW', sku: 'MOTOR-AC55-001', price: 1200, category: 'motors' },
  { name: 'Servo Motor Precision 2.2kW', sku: 'MOTOR-SV22-002', price: 2800, category: 'motors' },
  { name: 'Stepper Motor High Torque 1.1kW', sku: 'MOTOR-ST11-003', price: 850, category: 'motors' },
  { name: 'DC Brushless Motor 7.5kW', sku: 'MOTOR-DC75-004', price: 1600, category: 'motors' },
  { name: 'Variable Frequency Drive Motor 11kW', sku: 'MOTOR-VF11-005', price: 2200, category: 'motors' },
  { name: 'Explosion Proof Motor 15kW', sku: 'MOTOR-EP15-006', price: 3800, category: 'motors' },
  { name: 'High Efficiency Motor 22kW', sku: 'MOTOR-HE22-007', price: 2900, category: 'motors' },
  { name: 'Synchronous Motor 30kW', sku: 'MOTOR-SY30-008', price: 4200, category: 'motors' },
  { name: 'Linear Motor 3kW', sku: 'MOTOR-LIN3-009', price: 3500, category: 'motors' },
  { name: 'Gearbox Motor 18kW', sku: 'MOTOR-GB18-010', price: 2600, category: 'motors' },
  { name: 'Planetary Motor 8kW', sku: 'MOTOR-PL8-011', price: 2100, category: 'motors' },
  { name: 'Worm Gear Motor 12kW', sku: 'MOTOR-WG12-012', price: 1950, category: 'motors' },
  { name: 'Torque Motor 6kW', sku: 'MOTOR-TQ6-013', price: 3200, category: 'motors' },
  { name: 'Hybrid Stepper Motor 4kW', sku: 'MOTOR-HS4-014', price: 1800, category: 'motors' },
  { name: 'Direct Drive Motor 25kW', sku: 'MOTOR-DD25-015', price: 4800, category: 'motors' },
  
  { name: 'Industrial Water Filter 10"', sku: 'FILTER-W10-001', price: 120, category: 'filters' },
  { name: 'Oil Filter High Flow 20"', sku: 'FILTER-O20-002', price: 280, category: 'filters' },
  { name: 'Air Filter HEPA Grade', sku: 'FILTER-A-003', price: 450, category: 'filters' },
  { name: 'Chemical Filter Activated Carbon', sku: 'FILTER-C-004', price: 320, category: 'filters' },
  { name: 'Hydraulic Filter Return Line', sku: 'FILTER-H-005', price: 180, category: 'filters' },
  { name: 'Dust Collection Filter Bag', sku: 'FILTER-D-006', price: 95, category: 'filters' },
  { name: 'Membrane Filter Ultrafiltration', sku: 'FILTER-M-007', price: 680, category: 'filters' },
  { name: 'Magnetic Filter Separator', sku: 'FILTER-MG-008', price: 1200, category: 'filters' },
  { name: 'Ceramic Filter Element', sku: 'FILTER-CE-009', price: 380, category: 'filters' },
  { name: 'Sand Filter Media', sku: 'FILTER-SM-010', price: 95, category: 'filters' },
  { name: 'UV Filter Sterilizer', sku: 'FILTER-UV-011', price: 850, category: 'filters' },
  { name: 'RO Filter Membrane', sku: 'FILTER-RO-012', price: 450, category: 'filters' },
  { name: 'Coalescent Filter', sku: 'FILTER-CO-013', price: 320, category: 'filters' },
  { name: 'Pleated Filter Panel', sku: 'FILTER-PL-014', price: 180, category: 'filters' },
  { name: 'Sintered Metal Filter', sku: 'FILTER-SMF-015', price: 590, category: 'filters' },
  
  { name: 'Rotary Screw Compressor 30HP', sku: 'COMP-RS30-001', price: 8500, category: 'compressors' },
  { name: 'Piston Air Compressor 15HP', sku: 'COMP-P15-002', price: 3200, category: 'compressors' },
  { name: 'Scroll Compressor Oil-Free 20HP', sku: 'COMP-SC20-003', price: 5800, category: 'compressors' },
  { name: 'Centrifugal Compressor 50HP', sku: 'COMP-C50-004', price: 15000, category: 'compressors' },
  { name: 'Portable Diesel Compressor 25HP', sku: 'COMP-PD25-005', price: 6500, category: 'compressors' },
  { name: 'Variable Speed Compressor 40HP', sku: 'COMP-VS40-006', price: 12000, category: 'compressors' },
  { name: 'Medical Air Compressor 10HP', sku: 'COMP-M10-007', price: 4800, category: 'compressors' },
  { name: 'High Pressure Compressor 35HP', sku: 'COMP-HP35-008', price: 9800, category: 'compressors' },
  { name: 'Two Stage Compressor 45HP', sku: 'COMP-TS45-009', price: 11200, category: 'compressors' },
  { name: 'Oil-Free Compressor 18HP', sku: 'COMP-OF18-010', price: 7200, category: 'compressors' },
  { name: 'Reciprocating Compressor 22HP', sku: 'COMP-RC22-011', price: 4800, category: 'compressors' },
  { name: 'Booster Compressor 12HP', sku: 'COMP-BC12-012', price: 5200, category: 'compressors' },
  { name: 'Laboratory Compressor 5HP', sku: 'COMP-LC5-013', price: 2800, category: 'compressors' },
  { name: 'Marine Compressor 28HP', sku: 'COMP-MC28-014', price: 8900, category: 'compressors' },
  { name: 'Mining Compressor 60HP', sku: 'COMP-MIN60-015', price: 18500, category: 'compressors' },
  
  { name: 'Diesel Generator 100kVA', sku: 'GEN-D100-001', price: 15000, category: 'generators' },
  { name: 'Gas Generator 75kVA', sku: 'GEN-G75-002', price: 12500, category: 'generators' },
  { name: 'Portable Generator 25kVA', sku: 'GEN-P25-003', price: 3800, category: 'generators' },
  { name: 'Standby Generator 200kVA', sku: 'GEN-S200-004', price: 28000, category: 'generators' },
  { name: 'Solar Generator 50kVA', sku: 'GEN-SO50-005', price: 18000, category: 'generators' },
  { name: 'Wind Generator 30kVA', sku: 'GEN-W30-006', price: 22000, category: 'generators' },
  { name: 'Marine Generator 150kVA', sku: 'GEN-M150-007', price: 35000, category: 'generators' },
  { name: 'Trailer Mounted Generator 80kVA', sku: 'GEN-T80-008', price: 16500, category: 'generators' },
  { name: 'Inverter Generator 40kVA', sku: 'GEN-INV40-009', price: 8900, category: 'generators' },
  { name: 'Three Phase Generator 120kVA', sku: 'GEN-3P120-010', price: 19500, category: 'generators' },
  { name: 'Silent Generator 60kVA', sku: 'GEN-SIL60-011', price: 14200, category: 'generators' },
  { name: 'Industrial Generator 300kVA', sku: 'GEN-IND300-012', price: 45000, category: 'generators' },
  { name: 'Biogas Generator 90kVA', sku: 'GEN-BIO90-013', price: 16800, category: 'generators' },
  { name: 'Emergency Generator 180kVA', sku: 'GEN-EMR180-014', price: 32000, category: 'generators' },
  { name: 'Hybrid Generator 110kVA', sku: 'GEN-HYB110-015', price: 24500, category: 'generators' },
  
  { name: 'Industrial Wrench Set 24pc', sku: 'TOOL-WS24-001', price: 180, category: 'tools' },
  { name: 'Pneumatic Impact Gun', sku: 'TOOL-PIG-002', price: 320, category: 'tools' },
  { name: 'Hydraulic Press 50T', sku: 'TOOL-HP50-003', price: 2800, category: 'tools' },
  { name: 'Torque Wrench Digital', sku: 'TOOL-TWD-004', price: 450, category: 'tools' },
  { name: 'Electric Drill 18V', sku: 'TOOL-ED18-005', price: 220, category: 'tools' },
  { name: 'Angle Grinder 9 inch', sku: 'TOOL-AG9-006', price: 180, category: 'tools' },
  { name: 'Welding Machine MIG', sku: 'TOOL-WM-007', price: 1200, category: 'tools' },
  { name: 'Pipe Threading Machine', sku: 'TOOL-PTM-008', price: 980, category: 'tools' },
  { name: 'Multimeter Digital', sku: 'TOOL-MD-009', price: 95, category: 'tools' },
  { name: 'Chain Hoist 2T', sku: 'TOOL-CH2-010', price: 380, category: 'tools' },
  { name: 'Pipe Cutter 4 inch', sku: 'TOOL-PC4-011', price: 145, category: 'tools' },
  { name: 'Socket Set Metric 40pc', sku: 'TOOL-SSM40-012', price: 280, category: 'tools' },
  { name: 'Inspection Camera', sku: 'TOOL-IC-013', price: 650, category: 'tools' },
  { name: 'Crimping Tool Set', sku: 'TOOL-CTS-014', price: 120, category: 'tools' },
  { name: 'Laser Level 5-Line', sku: 'TOOL-LL5-015', price: 380, category: 'tools' }
];

async function createProduct(token, productData) {
  try {
    const productOptions = {
      hostname: 'api.eu-central-1.aws.commercetools.com',
      path: '/chempilot/products',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const productPayload = {
      name: {
        'en-GB': productData.name,
        'en': productData.name
      },
      description: {
        'en-GB': `Professional ${productData.category.slice(0, -1)} for industrial applications. High-quality construction with reliable performance.`,
        'en': `Professional ${productData.category.slice(0, -1)} for industrial applications. High-quality construction with reliable performance.`
      },
      slug: {
        'en-GB': productData.sku.toLowerCase().replace(/_/g, '-'),
        'en': productData.sku.toLowerCase().replace(/_/g, '-')
      },
      masterVariant: {
        sku: productData.sku,
        prices: [{
          value: {
            currencyCode: 'GBP',
            centAmount: productData.price * 100
          }
        }],
        images: [{
          url: `https://via.placeholder.com/400x300/0d2340/ffffff?text=${encodeURIComponent(productData.category.toUpperCase())}`,
          label: productData.name
        }]
      },
      publish: true
    };

    const result = await makeRequest(productOptions, JSON.stringify(productPayload));
    
    if (result.id) {
      console.log(`✅ Created: ${productData.name} (${productData.sku})`);
      return { success: true };
    } else {
      console.log(`❌ Failed: ${productData.name} - ${result.message || JSON.stringify(result).substring(0, 100)}`);
      return { success: false };
    }

  } catch (error) {
    console.log(`❌ Error creating ${productData.name}: ${error.message}`);
    return { success: false };
  }
}

async function addMoreProducts() {
  try {
    console.log('🚀 Adding products to CommerceTools for pagination...');
    console.log(`📦 Creating ${products.length} products across multiple categories\n`);
    
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
    console.log('✅ Got authentication token\n');
    
    let totalCreated = 0;
    let totalFailed = 0;
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`[${i + 1}/${products.length}] Creating: ${product.name}`);
      
      const result = await createProduct(token, product);
      
      if (result.success) {
        totalCreated++;
      } else {
        totalFailed++;
      }
      
      // Delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Show progress every 10 items
      if ((i + 1) % 10 === 0) {
        console.log(`\n--- Progress: ${i + 1}/${products.length} processed ---\n`);
      }
    }
    
    console.log('\n🎉 PRODUCT CREATION COMPLETED!');
    console.log('═'.repeat(50));
    console.log(`📊 Final Summary:`);
    console.log(`   - Products created: ${totalCreated}`);
    console.log(`   - Products failed: ${totalFailed}`);
    console.log(`   - Success rate: ${Math.round((totalCreated / products.length) * 100)}%`);
    console.log('');
    console.log('📄 PAGINATION READY!');
    console.log(`   - With 20 products per page: ~${Math.ceil(totalCreated / 20)} pages`);
    console.log(`   - With 40 products per page: ~${Math.ceil(totalCreated / 40)} pages`);
    console.log('');
    console.log('✅ Your pagination should now work!');
    console.log('🔄 Refresh your homepage to see multiple pages');
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
  }
}

addMoreProducts();
