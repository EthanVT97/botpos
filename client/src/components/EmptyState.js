import React from 'react';

const EmptyState = ({ 
  icon = '📊',
  title = 'No data available',
  subtitle = 'There is no data to display',
  action
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon}
      </div>
      
      <h3 className="empty-state-title">
        {title}
      </h3>
      
      <p className="empty-state-subtitle">
        {subtitle}
      </p>
      
      {action && (
        <div className="empty-state-action">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
