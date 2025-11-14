import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div style={{
      padding: '24px',
      background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
      border: '2px solid #fca5a5',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
      animation: 'slideIn 0.3s ease'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: 'rgba(220, 38, 38, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <AlertCircle size={28} color="#dc2626" />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ 
          color: '#dc2626', 
          fontWeight: '700', 
          marginBottom: '6px',
          fontSize: '16px'
        }}>
          Error Occurred
        </p>
        <p style={{ 
          color: '#991b1b', 
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
          {message || 'Something went wrong. Please try again.'}
        </p>
      </div>
      {onRetry && (
        <button 
          className="btn btn-danger" 
          onClick={onRetry}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px'
          }}
        >
          <RefreshCw size={16} />
          Retry
        </button>
      )}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ErrorMessage;
