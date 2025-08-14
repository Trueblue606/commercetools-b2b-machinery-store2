// components/AccountTabs.js
import { COLORS } from "../account";

export default function AccountTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'benefits', label: 'Benefits', icon: '✨' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderBottom: `1px solid ${COLORS.BABY_BLUE}`,
      position: 'sticky',
      top: '64px',
      zIndex: 10
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        gap: '32px'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: '16px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? `3px solid ${COLORS.DARK_BLUE}` : '3px solid transparent',
              color: activeTab === tab.id ? COLORS.DARK_BLUE : '#6b7280',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}