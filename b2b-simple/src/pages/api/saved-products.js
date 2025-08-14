import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { COLORS } from '../account';
import { useCart } from '../contexts/CartContext';

export default function DashboardContent({ customer, orders = [], onTabChange }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [savedProducts, setSavedProducts] = useState([]);
  const [reordering, setReordering] = useState({});

  const customerFirstName = customer?.firstName || 'there';
  const safeOrders = Array.isArray(orders) ? orders : [];
  const recentOrders = safeOrders.slice(0, 3);

  // ✅ Fetch saved products from Commercetools shopping list
  useEffect(() => {
    const fetchSavedProducts = async () => {
      try {
        const res = await fetch(`/api/commercetools/shopping-list?customerId=${customer?.id}`);
        const data = await res.json();

        // Extract product details safely
        if (data?.results?.length) {
          const products = data.results.flatMap(list =>
            (list.lineItems || []).map(item => ({
              id: item.productId,
              sku: item.variant?.sku || '',
              name: item.name?.en || '',
              image: item.variant?.images?.[0]?.url || '',
              prices: item.variant?.prices || []
            }))
          );
          setSavedProducts(products.slice(0, 3));
        } else {
          setSavedProducts([]);
        }
      } catch (error) {
        console.error('Failed to fetch saved products', error);
        setSavedProducts([]);
      }
    };

    if (customer?.id) {
      fetchSavedProducts();
    }
  }, [customer]);

  const thisMonthOrders = safeOrders.filter(order => {
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
  });
  const monthlySpend = thisMonthOrders.reduce((sum, order) => sum + (order.totalPrice?.centAmount || 0), 0) / 100;

  const formatOrderStatus = (orderState) => {
    const statusMap = {
      'Open': { label: 'Processing', color: COLORS.BABY_BLUE },
      'Complete': { label: 'Delivered', color: '#10b981' },
      'Confirmed': { label: 'Confirmed', color: COLORS.BABY_BLUE },
      'Cancelled': { label: 'Cancelled', color: '#ef4444' }
    };
    return statusMap[orderState] || { label: orderState, color: '#6b7280' };
  };

  const handleQuickReorder = async (order) => {
    const orderId = order.id;
    setReordering(prev => ({ ...prev, [orderId]: true }));
    try {
      if (order.lineItems?.length > 0) {
        for (const item of order.lineItems) {
          await addToCart(item.productId, item.variant?.id || 1, item.quantity);
        }
        alert(`✅ ${order.lineItems.length} items from Order #${order.orderNumber} added to cart!`);
      }
    } catch (error) {
      console.error('Quick reorder failed:', error);
    } finally {
      setReordering(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleAddSavedToCart = async (product) => {
    const productId = product.id;
    setReordering(prev => ({ ...prev, [`saved-${productId}`]: true }));
    try {
      await addToCart(product.id, 1, 1);
      alert(`✅ ${product.name} added to cart!`);
    } catch (error) {
      console.error('Failed to add saved product to cart:', error);
    } finally {
      setReordering(prev => ({ ...prev, [`saved-${productId}`]: false }));
    }
  };

  const getPrice = (prices, customer) => {
    if (!Array.isArray(prices) || prices.length === 0) return 'Contact for price';

    if (customer?.customerGroup?.id) {
      const groupPrice = prices.find(p => p.customerGroup?.id === customer.customerGroup.id);
      if (groupPrice) {
        const priceValue = groupPrice.discounted?.value || groupPrice.value;
        return `${priceValue.currencyCode} ${(priceValue.centAmount / 100).toFixed(2)}`;
      }
    }

    const basePrice = prices.find(p => !p.customerGroup);
    if (basePrice) {
      const priceValue = basePrice.discounted?.value || basePrice.value;
      return `${priceValue.currencyCode} ${(priceValue.centAmount / 100).toFixed(2)}`;
    }

    return 'Contact for price';
  };

  const calculateTotalSavings = () => {
    if (!customer?.customerGroup?.id) return 0;

    let totalSavings = 0;
    const discountRate = customer.customerGroup.id === 'b2b1bafe-e36b-4d95-93c5-82ea07d7e159' ? 0.15 : 0.05;

    safeOrders.forEach(order => {
      const orderTotal = (order.totalPrice?.centAmount || 0) / 100;
      totalSavings += orderTotal * discountRate;
    });

    return totalSavings;
  };

  const actualSavings = calculateTotalSavings();

  const getCustomerBenefits = () => {
    const benefitsMap = {
      'b2b1bafe-e36b-4d95-93c5-82ea07d7e159': {
        name: 'Contract',
        tier: 'Premium',
        color: '#10b981',
        topBenefits: [
          { icon: '💰', title: 'Volume Discounts', description: 'Up to 25% off bulk orders' },
          { icon: '🚚', title: 'Free Shipping', description: 'On orders over £200' },
          { icon: '📞', title: 'Dedicated Support', description: 'Priority customer service' }
        ],
        totalSavings: actualSavings
      },
      '48627f63-30a3-47d8-8d3d-4b1c30787a8a': {
        name: 'ASM',
        tier: 'Premium',
        color: COLORS.BABY_BLUE,
        topBenefits: [
          { icon: '💳', title: 'Area Sales Manager Pricing', description: '5-10% off regular prices' },
          { icon: '🎯', title: 'Targeted Offers', description: 'Personalized recommendations' },
          { icon: '📦', title: 'Premium Shipping', description: 'Reliable delivery options' }
        ],
        totalSavings: actualSavings
      }
    };

    return benefitsMap[customer?.customerGroup?.id] || {
      name: 'Catalogue',
      tier: 'Standard',
      color: '#6b7280',
      topBenefits: [
        { icon: '🛍️', title: 'Shopping Access', description: 'Browse our full catalog' },
        { icon: '💬', title: 'Fast Shipping', description: 'Delivery is faster' },
        { icon: '🎯', title: 'Offers/Discounts', description: 'On certain products' }
      ],
      totalSavings: 0
    };
  };

  const customerBenefits = getCustomerBenefits();

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: 'calc(100vh - 64px)', fontFamily: "'Outfit', sans-serif", padding: '40px 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <h1>Welcome back, {customerFirstName}</h1>

        {/* Saved Products */}
        <h2 style={{ marginTop: '40px' }}>Saved Products</h2>
        {Array.isArray(savedProducts) && savedProducts.length > 0 ? (
          savedProducts.map(product => {
            const isAdding = reordering[`saved-${product.id}`];
            return (
              <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' }}>
                <span>{product.name} — {getPrice(product.prices, customer)}</span>
                <button onClick={() => handleAddSavedToCart(product)} disabled={isAdding}>
                  {isAdding ? 'Adding...' : 'Add to Cart'}
                </button>
              </div>
            );
          })
        ) : (
          <p>No saved products yet.</p>
        )}
      </div>
    </div>
  );
}
