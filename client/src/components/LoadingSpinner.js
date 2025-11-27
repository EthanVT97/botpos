import React from 'react';

const LoadingSpinner = ({ message = 'Loading...', size = 'medium' }) => {
  const sizes = {
    small: { spinner: '24px', text: '12px' },
    medium: { spinner: '48px', text: '14px' },
    large: { spinner: '64px', text: '16px' }
  };

  const currentSize = sizes[size] || sizes.medium;

  return (
    <div className="loading-container">
      <div 
        className="loading-spinner"
        style={{
          width: currentSize.spinner,
          height: currentSize.spinner
        }}
      />
      {message && (
        <p className="loading-text" style={{ fontSize: currentSize.text }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
