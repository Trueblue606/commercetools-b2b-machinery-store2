// components/BenefitsContent.jsx
import React, { useState, useEffect } from 'react';
import { COLORS } from '../account';

// Benefits Data Logic Hook
const useBenefitsData = () => {
  const [benefitsData, setBenefitsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCustomerGroupDetails = async (customerGroupId, authToken) => {
    try {
      const response = await fetch(
        `https://api.eu-central-1.aws.commercetools.com/chempilot/customer-groups/${customerGroupId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const customerGroupData = await response.json();
        return customerGroupData;
      } else {
        console.error('Failed to fetch customer group:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error fetching customer group:', error);
      return null;
    }
  };

  const fetchAllCustomerGroups = async (authToken) => {
    try {
      const response = await fetch(
        `https://api.eu-central-1.aws.commercetools.com/chempilot/customer-groups?limit=100`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.results || [];
      } else {
        console.error('Failed to fetch customer groups:', response.statusText);
        return [];
      }
    } catch (error) {
      console.error('Error fetching customer groups:', error);
      return [];
    }
  };

  const fetchCustomerDiscounts = async (customerId, authToken) => {
    try {
      const response = await fetch(
        `https://api.eu-central-1.aws.commercetools.com/chempilot/discount-codes?where=isActive%3Dtrue&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.results || [];
      } else {
        console.error('Failed to fetch discounts:', response.statusText);
        return [];
      }
    } catch (error) {
      console.error('Error fetching discounts:', error);
      return [];
    }
  };

  const processBenefitsData = (customer, customerGroup, allGroups, discounts) => {
    const benefitsMap = {
      // Wholesale customers
      '48627f63-30a3-47d8-8d3d-4b1c30787a8a': {
        name: 'Wholesale Partner',
        tier: 'Premium',
        color: '#10b981',
        benefits: [
          { icon: '💰', title: 'Volume Discounts', description: 'Up to 25% off bulk orders' },
          { icon: '🚚', title: 'Free Shipping', description: 'On orders over £200' },
          { icon: '📞', title: 'Dedicated Support', description: 'Direct line to chemical specialists' },
          { icon: '📋', title: 'Custom Quotes', description: 'Tailored pricing for large orders' },
          { icon: '⚡', title: 'Priority Processing', description: 'Faster order fulfillment' },
          { icon: '📊', title: 'Analytics Dashboard', description: 'Detailed purchase insights' }
        ],
        savings: {
          thisMonth: 150.50,
          thisYear: 1840.25,
          totalLifetime: 5230.75
        }
      },
      // Retail customers
      'b2b1bafe-e36b-4d95-93c5-82ea07d7e159': {
        name: 'Retail Customer',
        tier: 'Standard',
        color: COLORS.BABY_BLUE,
        benefits: [
          { icon: '💳', title: 'Member Pricing', description: '5-10% off regular prices' },
          { icon: '🎯', title: 'Targeted Offers', description: 'Personalized chemical recommendations' },
          { icon: '📦', title: 'Standard Shipping', description: 'Reliable delivery options' },
          { icon: '💬', title: 'Customer Support', description: 'Expert help when you need it' },
          { icon: '🔄', title: 'Easy Returns', description: 'Hassle-free return policy' }
        ],
        savings: {
          thisMonth: 45.20,
          thisYear: 280.50,
          totalLifetime: 650.25
        }
      }
    };

    const currentGroupId = customer?.customerGroup?.id;
    const currentBenefits = benefitsMap[currentGroupId];

    const availableUpgrades = allGroups
      .filter(group => group.id !== currentGroupId)
      .map(group => ({
        ...group,
        benefits: benefitsMap[group.id] || { name: group.name, benefits: [] }
      }));

    const activeDiscounts = discounts.filter(discount => discount.isActive);

    return {
      currentTier: currentBenefits || {
        name: 'Standard Customer',
        tier: 'Basic',
        color: '#6b7280',
        benefits: [
          { icon: '🛍️', title: 'Shopping Access', description: 'Browse our full catalog' },
          { icon: '💬', title: 'Support', description: 'Customer service available' }
        ],
        savings: { thisMonth: 0, thisYear: 0, totalLifetime: 0 }
      },
      availableUpgrades,
      activeDiscounts: activeDiscounts.map(discount => ({
        id: discount.id,
        code: discount.code,
        name: discount.name?.['en-GB'] || discount.name?.['en'] || 'Discount',
        description: discount.description?.['en-GB'] || discount.description?.['en'] || '',
        validUntil: discount.validUntil,
        isActive: discount.isActive
      })),
      stats: {
        totalSavings: currentBenefits?.savings?.totalLifetime || 0,
        monthlyAverage: currentBenefits?.savings?.thisYear ? (currentBenefits.savings.thisYear / 12).toFixed(2) : 0,
        benefitsUsed: currentBenefits?.benefits?.length || 0
      }
    };
  };

  const fetchBenefitsData = async (customer) => {
    setLoading(true);
    setError(null);

    try {
      const authRes = await fetch('/api/auth');
      const { token } = await authRes.json();

      const [customerGroupData, allGroups, discounts] = await Promise.all([
        customer?.customerGroup?.id 
          ? fetchCustomerGroupDetails(customer.customerGroup.id, token)
          : Promise.resolve(null),
        fetchAllCustomerGroups(token),
        fetchCustomerDiscounts(customer?.id, token)
      ]);

      const benefits = processBenefitsData(customer, customerGroupData, allGroups, discounts);
      setBenefitsData(benefits);

    } catch (err) {
      setError('Failed to load benefits data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    benefitsData,
    loading,
    error,
    fetchBenefitsData,
    refreshBenefits: (customer) => fetchBenefitsData(customer)
  };
};

export default function BenefitsContent({ customer }) {
  const { benefitsData, loading, error, fetchBenefitsData } = useBenefitsData();

  useEffect(() => {
    if (customer) {
      fetchBenefitsData(customer);
    }
  }, [customer]);

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        minHeight: 'calc(100vh - 64px)',
        fontFamily: "'Outfit', sans-serif",
        padding: '40px 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '18px',
            color: '#6b7280',
            marginTop: '60px'
          }}>
            Loading your benefits...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        minHeight: 'calc(100vh - 64px)',
        fontFamily: "'Outfit', sans-serif",
        padding: '40px 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '18px',
            color: '#ef4444',
            marginTop: '60px'
          }}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!benefitsData) return null;

  const { currentTier, activeDiscounts, stats } = benefitsData;

  return (
    <div style={{
      backgroundColor: '#ffffff',
      minHeight: 'calc(100vh - 64px)',
      fontFamily: "'Outfit', sans-serif",
      padding: '40px 0'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px'
      }}>
        
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <h1 style={{ 
            fontSize: '32px',
            fontWeight: '700',
            color: COLORS.DARK_BLUE,
            marginBottom: '12px'
          }}>
            Your Benefits
          </h1>
          <p style={{ 
            color: '#6b7280',
            fontSize: '16px',
            marginBottom: '32px'
          }}>
            Exclusive perks and savings for {currentTier.name}
          </p>

          {/* Current Tier Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '8px 16px',
            borderRadius: '24px',
            fontSize: '14px',
            fontWeight: '600',
            backgroundColor: `${currentTier.color}15`,
            color: currentTier.color,
            border: `1px solid ${currentTier.color}30`
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
            {currentTier.tier} Member
          </div>

          {/* Stats Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '32px',
            marginTop: '32px',
            paddingBottom: '32px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <div>
              <p style={{
                fontSize: '32px',
                fontWeight: '700',
                color: COLORS.DARK_BLUE,
                marginBottom: '4px'
              }}>
                £{stats.totalSavings.toFixed(0)}
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>Total savings</p>
            </div>
            <div>
              <p style={{
                fontSize: '32px',
                fontWeight: '700',
                color: COLORS.DARK_BLUE,
                marginBottom: '4px'
              }}>
                £{stats.monthlyAverage}
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>Monthly average</p>
            </div>
            <div>
              <p style={{
                fontSize: '32px',
                fontWeight: '700',
                color: COLORS.DARK_BLUE,
                marginBottom: '4px'
              }}>
                {stats.benefitsUsed}
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>Active benefits</p>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '64px',
          alignItems: 'start'
        }}>
          
          {/* Left Column - Benefits */}
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: COLORS.DARK_BLUE,
              marginBottom: '24px'
            }}>
              Your Benefits
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {currentTier.benefits.map((benefit, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: '#ffffff',
                    border: `1px solid ${COLORS.BABY_BLUE}`,
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 1px 4px rgba(13, 35, 64, 0.05)',
                    transition: 'box-shadow 0.3s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(13, 35, 64, 0.15)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(13, 35, 64, 0.05)'}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: COLORS.BABY_BLUE,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    marginBottom: '16px'
                  }}>
                    {benefit.icon}
                  </div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: COLORS.DARK_BLUE,
                    marginBottom: '8px'
                  }}>
                    {benefit.title}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    lineHeight: '1.5'
                  }}>
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Active Discounts & Info */}
          <div>
            {/* Active Discounts */}
            {activeDiscounts.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: COLORS.DARK_BLUE,
                  marginBottom: '16px'
                }}>
                  Active Discounts
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {activeDiscounts.map((discount) => (
                    <div
                      key={discount.id}
                      style={{
                        padding: '16px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px'
                      }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: COLORS.DARK_BLUE
                        }}>
                          {discount.name}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          padding: '2px 8px',
                          backgroundColor: COLORS.BABY_BLUE,
                          color: COLORS.DARK_BLUE,
                          borderRadius: '12px',
                          fontWeight: '500'
                        }}>
                          {discount.code}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '13px',
                        color: '#6b7280',
                        marginBottom: '4px'
                      }}>
                        {discount.description}
                      </p>
                      {discount.validUntil && (
                        <p style={{
                          fontSize: '12px',
                          color: '#9ca3af'
                        }}>
                          Valid until {new Date(discount.validUntil).toLocaleDateString('en-GB')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upgrade Info */}
            <div style={{
              padding: '20px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px'
            }}>
              <p style={{
                fontSize: '14px',
                fontWeight: '600',
                color: COLORS.DARK_BLUE,
                marginBottom: '8px'
              }}>
                Want More Benefits?
              </p>
              <p style={{
                fontSize: '13px',
                color: '#6b7280',
                marginBottom: '12px',
                lineHeight: '1.5'
              }}>
                Contact our team to learn about upgrading your account for additional benefits and savings.
              </p>
              <a
                href="mailto:support@example.com"
                style={{
                  fontSize: '13px',
                  color: COLORS.DARK_BLUE,
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
              >
                Contact Support →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}