// pages/account.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from './components/navbar';
import AccountHeader from './components/AccountHeader';
import AccountTabs from './components/AccountTabs';
import DashboardContent from './components/DashboardContent';
import OrdersContent from './components/OrdersContent';
import LoadingSpinner from './components/LoadingSpinner';


export const COLORS = {
  DARK_BLUE: '#0d2340',
  BABY_BLUE: '#d7e9f7',
  LIGHT_GRAY: '#f8f9fa'
};


export default function Account() {
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);


  useEffect(() => {
    if (router.isReady && router.query.tab) {
      const validTabs = ['dashboard', 'orders', 'benefits', 'settings'];
      if (validTabs.includes(router.query.tab)) {
        setActiveTab(router.query.tab);
      }
    }
  }, [router.isReady, router.query.tab]);


  useEffect(() => {
    const stored = localStorage.getItem('customer');
    if (stored) {
      const parsedCustomer = JSON.parse(stored);
      setCustomer(parsedCustomer);
      fetchCustomerDetails(parsedCustomer.id);
      fetchOrders(parsedCustomer.email);
    } else {
      router.push('/login');
    }
  }, []);


  const handleTabChange = (tab) => {
    setActiveTab(tab);
    router.push(`/account?tab=${tab}`, undefined, { shallow: true });
  };


  const getAuthToken = async () => {
    const authRes = await fetch('/api/auth');
    const { token } = await authRes.json();
    return token;
  };


  const fetchCustomerDetails = async (customerId) => {
    try {
      const token = await getAuthToken();
      const customerRes = await fetch(
        `https://api.eu-central-1.aws.commercetools.com/chempilot/customers/${customerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );


      if (customerRes.ok) {
        const data = await customerRes.json();
        setCustomerDetails(data);
      }
    } catch (error) {
      console.error('Error fetching customer details:', error);
    } finally {
      setLoading(false);
    }
  };


  const fetchOrders = async (customerEmail) => {
    setOrdersLoading(true);
    try {
      const token = await getAuthToken();
      const ordersRes = await fetch(
        `https://api.eu-central-1.aws.commercetools.com/chempilot/orders?where=customerEmail="${customerEmail}"&sort=createdAt desc&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );


      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data.results || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };


  const handleSignOut = () => {
    localStorage.removeItem('customer');
    router.push('/');
  };


  if (!customer || loading) {
    return (
      <>
        <Navbar hideBenefitsBar={true} />
        <LoadingSpinner />
      </>
    );
  }


  return (
    <>
      <Navbar hideBenefitsBar={true} />
      <div style={{
        minHeight: 'calc(100vh - 64px)',
        fontFamily: "'Outfit', sans-serif"
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '16px 24px'

        }}>
          {activeTab === 'dashboard' && (
            <DashboardContent 
              customer={customer}
              orders={orders}
              onTabChange={handleTabChange}
            />
          )}
          
          {activeTab === 'orders' && (
            <OrdersContent 
              orders={orders}
              ordersLoading={ordersLoading}
            />
          )}
          
          {activeTab === 'benefits' && (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <h2>Benefits Coming Soon</h2>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <h2>Settings Coming Soon</h2>
            </div>
          )}
        </div>
      </div>
    </>
  );
}