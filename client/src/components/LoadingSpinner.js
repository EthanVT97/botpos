import React from 'react';

const LoadingSpinner = ({ size = 40, color = '#6366f1', fullScreen = false }) => {
  const spinner = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        border: `4px solid rgba(99, 102, 241, 0.1)`,
        borderTop: `4px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <div style={{
        fontSize: '14px',
        color: '#6b7280',
        fontWeight: '500'
      }}>
        Loading...
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999
      }}>
        {spinner}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px'
    }}>
      {spinner}
    </div>
  );
};

export default LoadingSpinner;
