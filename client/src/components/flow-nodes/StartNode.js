import React from 'react';
import { Handle, Position } from 'reactflow';
import './NodeStyles.css';

function StartNode({ data }) {
  return (
    <div className="custom-node start-node">
      <div className="node-header start-header">
        <span className="node-icon">▶️</span>
        <span className="node-title">Start</span>
      </div>
      <div className="node-body">
        <p className="node-description">Flow begins here</p>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default StartNode;
