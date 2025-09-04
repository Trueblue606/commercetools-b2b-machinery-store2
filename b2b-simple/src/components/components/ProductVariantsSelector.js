// Enhanced Product Variants Selector Component
function ProductVariantsSelector({ product, onVariantChange, customer }) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({});

  // Get all variants (master + other variants)
  const allVariants = [product.masterVariant, ...(product.variants || [])];

  // Extract unique attribute types and their values
  const getVariantAttributes = () => {
    const attributeMap = {};
    
    allVariants.forEach(variant => {
      if (variant.attributes) {
        variant.attributes.forEach(attr => {
          if (shouldSkipAttribute(attr.name, attr.value)) {
            return;
          }

          if (!attributeMap[attr.name]) {
            attributeMap[attr.name] = {
              name: attr.name,
              label: formatAttributeLabel(attr.name),
              values: new Set()
            };
          }
          attributeMap[attr.name].values.add(attr.value);
        });
      }
    });

    // Convert Sets to Arrays and sort
    Object.keys(attributeMap).forEach(key => {
      attributeMap[key].values = Array.from(attributeMap[key].values).sort();
    });

    return attributeMap;
  };

  const shouldSkipAttribute = (name, value) => {
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value) && value.some(v => typeof v === 'object')) {
        return true;
      }
      if (!Array.isArray(value) && !value.label && !value.name && !value.key && !value.value) {
        return true;
      }
    }
    
    const skipNames = ['relatedproducts', 'relatedProducts', 'id', 'key'];
    if (skipNames.includes(name.toLowerCase())) {
      return true;
    }
    
    return false;
  };

  const formatAttributeLabel = (name) => {
    const labelMap = {
      'size': 'Size',
      'color': 'Color', 
      'material': 'Material',
      'capacity': 'Capacity',
      'voltage': 'Voltage',
      'power': 'Power Rating',
      'model': 'Model',
      'type': 'Type',
      'diameter': 'Diameter',
      'length': 'Length',
      'pressure': 'Max Pressure',
      'temperature': 'Operating Temperature',
      'iso45001': 'ISO 45001 Certified',
      'mobility': 'Mobility Options'
    };
    return labelMap[name.toLowerCase()] || name.charAt(0).toUpperCase() + name.slice(1);
  };

  const formatAttributeValue = (name, value) => {
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      
      if (value.label) return value.label;
      if (value.name) return value.name;
      if (value.key) return value.key;
      if (value.value) return value.value;
      
      const objectKeys = Object.keys(value);
      if (objectKeys.length === 1) {
        return String(value[objectKeys[0]]);
      }
      
      const pairs = objectKeys.slice(0, 2).map(key => `${key}: ${value[key]}`);
      return pairs.join(', ');
    }
    
    // Handle units
    const unitMap = {
      'voltage': 'V',
      'power': 'W',
      'capacity': 'L',
      'pressure': ' bar',
      'temperature': '°C',
      'diameter': 'mm',
      'length': 'mm'
    };
    
    if (typeof value === 'number' && unitMap[name]) {
      return `${value}${unitMap[name]}`;
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    return String(value);
  };

  const attributeTypes = getVariantAttributes();

  // Find variant that matches selected attributes  
  const findMatchingVariant = (attributes) => {
    return allVariants.find(variant => {
      if (!variant.attributes) return Object.keys(attributes).length === 0;
      
      return Object.entries(attributes).every(([attrName, attrValue]) => {
        const variantAttr = variant.attributes.find(a => a.name === attrName);
        if (!variantAttr) return false;
        
        if (typeof attrValue === 'object' && typeof variantAttr.value === 'object') {
          return JSON.stringify(attrValue) === JSON.stringify(variantAttr.value);
        }
        
        return variantAttr.value === attrValue;
      });
    });
  };

  // Handle attribute selection
  const handleAttributeChange = (attributeName, value) => {
    const newAttributes = { ...selectedAttributes, [attributeName]: value };
    setSelectedAttributes(newAttributes);
    
    const matchingVariant = findMatchingVariant(newAttributes);
    if (matchingVariant) {
      setSelectedVariant(matchingVariant);
      onVariantChange(matchingVariant);
    }
  };

  // Initialize with master variant
  useEffect(() => {
    if (!selectedVariant && product.masterVariant) {
      setSelectedVariant(product.masterVariant);
      onVariantChange(product.masterVariant);
      
      if (product.masterVariant.attributes) {
        const initialAttributes = {};
        product.masterVariant.attributes.forEach(attr => {
          if (!shouldSkipAttribute(attr.name, attr.value)) {
            initialAttributes[attr.name] = attr.value;
          }
        });
        setSelectedAttributes(initialAttributes);
      }
    }
  }, [product]);

  // Get price for variant
  const getVariantPrice = (variant) => {
    if (!variant?.prices || variant.prices.length === 0) return 'Contact for price';

    let selectedPrice = null;

    if (customer?.customerGroup?.id) {
      selectedPrice = variant.prices.find(p => p.customerGroup?.id === customer.customerGroup.id);
    }

    if (!selectedPrice) {
      selectedPrice = variant.prices.find(p => !p.customerGroup);
    }

    if (selectedPrice) {
      const priceValue = selectedPrice.discounted?.value || selectedPrice.value;
      return `${priceValue.currencyCode} ${(priceValue.centAmount / 100).toFixed(2)}`;
    }

    return 'Contact for price';
  };

  // Check stock availability
  const getStockStatus = (variant) => {
    if (!variant.availability) {
      return { status: 'unknown', message: 'Stock status unknown', color: '#6b7280' };
    }

    const { isOnStock, availableQuantity } = variant.availability;
    
    if (isOnStock && availableQuantity > 10) {
      return { status: 'in-stock', message: 'In Stock', color: '#10b981' };
    } else if (isOnStock && availableQuantity > 0) {
      return { status: 'limited', message: `Limited Stock (${availableQuantity})`, color: '#f59e0b' };
    } else {
      return { status: 'out-of-stock', message: 'Out of Stock', color: '#ef4444' };
    }
  };

  // Check if attribute combination is available
  const isAttributeValueAvailable = (attributeName, value) => {
    const testAttributes = { ...selectedAttributes, [attributeName]: value };
    const variant = findMatchingVariant(testAttributes);
    return variant !== undefined && variant.availability?.isOnStock !== false;
  };

  if (Object.keys(attributeTypes).length === 0) {
    return null;
  }

  const stockInfo = getStockStatus(selectedVariant);

  return (
    <div style={{
      marginBottom: '32px',
      padding: '20px',
      backgroundColor: '#fafbfc',
      borderRadius: '8px',
      border: '1px solid #e2e8f0'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '20px'
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d2340" strokeWidth="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
        </svg>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#0d2340',
          margin: 0
        }}>
          Product Options
        </h3>
      </div>

      {/* Attribute Selectors - Cleaner Layout */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px',
        marginBottom: '20px'
      }}>
        {Object.entries(attributeTypes).map(([attributeName, attributeInfo]) => (
          <div key={attributeName}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              {attributeInfo.label}
            </label>
            
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px'
            }}>
              {attributeInfo.values.map((value) => {
                const isSelected = selectedAttributes[attributeName] === value;
                const isAvailable = isAttributeValueAvailable(attributeName, value);
                
                return (
                  <button
                    key={value}
                    onClick={() => handleAttributeChange(attributeName, value)}
                    disabled={!isAvailable}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: isSelected ? '#0d2340' : (isAvailable ? '#ffffff' : '#f8f9fa'),
                      color: isSelected ? '#ffffff' : (isAvailable ? '#374151' : '#9ca3af'),
                      border: `1px solid ${isSelected ? '#0d2340' : (isAvailable ? '#d1d5db' : '#e5e7eb')}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: isAvailable ? 'pointer' : 'not-allowed',
                      transition: 'all 0.15s ease',
                      fontFamily: "'Outfit', sans-serif",
                      position: 'relative',
                      opacity: isAvailable ? 1 : 0.6
                    }}
                    onMouseEnter={e => {
                      if (isAvailable && !isSelected) {
                        e.currentTarget.style.borderColor = '#0d2340';
                        e.currentTarget.style.backgroundColor = '#f8fafe';
                      }
                    }}
                    onMouseLeave={e => {
                      if (isAvailable && !isSelected) {
                        e.currentTarget.style.borderColor = '#d1d5db';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }
                    }}
                  >
                    {formatAttributeValue(attributeName, value)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Variant Summary - More Compact */}
      {selectedVariant && (
        <div style={{
          padding: '14px',
          backgroundColor: '#ffffff',
          borderRadius: '6px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px'
              }}>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#0d2340'
                }}>
                  {getVariantPrice(selectedVariant)}
                </span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: stockInfo.color
                  }}></div>
                  <span style={{
                    fontSize: '11px',
                    color: stockInfo.color,
                    fontWeight: '500'
                  }}>
                    {stockInfo.message}
                  </span>
                </div>
              </div>
              <span style={{
                fontSize: '11px',
                color: '#6b7280'
              }}>
                SKU: {selectedVariant.sku || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default function __noop(){ return null }
