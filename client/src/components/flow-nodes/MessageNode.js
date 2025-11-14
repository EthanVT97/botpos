import React from 'react';
import { Handle, Position } from 'reactflow';
import './NodeStyles.css';

function MessageNode({ data }) {
  return (
    <div className="custom-node message-node">
      <div className="node-header message-header">
        <span className="node-icon">💬</span>
        <span className="node-title">{data.label || 'Message'}</span>
      </div>
      <div className="node-body">
        <p className="node-text">{data.message || 'No message set'}</p>
        {data.buttons && data.buttons.length > 0 && (
          <div className="node-buttons">
            {data.buttons.slice(0, 3).map((btn, i) => (
              <span key={i} className="node-button">{btn}</span>
            ))}
            {data.buttons.length > 3 && <span className="node-button">+{data.buttons.length - 3}</span>}
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default MessageNode;
