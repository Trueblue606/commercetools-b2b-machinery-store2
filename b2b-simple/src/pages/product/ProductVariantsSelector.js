import { useState, useEffect } from 'react';

// Format attribute label
const formatAttributeLabel = (name) =>
  name.charAt(0).toUpperCase() + name.slice(1);

// Format attribute value
const formatAttributeValue = (value) => {
  if (typeof value === 'object' && value?.label) return value.label;
  return String(value);
};

// Skip irrelevant attributes
const shouldSkipAttribute = (name) => {
  const skipNames = ['relatedproducts', 'mobility'];
  return skipNames.includes(name.toLowerCase());
};

export default function ProductVariantsSelector({ product, onVariantChange, customer }) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({});

  const allVariants = [product.masterVariant, ...(product.variants || [])];

  // Get unique attributes and values from all variants
  const getVariantAttributes = () => {
    const attributeMap = {};
    allVariants.forEach((variant) => {
      (variant.attributes || []).forEach((attr) => {
        if (shouldSkipAttribute(attr.name)) return;
        if (!attributeMap[attr.name]) {
          attributeMap[attr.name] = {
            label: formatAttributeLabel(attr.name),
            values: new Set(),
          };
        }
        attributeMap[attr.name].values.add(attr.value);
      });
    });

    return Object.fromEntries(
      Object.entries(attributeMap).map(([name, info]) => [
        name,
        { ...info, values: Array.from(info.values) },
      ])
    );
  };

  const attributeTypes = getVariantAttributes();

  // Match variant by selected attributes
  const findMatchingVariant = (attributes) =>
    allVariants.find((variant) =>
      Object.entries(attributes).every(([attrName, attrValue]) => {
        const variantAttr = variant.attributes?.find((a) => a.name === attrName);
        return variantAttr?.value === attrValue;
      })
    );

  const handleAttributeChange = (name, value) => {
    const newAttributes = { ...selectedAttributes, [name]: value };
    setSelectedAttributes(newAttributes);

    const match = findMatchingVariant(newAttributes);
    if (match) {
      setSelectedVariant(match);
      onVariantChange?.(match);
    }
  };

  useEffect(() => {
    if (!selectedVariant && product.masterVariant) {
      setSelectedVariant(product.masterVariant);
      onVariantChange?.(product.masterVariant);
    }
  }, [product]);

  const getVariantPrice = (variant) => {
    if (!variant?.prices?.length) return 'Contact for price';
    const groupPrice = customer?.customerGroup?.id
      ? variant.prices.find((p) => p.customerGroup?.id === customer.customerGroup.id)
      : null;
    const price = groupPrice || variant.prices[0];
    return `${price.value.currencyCode} ${(price.value.centAmount / 100).toFixed(2)}`;
  };

  if (!Object.keys(attributeTypes).length) return null;

  return (
    <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 6 }}>
      <h3>Product Options</h3>

      {Object.entries(attributeTypes).map(([name, info]) => (
        <div key={name} style={{ marginBottom: 12 }}>
          <label style={{ fontWeight: 'bold' }}>{info.label}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {info.values.map((value, i) => {
              const isSelected = selectedAttributes[name] === value;
              return (
                <button
                  key={i}
                  onClick={() => handleAttributeChange(name, value)}
                  style={{
                    padding: '6px 10px',
                    border: isSelected ? '2px solid black' : '1px solid #ccc',
                    background: isSelected ? '#eee' : '#fff',
                    cursor: 'pointer',
                  }}
                >
                  {formatAttributeValue(value)}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {selectedVariant && (
        <div style={{ marginTop: 16 }}>
          <strong>Price:</strong> {getVariantPrice(selectedVariant)}
          <div>SKU: {selectedVariant.sku}</div>
        </div>
      )}
    </div>
  );
}
