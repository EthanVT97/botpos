import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorMessage = ({ 
  message = 'Failed to load data', 
  onRetry,
  details 
}) => {
  return (
    <div className="error-message">
      <div className="error-message-icon">
        <AlertCircle size={24} />
      </div>
      
      <div className="error-message-content">
        <h3 className="error-message-title">
          {message}
        </h3>
        
        {details && (
          <p className="error-message-text">
            {details}
          </p>
        )}
        
        {onRetry && (
          <div className="error-message-action">
            <button onClick={onRetry} className="btn btn-primary">
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
