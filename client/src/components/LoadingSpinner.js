import React from 'react';

const LoadingSpinner = ({ message = 'Loading...', size = 'medium' }) => {
  const sizes = {
    small: { spinner: '24px', text: '12px' },
    medium: { spinner: '48px', text: '14px' },
    large: { spinner: '64px', text: '16px' }
  };

  const currentSize = sizes[size] || sizes.medium;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      gap: '16px'
    }}>
      <div style={{
        width: currentSize.spinner,
        height: currentSize.spinner,
        border: '4px solid #e5e7eb',
        borderTopColor: '#3b82f6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      {message && (
        <p style={{
          color: '#666',
          fontSize: currentSize.text,
          margin: 0
        }}>
          {message}
        </p>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
