import React from 'react';
import { Handle, Position } from 'reactflow';
import './NodeStyles.css';

function ConditionNode({ data }) {
  return (
    <div className="custom-node condition-node">
      <div className="node-header condition-header">
        <span className="node-icon">🔀</span>
        <span className="node-title">{data.label || 'Condition'}</span>
      </div>
      <div className="node-body">
        <p className="node-description">Branch based on condition</p>
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} id="true" style={{ top: '30%' }} />
      <Handle type="source" position={Position.Right} id="false" style={{ top: '70%' }} />
    </div>
  );
}

export default ConditionNode;
