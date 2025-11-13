import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div style={{
      padding: '20px',
      background: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <AlertCircle size={24} color="#dc2626" />
      <div style={{ flex: 1 }}>
        <p style={{ color: '#dc2626', fontWeight: '600', marginBottom: '4px' }}>Error</p>
        <p style={{ color: '#991b1b', fontSize: '14px' }}>{message}</p>
      </div>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
