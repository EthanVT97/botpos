import React, { useState, useEffect } from 'react';
import { Plus, ArrowRight, Check, X, Clock, Package, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/api';
import './StoreTransfers.css';

const StoreTransfers = () => {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    from_store_id: '',
    to_store_id: '',
    notes: '',
    items: []
  });
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transfersRes, storesRes, productsRes] = await Promise.all([
        api.get(`/store-transfers${filterStatus !== 'all' ? `?status=${filterStatus}` : ''}`),
        api.get('/stores'),
        api.get('/products')
      ]);

      if (transfersRes.data.success) setTransfers(transfersRes.data.data);
      if (storesRes.data.success) setStores(storesRes.data.data.filter(s => s.is_active));
      if (productsRes.data.success) setProducts(productsRes.data.data);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    try {
      await api.post('/store-transfers', {
        ...formData,
        requested_by: user?.id
      });
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error creating transfer:', error);
      alert(error.response?.data?.error || 'Failed to create transfer');
    }
  };

  const addItem = () => {
    if (!selectedProduct || quantity <= 0) {
      alert('Please select a product and enter quantity');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const existingItem = formData.items.find(item => item.product_id === selectedProduct);
    if (existingItem) {
      alert('Product already added. Edit quantity in the list.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        product_id: selectedProduct,
        product_name: product.name,
        quantity: parseInt(quantity)
      }]
    }));

    setSelectedProduct('');
    setQuantity(1);
  };

  const removeItem = (productId) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.product_id !== productId)
    }));
  };

  const handleApprove = async (transferId) => {
    if (!window.confirm('Approve this transfer? Stock will be deducted from source store.')) return;

    try {
      await api.post(`/store-transfers/${transferId}/approve`, {
        approved_by: user?.id
      });
      loadData();
    } catch (error) {
      console.error('Error approving transfer:', error);
      alert(error.response?.data?.error || 'Failed to approve transfer');
    }
  };

  const handleComplete = async (transferId) => {
    if (!window.confirm('Mark this transfer as received? Stock will be added to destination store.')) return;

    try {
      await api.post(`/store-transfers/${transferId}/complete`);
      loadData();
    } catch (error) {
      console.error('Error completing transfer:', error);
      alert(error.response?.data?.error || 'Failed to complete transfer');
    }
  };

  const handleCancel = async (transferId) => {
    if (!window.confirm('Cancel this transfer?')) return;

    try {
      await api.post(`/store-transfers/${transferId}/cancel`);
      loadData();
    } catch (error) {
      console.error('Error cancelling transfer:', error);
      alert('Failed to cancel transfer');
    }
  };

  const resetForm = () => {
    setFormData({
      from_store_id: '',
      to_store_id: '',
      notes: '',
      items: []
    });
    setSelectedProduct('');
    setQuantity(1);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: '#f59e0b', icon: Clock, label: 'Pending' },
      in_transit: { color: '#3b82f6', icon: ArrowRight, label: 'In Transit' },
      completed: { color: '#10b981', icon: Check, label: 'Completed' },
      cancelled: { color: '#ef4444', icon: X, label: 'Cancelled' }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className="status-badge" style={{ background: `${badge.color}20`, color: badge.color }}>
        <Icon size={14} />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading transfers...</p>
      </div>
    );
  }

  return (
    <div className="transfers-page">
      <div className="page-header">
        <div>
          <h1>Store Transfers</h1>
          <p className="subtitle">ဆိုင်များအကြား လွှဲပြောင်းမှု - Transfer inventory between stores</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          New Transfer
        </button>
      </div>

      <div className="filter-tabs">
        {['all', 'pending', 'in_transit', 'completed', 'cancelled'].map(status => (
          <button
            key={status}
            className={`filter-tab ${filterStatus === status ? 'active' : ''}`}
            onClick={() => setFilterStatus(status)}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ')}
            {status !== 'all' && (
              <span className="count">
                {transfers.filter(t => t.status === status).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="transfers-list">
        {transfers.map(transfer => (
          <div key={transfer.id} className="transfer-card">
            <div className="transfer-header">
              <div className="transfer-route">
                <div className="store-info">
                  <Package size={18} />
                  <div>
                    <strong>{transfer.from_store?.name}</strong>
                    <span className="store-code">{transfer.from_store?.code}</span>
                  </div>
                </div>
                <ArrowRight size={24} color="#9ca3af" />
                <div className="store-info">
                  <Package size={18} />
                  <div>
                    <strong>{transfer.to_store?.name}</strong>
                    <span className="store-code">{transfer.to_store?.code}</span>
                  </div>
                </div>
              </div>
              {getStatusBadge(transfer.status)}
            </div>

            <div className="transfer-items">
              <strong>Items ({transfer.store_transfer_items?.length || 0}):</strong>
              <ul>
                {transfer.store_transfer_items?.slice(0, 3).map(item => (
                  <li key={item.id}>
                    {item.products?.name} × {item.quantity}
                  </li>
                ))}
                {transfer.store_transfer_items?.length > 3 && (
                  <li>+ {transfer.store_transfer_items.length - 3} more items</li>
                )}
              </ul>
            </div>

            {transfer.notes && (
              <div className="transfer-notes">
                <strong>Notes:</strong> {transfer.notes}
              </div>
            )}

            <div className="transfer-meta">
              <span>Created: {new Date(transfer.created_at).toLocaleDateString()}</span>
              {transfer.requested_by_user && (
                <span>By: {transfer.requested_by_user.full_name}</span>
              )}
            </div>

            <div className="transfer-actions">
              {transfer.status === 'pending' && (
                <>
                  <button className="btn-success btn-sm" onClick={() => handleApprove(transfer.id)}>
                    <Check size={16} />
                    Approve
                  </button>
                  <button className="btn-danger btn-sm" onClick={() => handleCancel(transfer.id)}>
                    <X size={16} />
                    Cancel
                  </button>
                </>
              )}
              {transfer.status === 'in_transit' && (
                <button className="btn-primary btn-sm" onClick={() => handleComplete(transfer.id)}>
                  <Check size={16} />
                  Mark Received
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {transfers.length === 0 && (
        <div className="empty-state">
          <AlertCircle size={64} color="#cbd5e1" />
          <h3>No transfers found</h3>
          <p>Create a transfer to move inventory between stores</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Store Transfer</h2>
              <button className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>From Store *</label>
                  <select
                    value={formData.from_store_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, from_store_id: e.target.value }))}
                    required
                  >
                    <option value="">Select source store</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>
                        {store.name} ({store.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>To Store *</label>
                  <select
                    value={formData.to_store_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, to_store_id: e.target.value }))}
                    required
                  >
                    <option value="">Select destination store</option>
                    {stores.filter(s => s.id !== formData.from_store_id).map(store => (
                      <option key={store.id} value={store.id}>
                        {store.name} ({store.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows="2"
                    placeholder="Transfer notes..."
                  />
                </div>
              </div>

              <div className="items-section">
                <h3>Items to Transfer</h3>
                <div className="add-item-form">
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                  >
                    <option value="">Select product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} {product.sku ? `(${product.sku})` : ''}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                    placeholder="Qty"
                  />
                  <button type="button" className="btn-secondary" onClick={addItem}>
                    <Plus size={16} />
                    Add
                  </button>
                </div>

                <div className="items-list">
                  {formData.items.map(item => (
                    <div key={item.product_id} className="item-row">
                      <span>{item.product_name}</span>
                      <span>× {item.quantity}</span>
                      <button
                        type="button"
                        className="btn-icon btn-danger"
                        onClick={() => removeItem(item.product_id)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {formData.items.length === 0 && (
                    <p className="empty-items">No items added yet</p>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreTransfers;
