// add-more-products.js - Add MANY products for pagination testing

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

// Extended product data for multiple pages - 100+ products
const productCategories = {
  pumps: [
    { name: 'Industrial Centrifugal Pump Model A1', sku: 'PUMP-A1-001', price: 2500, capacity: '500L/min', power: '15kW' },
    { name: 'Heavy Duty Water Pump Series B', sku: 'PUMP-B2-002', price: 3200, capacity: '750L/min', power: '22kW' },
    { name: 'Chemical Transfer Pump C3', sku: 'PUMP-C3-003', price: 4100, capacity: '300L/min', power: '11kW' },
    { name: 'High Pressure Pump D4', sku: 'PUMP-D4-004', price: 5500, capacity: '200L/min', power: '30kW' },
    { name: 'Submersible Pump E5', sku: 'PUMP-E5-005', price: 1800, capacity: '400L/min', power: '7.5kW' },
    { name: 'Gear Pump F6', sku: 'PUMP-F6-006', price: 2200, capacity: '100L/min', power: '5.5kW' },
    { name: 'Diaphragm Pump G7', sku: 'PUMP-G7-007', price: 3800, capacity: '250L/min', power: '18kW' },
    { name: 'Peristaltic Pump H8', sku: 'PUMP-H8-008', price: 4500, capacity: '50L/min', power: '3kW' },
    { name: 'Vortex Pump I9', sku: 'PUMP-I9-009', price: 2800, capacity: '350L/min', power: '12kW' },
    { name: 'Screw Pump J10', sku: 'PUMP-J10-010', price: 3900, capacity: '450L/min', power: '20kW' },
    { name: 'Turbine Pump K11', sku: 'PUMP-K11-011', price: 6200, capacity: '800L/min', power: '35kW' },
    { name: 'Jet Pump L12', sku: 'PUMP-L12-012', price: 1900, capacity: '180L/min', power: '8kW' },
    { name: 'Booster Pump M13', sku: 'PUMP-M13-013', price: 2700, capacity: '320L/min', power: '14kW' },
    { name: 'Fire Fighting Pump N14', sku: 'PUMP-N14-014', price: 8500, capacity: '1200L/min', power: '45kW' },
    { name: 'Sewage Pump O15', sku: 'PUMP-O15-015', price: 3300, capacity: '600L/min', power: '25kW' }
  ],
  valves: [
    { name: 'Ball Valve Stainless Steel 2"', sku: 'VALVE-SS2-001', price: 350, pressure: '40bar', material: 'Stainless Steel' },
    { name: 'Gate Valve Cast Iron 4"', sku: 'VALVE-CI4-002', price: 580, pressure: '16bar', material: 'Cast Iron' },
    { name: 'Check Valve Bronze 1.5"', sku: 'VALVE-BZ15-003', price: 280, pressure: '25bar', material: 'Bronze' },
    { name: 'Butterfly Valve Carbon Steel 6"', sku: 'VALVE-CS6-004', price: 920, pressure: '10bar', material: 'Carbon Steel' },
    { name: 'Globe Valve Brass 1"', sku: 'VALVE-BR1-005', price: 225, pressure: '32bar', material: 'Brass' },
    { name: 'Safety Relief Valve 3"', sku: 'VALVE-SR3-006', price: 1200, pressure: '50bar', material: 'Stainless Steel' },
    { name: 'Solenoid Valve Electric 0.5"', sku: 'VALVE-EL05-007', price: 180, pressure: '8bar', material: 'Brass' },
    { name: 'Pressure Regulating Valve 2.5"', sku: 'VALVE-PR25-008', price: 680, pressure: '20bar', material: 'Stainless Steel' },
    { name: 'Needle Valve 0.75"', sku: 'VALVE-NV075-009', price: 145, pressure: '35bar', material: 'Stainless Steel' },
    { name: 'Plug Valve 3"', sku: 'VALVE-PV3-010', price: 480, pressure: '22bar', material: 'Cast Iron' },
    { name: 'Throttle Valve 5"', sku: 'VALVE-TV5-011', price: 750, pressure: '15bar', material: 'Carbon Steel' },
    { name: 'Pinch Valve 2"', sku: 'VALVE-PIN2-012', price: 320, pressure: '12bar', material: 'Rubber Lined' },
    { name: 'Control Valve 4"', sku: 'VALVE-CV4-013', price: 1800, pressure: '28bar', material: 'Stainless Steel' },
    { name: 'Isolation Valve 6"', sku: 'VALVE-IV6-014', price: 990, pressure: '18bar', material: 'Cast Steel' },
    { name: 'Emergency Shut-off Valve 8"', sku: 'VALVE-ESV8-015', price: 2200, pressure: '25bar', material: 'Stainless Steel' }
  ],
  motors: [
    { name: 'AC Induction Motor 5.5kW', sku: 'MOTOR-AC55-001', price: 1200, power: '5.5kW', voltage: '400V' },
    { name: 'Servo Motor Precision 2.2kW', sku: 'MOTOR-SV22-002', price: 2800, power: '2.2kW', voltage: '230V' },
    { name: 'Stepper Motor High Torque 1.1kW', sku: 'MOTOR-ST11-003', price: 850, power: '1.1kW', voltage: '24V' },
    { name: 'DC Brushless Motor 7.5kW', sku: 'MOTOR-DC75-004', price: 1600, power: '7.5kW', voltage: '48V' },
    { name: 'Variable Frequency Drive Motor 11kW', sku: 'MOTOR-VF11-005', price: 2200, power: '11kW', voltage: '400V' },
    { name: 'Explosion Proof Motor 15kW', sku: 'MOTOR-EP15-006', price: 3800, power: '15kW', voltage: '400V' },
    { name: 'High Efficiency Motor 22kW', sku: 'MOTOR-HE22-007', price: 2900, power: '22kW', voltage: '400V' },
    { name: 'Synchronous Motor 30kW', sku: 'MOTOR-SY30-008', price: 4200, power: '30kW', voltage: '400V' },
    { name: 'Linear Motor 3kW', sku: 'MOTOR-LIN3-009', price: 3500, power: '3kW', voltage: '230V' },
    { name: 'Gearbox Motor 18kW', sku: 'MOTOR-GB18-010', price: 2600, power: '18kW', voltage: '400V' },
    { name: 'Planetary Motor 8kW', sku: 'MOTOR-PL8-011', price: 2100, power: '8kW', voltage: '400V' },
    { name: 'Worm Gear Motor 12kW', sku: 'MOTOR-WG12-012', price: 1950, power: '12kW', voltage: '400V' },
    { name: 'Torque Motor 6kW', sku: 'MOTOR-TQ6-013', price: 3200, power: '6kW', voltage: '230V' },
    { name: 'Hybrid Stepper Motor 4kW', sku: 'MOTOR-HS4-014', price: 1800, power: '4kW', voltage: '48V' },
    { name: 'Direct Drive Motor 25kW', sku: 'MOTOR-DD25-015', price: 4800, power: '25kW', voltage: '400V' }
  ],
  filters: [
    { name: 'Industrial Water Filter 10" Cartridge', sku: 'FILTER-W10-001', price: 120, type: 'Cartridge', micron: '5μm' },
    { name: 'Oil Filter High Flow 20"', sku: 'FILTER-O20-002', price: 280, type: 'High Flow', micron: '10μm' },
    { name: 'Air Filter HEPA Grade', sku: 'FILTER-A-003', price: 450, type: 'HEPA', micron: '0.3μm' },
    { name: 'Chemical Filter Activated Carbon', sku: 'FILTER-C-004', price: 320, type: 'Carbon', micron: '25μm' },
    { name: 'Hydraulic Filter Return Line', sku: 'FILTER-H-005', price: 180, type: 'Return', micron: '15μm' },
    { name: 'Dust Collection Filter Bag', sku: 'FILTER-D-006', price: 95, type: 'Bag', micron: '1μm' },
    { name: 'Membrane Filter Ultrafiltration', sku: 'FILTER-M-007', price: 680, type: 'Membrane', micron: '0.01μm' },
    { name: 'Magnetic Filter Separator', sku: 'FILTER-MG-008', price: 1200, type: 'Magnetic', micron: 'N/A' },
    { name: 'Ceramic Filter Element', sku: 'FILTER-CE-009', price: 380, type: 'Ceramic', micron: '2μm' },
    { name: 'Sand Filter Media', sku: 'FILTER-SM-010', price: 95, type: 'Sand', micron: '50μm' },
    { name: 'UV Filter Sterilizer', sku: 'FILTER-UV-011', price: 850, type: 'UV', micron: 'N/A' },
    { name: 'RO Filter Membrane', sku: 'FILTER-RO-012', price: 450, type: 'RO', micron: '0.0001μm' },
    { name: 'Coalescent Filter', sku: 'FILTER-CO-013', price: 320, type: 'Coalescent', micron: '3μm' },
    { name: 'Pleated Filter Panel', sku: 'FILTER-PL-014', price: 180, type: 'Pleated', micron: '8μm' },
    { name: 'Sintered Metal Filter', sku: 'FILTER-SMF-015', price: 590, type: 'Sintered', micron: '20μm' }
  ],
  compressors: [
    { name: 'Rotary Screw Compressor 30HP', sku: 'COMP-RS30-001', price: 8500, power: '30HP', pressure: '8bar' },
    { name: 'Piston Air Compressor 15HP', sku: 'COMP-P15-002', price: 3200, power: '15HP', pressure: '10bar' },
    { name: 'Scroll Compressor Oil-Free 20HP', sku: 'COMP-SC20-003', price: 5800, power: '20HP', pressure: '7bar' },
    { name: 'Centrifugal Compressor 50HP', sku: 'COMP-C50-004', price: 15000, power: '50HP', pressure: '12bar' },
    { name: 'Portable Diesel Compressor 25HP', sku: 'COMP-PD25-005', price: 6500, power: '25HP', pressure: '7bar' },
    { name: 'Variable Speed Compressor 40HP', sku: 'COMP-VS40-006', price: 12000, power: '40HP', pressure: '8bar' },
    { name: 'Medical Air Compressor 10HP', sku: 'COMP-M10-007', price: 4800, power: '10HP', pressure: '8bar' },
    { name: 'High Pressure Compressor 35HP', sku: 'COMP-HP35-008', price: 9800, power: '35HP', pressure: '40bar' },
    { name: 'Two Stage Compressor 45HP', sku: 'COMP-TS45-009', price: 11200, power: '45HP', pressure: '15bar' },
    { name: 'Oil-Free Compressor 18HP', sku: 'COMP-OF18-010', price: 7200, power: '18HP', pressure: '8bar' },
    { name: 'Reciprocating Compressor 22HP', sku: 'COMP-RC22-011', price: 4800, power: '22HP', pressure: '12bar' },
    { name: 'Booster Compressor 12HP', sku: 'COMP-BC12-012', price: 5200, power: '12HP', pressure: '25bar' },
    { name: 'Laboratory Compressor 5HP', sku: 'COMP-LC5-013', price: 2800, power: '5HP', pressure: '8bar' },
    { name: 'Marine Compressor 28HP', sku: 'COMP-MC28-014', price: 8900, power: '28HP', pressure: '10bar' },
    { name: 'Mining Compressor 60HP', sku: 'COMP-MIN60-015', price: 18500, power: '60HP', pressure: '15bar' }
  ],
  generators: [
    { name: 'Diesel Generator 100kVA', sku: 'GEN-D100-001', price: 15000, power: '100kVA', fuel: 'Diesel' },
    { name: 'Gas Generator 75kVA', sku: 'GEN-G75-002', price: 12500, power: '75kVA', fuel: 'Natural Gas' },
    { name: 'Portable Generator 25kVA', sku: 'GEN-P25-003', price: 3800, power: '25kVA', fuel: 'Diesel' },
    { name: 'Standby Generator 200kVA', sku: 'GEN-S200-004', price: 28000, power: '200kVA', fuel: 'Diesel' },
    { name: 'Solar Generator 50kVA', sku: 'GEN-SO50-005', price: 18000, power: '50kVA', fuel: 'Solar' },
    { name: 'Wind Generator 30kVA', sku: 'GEN-W30-006', price: 22000, power: '30kVA', fuel: 'Wind' },
    { name: 'Marine Generator 150kVA', sku: 'GEN-M150-007', price: 35000, power: '150kVA', fuel: 'Marine Diesel' },
    { name: 'Trailer Mounted Generator 80kVA', sku: 'GEN-T80-008', price: 16500, power: '80kVA', fuel: 'Diesel' },
    { name: 'Inverter Generator 40kVA', sku: 'GEN-INV40-009', price: 8900, power: '40kVA', fuel: 'Diesel' },
    { name: 'Three Phase Generator 120kVA', sku: 'GEN-3P120-010', price: 19500, power: '120kVA', fuel: 'Diesel' },
    { name: 'Silent Generator 60kVA', sku: 'GEN-SIL60-011', price: 14200, power: '60kVA', fuel: 'Diesel' },
    { name: 'Industrial Generator 300kVA', sku: 'GEN-IND300-012', price: 45000, power: '300kVA', fuel: 'Diesel' },
    { name: 'Biogas Generator 90kVA', sku: 'GEN-BIO90-013', price: 16800, power: '90kVA', fuel: 'Biogas' },
    { name: 'Emergency Generator 180kVA', sku: 'GEN-EMR180-014', price: 32000, power: '180kVA', fuel: 'Diesel' },
    { name: 'Hybrid Generator 110kVA', sku: 'GEN-HYB110-015', price: 24500, power: '110kVA', fuel: 'Hybrid' }
  ],
  tools: [
    { name: 'Industrial Wrench Set 24pc', sku: 'TOOL-WS24-001', price: 180, type: 'Hand Tool', material: 'Chrome Vanadium' },
    { name: 'Pneumatic Impact Gun', sku: 'TOOL-PIG-002', price: 320, type: 'Pneumatic', material: 'Aluminum' },
    { name: 'Hydraulic Press 50T', sku: 'TOOL-HP50-003', price: 2800, type: 'Hydraulic', material: 'Steel' },
    { name: 'Torque Wrench Digital', sku: 'TOOL-TWD-004', price: 450, type: 'Digital', material: 'Steel' },
    { name: 'Electric Drill 18V', sku: 'TOOL-ED18-005', price: 220, type: 'Electric', material: 'Plastic/Metal' },
    { name: 'Angle Grinder 9"', sku: 'TOOL-AG9-006', price: 180, type: 'Electric', material: 'Metal' },
    { name: 'Welding Machine MIG', sku: 'TOOL-WM-007', price: 1200, type: 'Welding', material: 'Steel' },
    { name: 'Pipe Threading Machine', sku: 'TOOL-PTM-008', price: 980, type: 'Threading', material: 'Cast Iron' },
    { name: 'Multimeter Digital', sku: 'TOOL-MD-009', price: 95, type: 'Electrical', material: 'Plastic' },
    { name: 'Chain Hoist 2T', sku: 'TOOL-CH2-010', price: 380, type: 'Lifting', material: 'Steel' },
    { name: 'Pipe Cutter 4"', sku: 'TOOL-PC4-011', price: 145, type: 'Cutting', material: 'Steel' },
    { name: 'Socket Set Metric 40pc', sku: 'TOOL-SSM40-012', price: 280, type: 'Hand Tool', material: 'Chrome Vanadium' },
    { name: 'Inspection Camera', sku: 'TOOL-IC-013', price: 650, type: 'Digital', material: 'Plastic/Metal' },
    { name: 'Crimping Tool Set', sku: 'TOOL-CTS-014', price: 120, type: 'Hand Tool', material: 'Steel' },
    { name: 'Laser Level 5-Line', sku: 'TOOL-LL5-015', price: 380, type: 'Measurement', material: 'Aluminum' }
  ],
  bearings: [
    { name: 'Deep Grove Ball Bearing 6205', sku: 'BEAR-DG6205-001', price: 25, type: 'Ball', material: 'Steel' },
    { name: 'Tapered Roller Bearing 32205', sku: 'BEAR-TR32205-002', price: 45, type: 'Roller', material: 'Steel' },
    { name: 'Thrust Ball Bearing 51205', sku: 'BEAR-TB51205-003', price: 35, type: 'Thrust', material: 'Steel' },
    { name: 'Spherical Roller Bearing 22205', sku: 'BEAR-SR22205-004', price: 85, type: 'Spherical', material: 'Steel' },
    { name: 'Needle Roller Bearing NK25', sku: 'BEAR-NR-NK25-005', price: 28, type: 'Needle', material: 'Steel' },
    { name: 'Pillow Block Bearing UCP205', sku: 'BEAR-PB-UCP205-006', price: 55, type: 'Pillow Block', material: 'Cast Iron' },
    { name: 'Flange Bearing UCFL205', sku: 'BEAR-FL-UCFL205-007', price: 65, type: 'Flange', material: 'Cast Iron' },
    { name: 'Angular Contact Bearing 7205', sku: 'BEAR-AC7205-008', price: 95, type: 'Angular', material: 'Steel' },
    { name: 'Cylindrical Roller Bearing NU205', sku: 'BEAR-CR-NU205-009', price: 68, type: 'Cylindrical', material: 'Steel' },
    { name: 'Linear Ball Bearing LM25', sku: 'BEAR-LB-LM25-010', price: 42, type: 'Linear', material: 'Steel' },
    { name: 'Ceramic Ball Bearing 6205C', sku: 'BEAR-CB6205C-011', price: 180, type: 'Ceramic', material: 'Ceramic/Steel' },
    { name: 'Stainless Steel Bearing SS6205', sku: 'BEAR-SS6205-012', price: 85, type: 'Ball', material: 'Stainless Steel' },
    { name: 'Self-Aligning Bearing 1205', sku: 'BEAR-SA1205-013', price: 48, type: 'Self-Aligning', material: 'Steel' },
    { name: 'Insert Bearing UC205', sku: 'BEAR-IN-UC205-014', price: 38, type: 'Insert', material: 'Steel' },
    { name: 'Miniature Bearing 625', sku: 'BEAR-MIN625-015', price: 18, type: 'Miniature', material: 'Steel' }
  ]
};

async function createProduct(token, productData, categoryName) {
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

    // Generate attributes based on category
    const attributes = [];
    if (productData.capacity) attributes.push({ name: 'capacity', value: productData.capacity });
    if (productData.power) attributes.push({ name: 'power', value: productData.power });
    if (productData.voltage) attributes.push({ name: 'voltage', value: productData.voltage });
    if (productData.pressure) attributes.push({ name: 'pressure', value: productData.pressure });
    if (productData.material) attributes.push({ name: 'material', value: productData.material });
    if (productData.type) attributes.push({ name: 'type', value: productData.type });
    if (productData.micron) attributes.push({ name: 'micron', value: productData.micron });
    if (productData.fuel) attributes.push({ name: 'fuel', value: productData.fuel });

    const productPayload = {
      productType: {
        key: 'industrial-equipment'
      },
      name: {
        'en-GB': productData.name,
        'en-US': productData.name,
        'en': productData.name
      },
      description: {
        'en-GB': `Professional ${categoryName.slice(0, -1)} for industrial applications. High-quality construction with reliable performance and long service life. Suitable for demanding industrial environments.`,
        'en-US': `Professional ${categoryName.slice(0, -1)} for industrial applications. High-quality construction with reliable performance and long service life. Suitable for demanding industrial environments.`,
        'en': `Professional ${categoryName.slice(0, -1)} for industrial applications. High-quality construction with reliable performance and long service life. Suitable for demanding industrial environments.`
      },
      slug: {
        'en-GB': productData.sku.toLowerCase().replace(/_/g, '-'),
        'en-US': productData.sku.toLowerCase().replace(/_/g, '-'),
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
        attributes: attributes,
        images: [{
          url: `https://via.placeholder.com/400x300/0d2340/ffffff?text=${encodeURIComponent(categoryName.toUpperCase())}`,
          label: productData.name
        }]
      },
      publish: true
    };

    const result = await makeRequest(productOptions, JSON.stringify(productPayload));
    
    if (result.id) {
      console.log(`✅ Created: ${productData.name} (${productData.sku})`);
      return { success: true, product: result };
    } else {
      console.log(`❌ Failed to create: ${productData.name} - ${result.message || 'Unknown error'}`);
      return { success: false, error: result };
    }

  } catch (error) {
    console.log(`❌ Error creating ${productData.name}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function createProductType(token) {
  try {
    const productTypeOptions = {
      hostname: 'api.eu-central-1.aws.commercetools.com',
      path: '/chempilot/product-types',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const productTypePayload = {
      key: 'industrial-equipment',
      name: 'Industrial Equipment',
      description: 'Product type for industrial machinery and equipment',
      attributes: [
        {
          name: 'capacity',
          label: { 'en': 'Capacity', 'en-GB': 'Capacity', 'en-US': 'Capacity' },
          type: { name: 'text' },
          isRequired: false,
          attributeConstraint: 'None',
          inputHint: 'SingleLine',
          isSearchable: true
        },
        {
          name: 'power',
          label: { 'en': 'Power', 'en-GB': 'Power', 'en-US': 'Power' },
          type: { name: 'text' },
          isRequired: false,
          attributeConstraint: 'None',
          inputHint: 'SingleLine',
          isSearchable: true
        },
        {
          name: 'voltage',
          label: { 'en': 'Voltage', 'en-GB': 'Voltage', 'en-US': 'Voltage' },
          type: { name: 'text' },
          isRequired: false,
          attributeConstraint: 'None',
          inputHint: 'SingleLine',
          isSearchable: true
        },
        {
          name: 'pressure',
          label: { 'en': 'Max Pressure', 'en-GB': 'Max Pressure', 'en-US': 'Max Pressure' },
          type: { name: 'text' },
          isRequired: false,
          attributeConstraint: 'None',
          inputHint: 'SingleLine',
          isSearchable: true
        },
        {
          name: 'material',
          label: { 'en': 'Material', 'en-GB': 'Material', 'en-US': 'Material' },
          type: { name: 'text' },
          isRequired: false,
          attributeConstraint: 'None',
          inputHint: 'SingleLine',
          isSearchable: true
        },
        {
          name: 'type',
          label: { 'en': 'Type', 'en-GB': 'Type', 'en-US': 'Type' },
          type: { name: 'text' },
          isRequired: false,
          attributeConstraint: 'None',
          inputHint: 'SingleLine',
          isSearchable: true
        },
        {
          name: 'micron',
          label: { 'en': 'Micron Rating', 'en-GB': 'Micron Rating', 'en-US': 'Micron Rating' },
          type: { name: 'text' },
          isRequired: false,
          attributeConstraint: 'None',
          inputHint: 'SingleLine',
          isSearchable: true
        },
        {
          name: 'fuel',
          label: { 'en': 'Fuel Type', 'en-GB': 'Fuel Type', 'en-US': 'Fuel Type' },
          type: { name: 'text' },
          isRequired: false,
          attributeConstraint: 'None',
          inputHint: 'SingleLine',
          isSearchable: true
        }
      ]
    };

    const result = await makeRequest(productTypeOptions, JSON.stringify(productTypePayload));
    
    if (result.id) {
      console.log('✅ Created product type: industrial-equipment');
      return true;
    } else {
      console.log('ℹ️  Product type may already exist or creation failed');
      return false;
    }

  } catch (error) {
    console.log('ℹ️  Product type creation skipped (may already exist)');
    return false;
  }
}

async function addMoreProducts() {
  try {
    console.log('🚀 Adding MORE products to CommerceTools for pagination...');
    console.log('📦 This will create 105+ products across 8 categories');
    console.log('📄 Perfect for testing pagination with multiple pages!\n');
    
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
    
    // Step 2: Create product type (if it doesn't exist)
    console.log('🔧 Setting up product type...');
    await createProductType(token);
    
    // Step 3: Create products for each category
    let totalCreated = 0;
    let totalFailed = 0;
    
    for (const [categoryName, products] of Object.entries(productCategories)) {
      console.log(`\n📂 Creating ${categoryName.toUpperCase()} products (${products.length} items)...`);
      
      for (const productData of products) {
        const result = await createProduct(token, productData, categoryName);
        
        if (result.success) {
          totalCreated++;
        } else {
          totalFailed++;
        }
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      console.log(`✅ Completed ${categoryName} category (${products.length} products)`);
      
      // Longer delay between categories
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    console.log('\n🎉 PRODUCT CREATION COMPLETED!');
    console.log('═'.repeat(50));
    console.log(`📊 Final Summary:`);
    console.log(`   - Products created: ${totalCreated}`);
    console.log(`   - Products failed: ${totalFailed}`);
    console.log(`   - Total categories: ${Object.keys(productCategories).length}`);
    console.log(`   - Success rate: ${Math.round((totalCreated / (totalCreated + totalFailed)) * 100)}%`);
    console.log('');
    console.log('📋 Categories with product counts:');
    Object.keys(productCategories).forEach((category, index) => {
      console.log(`   ${index + 1}. ${category.charAt(0).toUpperCase() + category.slice(1)}: ${productCategories[category].length} products`);
    });
    console.log('');
    console.log('📄 PAGINATION READY!');
    console.log(`   - With 12 products per page: ~${Math.ceil(totalCreated / 12)} pages`);
    console.log(`   - With 20 products per page: ~${Math.ceil(totalCreated / 20)} pages`);
    console.log(`   - With 24 products per page: ~${Math.ceil(totalCreated / 24)} pages`);
    console.log('');
    console.log('✅ Your pagination should now work perfectly!');
    console.log('🔄 Refresh your homepage to see multiple pages');
    console.log('📄 Navigate between pages to see pagination in action');
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    console.log('📝 Check your credentials and network connection.');
  }
}

// Execute the function
addMoreProducts();

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

// Sample product data for different categories
const productCategories = {
  pumps: [
    { name: 'Industrial Centrifugal Pump Model A1', sku: 'PUMP-A1-001', price: 2500, capacity: '500L/min', power: '15kW' },
    { name: 'Heavy Duty Water Pump Series B', sku: 'PUMP-B2-002', price: 3200, capacity: '750L/min', power: '22kW' },
    { name: 'Chemical Transfer Pump C3', sku: 'PUMP-C3-003', price: 4100, capacity: '300L/min', power: '11kW' },
    { name: 'High Pressure Pump D4', sku: 'PUMP-D4-004', price: 5500, capacity: '200L/min', power: '30kW' },
    { name: 'Submersible Pump E5', sku: 'PUMP-E5-005', price: 1800, capacity: '400L/min', power: '7.5kW' },
    { name: 'Gear Pump F6', sku: 'PUMP-F6-006', price: 2200, capacity: '100L/min', power: '5.5kW' },
    { name: 'Diaphragm Pump G7', sku: 'PUMP-G7-007', price: 3800, capacity: '250L/min', power: '18kW' },
    { name: 'Peristaltic Pump H8', sku: 'PUMP-H8-008', price: 4500, capacity: '50L/min', power: '3kW' }
  ],
  valves: [
    { name: 'Ball Valve Stainless Steel 2"', sku: 'VALVE-SS2-001', price: 350, pressure: '40bar', material: 'Stainless Steel' },
    { name: 'Gate Valve Cast Iron 4"', sku: 'VALVE-CI4-002', price: 580, pressure: '16bar', material: 'Cast Iron' },
    { name: 'Check Valve Bronze 1.5"', sku: 'VALVE-BZ15-003', price: 280, pressure: '25bar', material: 'Bronze' },
    { name: 'Butterfly Valve Carbon Steel 6"', sku: 'VALVE-CS6-004', price: 920, pressure: '10bar', material: 'Carbon Steel' },
    { name: 'Globe Valve Brass 1"', sku: 'VALVE-BR1-005', price: 225, pressure: '32bar', material: 'Brass' },
    { name: 'Safety Relief Valve 3"', sku: 'VALVE-SR3-006', price: 1200, pressure: '50bar', material: 'Stainless Steel' },
    { name: 'Solenoid Valve Electric 0.5"', sku: 'VALVE-EL05-007', price: 180, pressure: '8bar', material: 'Brass' },
    { name: 'Pressure Regulating Valve 2.5"', sku: 'VALVE-PR25-008', price: 680, pressure: '20bar', material: 'Stainless Steel' }
  ],
  motors: [
    { name: 'AC Induction Motor 5.5kW', sku: 'MOTOR-AC55-001', price: 1200, power: '5.5kW', voltage: '400V' },
    { name: 'Servo Motor Precision 2.2kW', sku: 'MOTOR-SV22-002', price: 2800, power: '2.2kW', voltage: '230V' },
    { name: 'Stepper Motor High Torque 1.1kW', sku: 'MOTOR-ST11-003', price: 850, power: '1.1kW', voltage: '24V' },
    { name: 'DC Brushless Motor 7.5kW', sku: 'MOTOR-DC75-004', price: 1600, power: '7.5kW', voltage: '48V' },
    { name: 'Variable Frequency Drive Motor 11kW', sku: 'MOTOR-VF11-005', price: 2200, power: '11kW', voltage: '400V' },
    { name: 'Explosion Proof Motor 15kW', sku: 'MOTOR-EP15-006', price: 3800, power: '15kW', voltage: '400V' },
    { name: 'High Efficiency Motor 22kW', sku: 'MOTOR-HE22-007', price: 2900, power: '22kW', voltage: '400V' },
    { name: 'Synchronous Motor 30kW', sku: 'MOTOR-SY30-008', price: 4200, power: '30kW', voltage: '400V' }
  ],
  filters: [
    { name: 'Industrial Water Filter 10" Cartridge', sku: 'FILTER-W10-001', price: 120, type: 'Cartridge', micron: '5μm' },
    { name: 'Oil Filter High Flow 20"', sku: 'FILTER-O20-002', price: 280, type: 'High Flow', micron: '10μm' },
    { name: 'Air Filter HEPA Grade', sku: 'FILTER-A-003', price: 450, type: 'HEPA', micron: '0.3μm' },
    { name: 'Chemical Filter Activated Carbon', sku: 'FILTER-C-004', price: 320, type: 'Carbon', micron: '25μm' },
    { name: 'Hydraulic Filter Return Line', sku: 'FILTER-H-005', price: 180, type: 'Return', micron: '15μm' },
    { name: 'Dust Collection Filter Bag', sku: 'FILTER-D-006', price: 95, type: 'Bag', micron: '1μm' },
    { name: 'Membrane Filter Ultrafiltration', sku: 'FILTER-M-007', price: 680, type: 'Membrane', micron: '0.01μm' },
    { name: 'Magnetic Filter Separator', sku: 'FILTER-MG-008', price: 1200, type: 'Magnetic', micron: 'N/A' }
  ],
  compressors: [
    { name: 'Rotary Screw Compressor 30HP', sku: 'COMP-RS30-001', price: 8500, power: '30HP', pressure: '8bar' },
    { name: 'Piston Air Compressor 15HP', sku: 'COMP-P15-002', price: 3200, power: '15HP', pressure: '10bar' },
    { name: 'Scroll Compressor Oil-Free 20HP', sku: 'COMP-SC20-003', price: 5800, power: '20HP', pressure: '7bar' },
    { name: 'Centrifugal Compressor 50HP', sku: 'COMP-C50-004', price: 15000, power: '50HP', pressure: '12bar' },
    { name: 'Portable Diesel Compressor 25HP', sku: 'COMP-PD25-005', price: 6500, power: '25HP', pressure: '7bar' },
    { name: 'Variable Speed Compressor 40HP', sku: 'COMP-VS40-006', price: 12000, power: '40HP', pressure: '8bar' },
    { name: 'Medical Air Compressor 10HP', sku: 'COMP-M10-007', price: 4800, power: '10HP', pressure: '8bar' },
    { name: 'High Pressure Compressor 35HP', sku: 'COMP-HP35-008', price: 9800, power: '35HP', pressure: '40bar' }
  ],
  generators: [
    { name: 'Diesel Generator 100kVA', sku: 'GEN-D100-001', price: 15000, power: '100kVA', fuel: 'Diesel' },
    { name: 'Gas Generator 75kVA', sku: 'GEN-G75-002', price: 12500, power: '75kVA', fuel: 'Natural Gas' },
    { name: 'Portable Generator 25kVA', sku: 'GEN-P25-003', price: 3800, power: '25kVA', fuel: 'Diesel' },
    { name: 'Standby Generator 200kVA', sku: 'GEN-S200-004', price: 28000, power: '200kVA', fuel: 'Diesel' },
    { name: 'Solar Generator 50kVA', sku: 'GEN-SO50-005', price: 18000, power: '50kVA', fuel: 'Solar' },
    { name: 'Wind Generator 30kVA', sku: 'GEN-W30-006', price: 22000, power: '30kVA', fuel: 'Wind' },
    { name: 'Marine Generator 150kVA', sku: 'GEN-M150-007', price: 35000, power: '150kVA', fuel: 'Marine Diesel' },
    { name: 'Trailer Mounted Generator 80kVA', sku: 'GEN-T80-008', price: 16500, power: '80kVA', fuel: 'Diesel' }
  ]
};

async function createProduct(token, productData, categoryName) {
  try {
    // Create product
    const productOptions = {
      hostname: 'api.eu-central-1.aws.commercetools.com',
      path: '/chempilot/products',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    // Generate attributes based on category
    const attributes = [];
    if (productData.capacity) attributes.push({ name: 'capacity', value: productData.capacity });
    if (productData.power) attributes.push({ name: 'power', value: productData.power });
    if (productData.voltage) attributes.push({ name: 'voltage', value: productData.voltage });
    if (productData.pressure) attributes.push({ name: 'pressure', value: productData.pressure });
    if (productData.material) attributes.push({ name: 'material', value: productData.material });
    if (productData.type) attributes.push({ name: 'type', value: productData.type });
    if (productData.micron) attributes.push({ name: 'micron', value: productData.micron });
    if (productData.fuel) attributes.push({ name: 'fuel', value: productData.fuel });

    const productPayload = {
      productType: {
        key: 'industrial-equipment'
      },
      name: {
        'en-GB': productData.name,
        'en-US': productData.name,
        'en': productData.name
      },
      description: {
        'en-GB': `Professional ${categoryName.slice(0, -1)} for industrial applications. High-quality construction with reliable performance and long service life.`,
        'en-US': `Professional ${categoryName.slice(0, -1)} for industrial applications. High-quality construction with reliable performance and long service life.`,
        'en': `Professional ${categoryName.slice(0, -1)} for industrial applications. High-quality construction with reliable performance and long service life.`
      },
      slug: {
        'en-GB': productData.sku.toLowerCase().replace(/_/g, '-'),
        'en-US': productData.sku.toLowerCase().replace(/_/g, '-'),
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
        attributes: attributes,
        images: [{
          url: `https://via.placeholder.com/400x300/0d2340/ffffff?text=${encodeURIComponent(categoryName.toUpperCase())}`,
          label: productData.name
        }]
      },
      publish: true
    };

    const result = await makeRequest(productOptions, JSON.stringify(productPayload));
    
    if (result.id) {
      console.log(`✅ Created: ${productData.name} (${productData.sku})`);
      return { success: true, product: result };
    } else {
      console.log(`❌ Failed to create: ${productData.name} - ${result.message || 'Unknown error'}`);
      return { success: false, error: result };
    }

  } catch (error) {
    console.log(`❌ Error creating ${productData.name}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function createProductType(token) {
  try {
    const productTypeOptions = {
      hostname: 'api.eu-central-1.aws.commercetools.com',
      path: '/chempilot/product-types',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const productTypePayload = {
      key: 'industrial-equipment',
      name: 'Industrial Equipment',
      description: 'Product type for industrial machinery and equipment',
      attributes: [
        {
          name: 'capacity',
          label: { 'en': 'Capacity', 'en-GB': 'Capacity', 'en-US': 'Capacity' },
          type: { name: 'text' },
          isRequired: false,
          attributeConstraint: 'None',
          inputHint: 'SingleLine',
          isSearchable: true
        },
        {
          name: 'power',
          label: { 'en': 'Power', 'en-GB': 'Power', 'en-US': 'Power' },
          type: { name: 'text' },
          isRequired: false,
          attributeConstraint: 'None',
          inputHint: 'SingleLine',
          isSearchable: true
        },
        {
          name: 'voltage',
          label: { 'en': 'Voltage', 'en-GB': 'Voltage', 'en-US': 'Voltage' },
          type: { name: 'text' },
          isRequired: false,
          attributeConstraint: 'None',
          inputHint: 'SingleLine',
          isSearchable: true
        },
        {
          name: 'pressure',
          label: { 'en': 'Max Pressure', 'en-GB': 'Max Pressure', 'en-US': 'Max Pressure' },
          type: { name: 'text' },
          isRequired: false,
          attributeConstraint: 'None',
          inputHint: 'SingleLine',
          isSearchable: true
        },
        {
          name: 'material',
          label: { 'en': 'Material', 'en-GB': 'Material', 'en-US': 'Material' },
          type: { name: 'text' },
          isRequired: false,
          attributeConstraint: 'None',
          inputHint: 'SingleLine',
          isSearchable: true
        },
        {
          name: 'type',
          label: { 'en': 'Type', 'en-GB': 'Type', 'en-US': 'Type' },
          type: { name: 'text' },
          isRequired: false,
          attributeConstraint: 'None',
          inputHint: 'SingleLine',
          isSearchable: true
        },
        {
          name: 'micron',
          label: { 'en': 'Micron Rating', 'en-GB': 'Micron Rating', 'en-US': 'Micron Rating' },
          type: { name: 'text' },
          isRequired: false,
          attributeConstraint: 'None',
          inputHint: 'SingleLine',
          isSearchable: true
        },
        {
          name: 'fuel',
          label: { 'en': 'Fuel Type', 'en-GB': 'Fuel Type', 'en-US': 'Fuel Type' },
          type: { name: 'text' },
          isRequired: false,
          attributeConstraint: 'None',
          inputHint: 'SingleLine',
          isSearchable: true
        }
      ]
    };

    const result = await makeRequest(productTypeOptions, JSON.stringify(productTypePayload));
    
    if (result.id) {
      console.log('✅ Created product type: industrial-equipment');
      return true;
    } else {
      console.log('ℹ️  Product type may already exist or creation failed');
      return false;
    }

  } catch (error) {
    console.log('ℹ️  Product type creation skipped (may already exist)');
    return false;
  }
}

async function addMoreProducts() {
  try {
    console.log('🚀 Adding more products to CommerceTools...');
    console.log('📦 This will create 48 new products across 6 categories');
    
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
    
    // Step 2: Create product type (if it doesn't exist)
    console.log('🔧 Setting up product type...');
    await createProductType(token);
    
    // Step 3: Create products for each category
    let totalCreated = 0;
    let totalFailed = 0;
    
    for (const [categoryName, products] of Object.entries(productCategories)) {
      console.log(`\n📂 Creating ${categoryName.toUpperCase()} products...`);
      
      for (const productData of products) {
        const result = await createProduct(token, productData, categoryName);
        
        if (result.success) {
          totalCreated++;
        } else {
          totalFailed++;
        }
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`✅ Completed ${categoryName} category`);
      
      // Longer delay between categories
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n🎉 PRODUCT CREATION COMPLETED!');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Summary:`);
    console.log(`   - Products created: ${totalCreated}`);
    console.log(`   - Products failed: ${totalFailed}`);
    console.log(`   - Success rate: ${Math.round((totalCreated / (totalCreated + totalFailed)) * 100)}%`);
    console.log('');
    console.log('📋 Categories created:');
    Object.keys(productCategories).forEach((category, index) => {
      console.log(`   ${index + 1}. ${category.charAt(0).toUpperCase() + category.slice(1)} (${productCategories[category].length} products)`);
    });
    console.log('');
    console.log('✅ YOUR STORE NOW HAS PLENTY OF PRODUCTS FOR PAGINATION!');
    console.log('🔄 Refresh your homepage to see the new products');
    console.log('📄 You should now see pagination controls at the bottom');
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    console.log('📝 Check your credentials and network connection.');
  }
}

// Execute the function
addMoreProducts();