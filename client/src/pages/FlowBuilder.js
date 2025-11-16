import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import './FlowBuilder.css';

// Custom node types
import MessageNode from '../components/flow-nodes/MessageNode';
import QuestionNode from '../components/flow-nodes/QuestionNode';
import ActionNode from '../components/flow-nodes/ActionNode';
import ConditionNode from '../components/flow-nodes/ConditionNode';
import StartNode from '../components/flow-nodes/StartNode';

const nodeTypes = {
  start: StartNode,
  message: MessageNode,
  question: QuestionNode,
  action: ActionNode,
  condition: ConditionNode,
};

function FlowBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [flow, setFlow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [showNodePanel, setShowNodePanel] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFlow();
  }, [id]);

  const fetchFlow = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/bot-flows/${id}`);
      const flowData = response.data.data;
      
      if (!flowData) {
        throw new Error('Flow data not found');
      }
      
      setFlow(flowData);

      // Convert database nodes to ReactFlow nodes
      const reactFlowNodes = Array.isArray(flowData.nodes) 
        ? flowData.nodes.map(node => ({
            id: node.node_id,
            type: node.node_type,
            position: { x: node.position_x || 0, y: node.position_y || 0 },
            data: {
              label: node.label || 'Untitled',
              ...(node.config || {})
            }
          }))
        : [];

      // Convert database connections to ReactFlow edges
      const reactFlowEdges = Array.isArray(flowData.connections)
        ? flowData.connections.map((conn, index) => ({
            id: `e${conn.source_node_id}-${conn.target_node_id}-${index}`,
            source: conn.source_node_id,
            target: conn.target_node_id,
            label: conn.label || '',
            type: 'smoothstep',
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
            data: {
              condition_type: conn.condition_type || 'always',
              condition_value: conn.condition_value || null
            }
          }))
        : [];

      setNodes(reactFlowNodes);
      setEdges(reactFlowEdges);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load flow');
      console.error('Error loading flow:', err);
    } finally {
      setLoading(false);
    }
  };

  const onConnect = useCallback(
    (params) => {
      const edge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        data: {
          condition_type: 'always'
        }
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  const addNode = (type) => {
    const newNode = {
      id: `node_${Date.now()}`,
      type,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: {
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
        message: type === 'message' || type === 'question' ? 'Enter your message here...' : '',
        action: type === 'action' ? 'show_products' : '',
        variable_name: type === 'question' ? 'user_response' : ''
      }
    };
    setNodes((nds) => [...nds, newNode]);
    setShowNodePanel(false);
  };

  const onNodeClick = (event, node) => {
    setSelectedNode(node);
  };

  const updateNodeData = (nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...newData
            }
          };
        }
        return node;
      })
    );
  };

  const deleteNode = (nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
  };

  const saveFlow = async () => {
    try {
      setSaving(true);
      await api.post(`/bot-flows/${id}/save`, {
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data
        })),
        connections: edges.map(edge => ({
          source: edge.source,
          target: edge.target,
          label: edge.label,
          data: edge.data
        }))
      });
      alert('Flow saved successfully!');
      setError('');
    } catch (err) {
      setError('Failed to save flow');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flow-builder">
      <div className="flow-builder-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/bot-flows')}>
            ← Back
          </button>
          <div>
            <h1>{flow?.name}</h1>
            <p>{flow?.description}</p>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => setShowNodePanel(!showNodePanel)}
          >
            + Add Node
          </button>
          <button 
            className="btn btn-primary"
            onClick={saveFlow}
            disabled={saving}
          >
            {saving ? 'Saving...' : '💾 Save Flow'}
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} onClose={() => setError('')} />}

      <div className="flow-builder-content">
        <div className="flow-canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background variant="dots" gap={12} size={1} />
          </ReactFlow>
        </div>

        {showNodePanel && (
          <div className="node-panel">
            <h3>Add Node</h3>
            <div className="node-types">
              <button className="node-type-btn" onClick={() => addNode('message')}>
                <span className="node-icon">💬</span>
                <span>Message</span>
                <small>Send a message</small>
              </button>
              <button className="node-type-btn" onClick={() => addNode('question')}>
                <span className="node-icon">❓</span>
                <span>Question</span>
                <small>Ask for input</small>
              </button>
              <button className="node-type-btn" onClick={() => addNode('action')}>
                <span className="node-icon">⚡</span>
                <span>Action</span>
                <small>Perform action</small>
              </button>
              <button className="node-type-btn" onClick={() => addNode('condition')}>
                <span className="node-icon">🔀</span>
                <span>Condition</span>
                <small>Branch logic</small>
              </button>
            </div>
          </div>
        )}

        {selectedNode && (
          <div className="node-editor">
            <div className="editor-header">
              <h3>Edit Node</h3>
              <button 
                className="btn-close"
                onClick={() => setSelectedNode(null)}
              >
                ×
              </button>
            </div>

            <div className="editor-content">
              <div className="form-group">
                <label>Label</label>
                <input
                  type="text"
                  value={selectedNode.data.label || ''}
                  onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                />
              </div>

              {(selectedNode.type === 'message' || selectedNode.type === 'question') && (
                <div className="form-group">
                  <label>Message</label>
                  <textarea
                    value={selectedNode.data.message || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { message: e.target.value })}
                    rows="4"
                    placeholder="Enter message text..."
                  />
                  <small>Use {'{'}{'{'} variable_name {'}'}{'}'}  for variables</small>
                </div>
              )}

              {selectedNode.type === 'question' && (
                <div className="form-group">
                  <label>Variable Name</label>
                  <input
                    type="text"
                    value={selectedNode.data.variable_name || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { variable_name: e.target.value })}
                    placeholder="e.g., user_name"
                  />
                  <small>Store user response in this variable</small>
                </div>
              )}

              {selectedNode.type === 'action' && (
                <div className="form-group">
                  <label>Action Type</label>
                  <select
                    value={selectedNode.data.action || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { action: e.target.value })}
                  >
                    <option value="show_products">Show Products</option>
                    <option value="show_orders">Show Orders</option>
                    <option value="create_order">Create Order</option>
                    <option value="send_email">Send Email</option>
                  </select>
                </div>
              )}

              {(selectedNode.type === 'message' || selectedNode.type === 'question') && (
                <div className="form-group">
                  <label>Buttons (one per line)</label>
                  <textarea
                    value={selectedNode.data.buttons?.join('\n') || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { 
                      buttons: e.target.value.split('\n').filter(b => b.trim()) 
                    })}
                    rows="3"
                    placeholder="Button 1&#10;Button 2&#10;Button 3"
                  />
                </div>
              )}

              <button 
                className="btn btn-danger btn-block"
                onClick={() => deleteNode(selectedNode.id)}
              >
                🗑️ Delete Node
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FlowBuilder;
