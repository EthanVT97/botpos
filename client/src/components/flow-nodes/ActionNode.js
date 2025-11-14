import React from 'react';
import { Handle, Position } from 'reactflow';
import './NodeStyles.css';

function ActionNode({ data }) {
  const getActionLabel = (action) => {
    const labels = {
      show_products: '🛍️ Show Products',
      show_orders: '📦 Show Orders',
      create_order: '✅ Create Order',
      send_email: '📧 Send Email'
    };
    return labels[action] || action;
  };

  return (
    <div className="custom-node action-node">
      <div className="node-header action-header">
        <span className="node-icon">⚡</span>
        <span className="node-title">{data.label || 'Action'}</span>
      </div>
      <div className="node-body">
        <p className="node-action">{getActionLabel(data.action)}</p>
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default ActionNode;
