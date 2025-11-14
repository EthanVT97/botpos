import React from 'react';
import { Handle, Position } from 'reactflow';
import './NodeStyles.css';

function QuestionNode({ data }) {
  return (
    <div className="custom-node question-node">
      <div className="node-header question-header">
        <span className="node-icon">❓</span>
        <span className="node-title">{data.label || 'Question'}</span>
      </div>
      <div className="node-body">
        <p className="node-text">{data.message || 'No question set'}</p>
        {data.variable_name && (
          <div className="node-variable">
            <span className="variable-badge">→ {data.variable_name}</span>
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default QuestionNode;
