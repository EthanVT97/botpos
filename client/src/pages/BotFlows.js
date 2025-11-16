import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import './BotFlows.css';

function BotFlows() {
  const navigate = useNavigate();
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFlow, setNewFlow] = useState({
    name: '',
    description: '',
    channel: 'all',
    trigger_type: 'keyword',
    trigger_value: ''
  });

  useEffect(() => {
    fetchFlows();
  }, []);

  const fetchFlows = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bot-flows');
      setFlows(response.data?.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load bot flows');
      console.error('Error loading flows:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFlow = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/bot-flows', newFlow);
      setFlows([response.data.data, ...flows]);
      setShowCreateModal(false);
      setNewFlow({
        name: '',
        description: '',
        channel: 'all',
        trigger_type: 'keyword',
        trigger_value: ''
      });
      setError('');
      // Navigate to flow builder
      navigate(`/bot-flows/${response.data.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create flow');
      console.error('Error creating flow:', err);
    }
  };

  const handleDeleteFlow = async (id) => {
    if (!window.confirm('Are you sure you want to delete this flow?')) {
      return;
    }

    try {
      await api.delete(`/bot-flows/${id}`);
      setFlows(flows.filter(f => f.id !== id));
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete flow');
      console.error('Error deleting flow:', err);
    }
  };

  const handleToggleActive = async (flow) => {
    try {
      await api.put(`/bot-flows/${flow.id}`, {
        ...flow,
        is_active: !flow.is_active
      });
      setFlows(flows.map(f => 
        f.id === flow.id ? { ...f, is_active: !f.is_active } : f
      ));
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update flow');
      console.error('Error updating flow:', err);
    }
  };

  const handleDuplicateFlow = async (id) => {
    try {
      const response = await api.post(`/bot-flows/${id}/duplicate`);
      setFlows([response.data.data, ...flows]);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to duplicate flow');
      console.error('Error duplicating flow:', err);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bot-flows-page">
      <div className="page-header">
        <div>
          <h1>🤖 Bot Flows</h1>
          <p>Create and manage conversational flows for your bots</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + Create Flow
        </button>
      </div>

      {error && <ErrorMessage message={error} onClose={() => setError('')} />}

      <div className="flows-grid">
        {flows.map(flow => (
          <div key={flow.id} className="flow-card">
            <div className="flow-card-header">
              <div>
                <h3>{flow.name}</h3>
                <p className="flow-description">{flow.description}</p>
              </div>
              <div className="flow-status">
                <span className={`status-badge ${flow.is_active ? 'active' : 'inactive'}`}>
                  {flow.is_active ? '● Active' : '○ Inactive'}
                </span>
              </div>
            </div>

            <div className="flow-meta">
              <div className="meta-item">
                <span className="meta-label">Channel:</span>
                <span className="meta-value">
                  {flow.channel === 'all' ? '🌐 All' : 
                   flow.channel === 'telegram' ? '✈️ Telegram' :
                   flow.channel === 'viber' ? '💜 Viber' : '💬 Messenger'}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Trigger:</span>
                <span className="meta-value">
                  {flow.trigger_type === 'command' ? '/' : '🔑'} {flow.trigger_value || 'Any'}
                </span>
              </div>
            </div>

            <div className="flow-actions">
              <button 
                className="btn btn-sm btn-primary"
                onClick={() => navigate(`/bot-flows/${flow.id}`)}
              >
                ✏️ Edit
              </button>
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => handleToggleActive(flow)}
              >
                {flow.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
              </button>
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => handleDuplicateFlow(flow.id)}
              >
                📋 Duplicate
              </button>
              <button 
                className="btn btn-sm btn-danger"
                onClick={() => handleDeleteFlow(flow.id)}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}

        {flows.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🤖</div>
            <h3>No Bot Flows Yet</h3>
            <p>Create your first conversational flow to automate customer interactions</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              Create Your First Flow
            </button>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Bot Flow</h2>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateFlow}>
              <div className="form-group">
                <label>Flow Name *</label>
                <input
                  type="text"
                  value={newFlow.name}
                  onChange={e => setNewFlow({ ...newFlow, name: e.target.value })}
                  placeholder="e.g., Welcome Flow"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newFlow.description}
                  onChange={e => setNewFlow({ ...newFlow, description: e.target.value })}
                  placeholder="Describe what this flow does..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Channel</label>
                <select
                  value={newFlow.channel}
                  onChange={e => setNewFlow({ ...newFlow, channel: e.target.value })}
                >
                  <option value="all">All Channels</option>
                  <option value="telegram">Telegram</option>
                  <option value="viber">Viber</option>
                  <option value="messenger">Messenger</option>
                </select>
              </div>

              <div className="form-group">
                <label>Trigger Type</label>
                <select
                  value={newFlow.trigger_type}
                  onChange={e => setNewFlow({ ...newFlow, trigger_type: e.target.value })}
                >
                  <option value="keyword">Keyword</option>
                  <option value="command">Command</option>
                  <option value="welcome">Welcome Message</option>
                </select>
              </div>

              <div className="form-group">
                <label>Trigger Value</label>
                <input
                  type="text"
                  value={newFlow.trigger_value}
                  onChange={e => setNewFlow({ ...newFlow, trigger_value: e.target.value })}
                  placeholder={newFlow.trigger_type === 'command' ? '/start' : 'hello'}
                />
                <small>
                  {newFlow.trigger_type === 'command' 
                    ? 'Enter command (e.g., /start, /help)'
                    : 'Enter keyword that triggers this flow'}
                </small>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Flow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BotFlows;
