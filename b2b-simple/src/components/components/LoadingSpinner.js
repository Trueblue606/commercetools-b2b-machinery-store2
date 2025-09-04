// components/LoadingSpinner.js
import { COLORS } from "../account";

export default function LoadingSpinner() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: 'calc(100vh - 64px)',
      backgroundColor: COLORS.LIGHT_GRAY,
      fontFamily: "'Outfit', sans-serif"
    }}>
      <div style={{
        display: 'inline-block',
        width: '50px',
        height: '50px',
        border: `4px solid ${COLORS.BABY_BLUE}`,
        borderTop: `4px solid ${COLORS.DARK_BLUE}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}