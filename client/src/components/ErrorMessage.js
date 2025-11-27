import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorMessage = ({ 
  message = 'Failed to load data', 
  onRetry,
  details 
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: '#fee2e2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px'
      }}>
        <AlertCircle size={32} color="#dc2626" />
      </div>
      
      <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: '8px'
      }}>
        {message}
      </h3>
      
      {details && (
        <p style={{
          fontSize: '14px',
          color: '#666',
          marginBottom: '16px',
          maxWidth: '400px'
        }}>
          {details}
        </p>
      )}
      
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
