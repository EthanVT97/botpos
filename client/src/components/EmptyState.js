import React from 'react';

const EmptyState = ({ 
  icon = '📊',
  title = 'No data available',
  subtitle = 'There is no data to display',
  action
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '64px',
        marginBottom: '16px',
        opacity: 0.8
      }}>
        {icon}
      </div>
      
      <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: '8px'
      }}>
        {title}
      </h3>
      
      <p style={{
        fontSize: '14px',
        color: '#9ca3af',
        marginBottom: action ? '20px' : 0,
        maxWidth: '400px'
      }}>
        {subtitle}
      </p>
      
      {action && action}
    </div>
  );
};

export default EmptyState;
