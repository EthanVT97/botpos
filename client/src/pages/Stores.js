import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Phone, Mail, User, TrendingUp, Package, AlertCircle, X } from 'lucide-react';
import api from '../api/api';
import './Stores.css';

const Stores = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [storeInventory, setStoreInventory] = useState([]);
  const [storePerformance, setStorePerformance] = useState(null);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    name_mm: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    manager_id: null,
    timezone: 'Asia/Yangon',
    currency: 'MMK',
    tax_rate: 0
  });

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stores');
      if (response.data.success) {
        setStores(response.data.data);
      }
    } catch (error) {
      console.error('Error loading stores:', error);
      alert('Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStore) {
        await api.put(`/stores/${editingStore.id}`, formData);
        alert('Store updated successfully! ✅');
      } else {
        await api.post('/stores', formData);
        alert('Store created successfully! ✅');
      }
      setShowModal(false);
      resetForm();
      
      // Force reload with delay
      setTimeout(() => {
        loadStores();
      }, 500);
    } catch (error) {
      console.error('Error saving store:', error);
      alert(error.response?.data?.error || 'Failed to save store');
    }
  };

  const handleEdit = (store) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      name_mm: store.name_mm || '',
      code: store.code,
      address: store.address || '',
      phone: store.phone || '',
      email: store.email || '',
      manager_id: store.manager_id,
      timezone: store.timezone || 'Asia/Yangon',
      currency: store.currency || 'MMK',
      tax_rate: store.tax_rate || 0
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this store?')) return;
    
    try {
      await api.delete(`/stores/${id}`);
      loadStores();
    } catch (error) {
      console.error('Error deleting store:', error);
      alert(error.response?.data?.error || 'Failed to delete store');
    }
  };

  const toggleActive = async (store) => {
    const action = store.is_active ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${store.name}?`)) return;
    
    try {
      await api.put(`/stores/${store.id}`, { is_active: !store.is_active });
      alert(`Store ${action}d successfully! ✅`);
      loadStores();
    } catch (error) {
      console.error('Error updating store:', error);
      alert('Failed to update store status');
    }
  };

  const viewInventory = async (store) => {
    setSelectedStore(store);
    setShowInventoryModal(true);
    setLoadingInventory(true);
    
    try {
      const response = await api.get(`/stores/${store.id}/inventory`);
      if (response.data.success) {
        setStoreInventory(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      alert('Failed to load inventory');
      setStoreInventory([]);
    } finally {
      setLoadingInventory(false);
    }
  };

  const viewPerformance = async (store) => {
    setSelectedStore(store);
    setShowPerformanceModal(true);
    setLoadingPerformance(true);
    
    try {
      const response = await api.get(`/stores/${store.id}/performance`);
      if (response.data.success) {
        setStorePerformance(response.data.data);
      }
    } catch (error) {
      console.error('Error loading performance:', error);
      alert('Failed to load performance data');
      setStorePerformance(null);
    } finally {
      setLoadingPerformance(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      name_mm: '',
      code: '',
      address: '',
      phone: '',
      email: '',
      manager_id: null,
      timezone: 'Asia/Yangon',
      currency: 'MMK',
      tax_rate: 0
    });
    setEditingStore(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading stores...</p>
      </div>
    );
  }

  return (
    <div className="stores-page">
      <div className="page-header">
        <div>
          <h1>Store Management</h1>
          <p className="subtitle">ဆိုင်များစီမံခန့်ခွဲမှု - Manage multiple store locations</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          Add Store
        </button>
      </div>

      <div className="stores-grid">
        {stores.map(store => (
          <div key={store.id} className={`store-card ${!store.is_active ? 'inactive' : ''}`}>
            <div className="store-card-header">
              <div>
                <h3>{store.name}</h3>
                {store.name_mm && <p className="store-name-mm">{store.name_mm}</p>}
                <span className={`store-badge ${store.is_active ? 'active' : 'inactive'}`}>
                  {store.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="store-code">{store.code}</span>
              </div>
              <div className="store-actions">
                <button 
                  className="btn-icon" 
                  onClick={() => handleEdit(store)}
                  title="Edit store"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  className="btn-icon btn-danger" 
                  onClick={() => handleDelete(store.id)}
                  title="Delete store"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="store-details">
              {store.address && (
                <div className="detail-item">
                  <MapPin size={16} />
                  <span>{store.address}</span>
                </div>
              )}
              {store.phone && (
                <div className="detail-item">
                  <Phone size={16} />
                  <span>{store.phone}</span>
                </div>
              )}
              {store.email && (
                <div className="detail-item">
                  <Mail size={16} />
                  <span>{store.email}</span>
                </div>
              )}
              {store.users && (
                <div className="detail-item">
                  <User size={16} />
                  <span>Manager: {store.users.full_name || 'Not assigned'}</span>
                </div>
              )}
            </div>

            <div className="store-stats">
              <div className="stat-item">
                <Package size={16} color="#3b82f6" />
                <div>
                  <div className="stat-value">{store.product_count || 0}</div>
                  <div className="stat-label">Products</div>
                </div>
              </div>
              <div className="stat-item">
                <TrendingUp size={16} color="#10b981" />
                <div>
                  <div className="stat-value">{store.total_inventory || 0}</div>
                  <div className="stat-label">Total Stock</div>
                </div>
              </div>
            </div>

            <div className="store-footer">
              <button 
                className="btn-secondary btn-sm"
                onClick={() => viewInventory(store)}
              >
                <Package size={16} />
                View Inventory
              </button>
              <button 
                className="btn-secondary btn-sm"
                onClick={() => viewPerformance(store)}
              >
                <TrendingUp size={16} />
                Performance
              </button>
              <button 
                className={`btn-sm ${store.is_active ? 'btn-warning' : 'btn-success'}`}
                onClick={() => toggleActive(store)}
              >
                {store.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {stores.length === 0 && (
        <div className="empty-state">
          <AlertCircle size={64} color="#cbd5e1" />
          <h3>No stores found</h3>
          <p>Create your first store to get started</p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={20} />
            Add Store
          </button>
        </div>
      )}

      {/* Inventory Modal */}
      {showInventoryModal && (
        <div className="modal-overlay" onClick={() => setShowInventoryModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📦 {selectedStore?.name} - Inventory</h2>
              <button className="btn-close" onClick={() => setShowInventoryModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {loadingInventory ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="spinner"></div>
                  <p>Loading inventory...</p>
                </div>
              ) : storeInventory.length > 0 ? (
                <div className="inventory-table">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Stock</th>
                        <th>Min</th>
                        <th>Max</th>
                        <th>Price</th>
                        <th>Value</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storeInventory.map((item) => (
                        <tr key={item.product_id}>
                          <td>
                            <div>
                              <div className="product-name">{item.name}</div>
                              {item.name_mm && <div className="product-name-mm">{item.name_mm}</div>}
                            </div>
                          </td>
                          <td>{item.sku}</td>
                          <td>
                            <span className={`stock-badge ${
                              item.quantity <= (item.min_quantity || 10) ? 'low-stock' : 
                              item.quantity >= (item.max_quantity || 100) ? 'high-stock' : 
                              'in-stock'
                            }`}>
                              {item.quantity}
                            </span>
                          </td>
                          <td>{item.min_quantity || '-'}</td>
                          <td>{item.max_quantity || '-'}</td>
                          <td>{item.price?.toLocaleString() || 0} Ks</td>
                          <td>{((item.quantity || 0) * (item.price || 0)).toLocaleString()} Ks</td>
                          <td>
                            {item.quantity <= (item.min_quantity || 10) ? (
                              <span className="badge badge-warning">Low Stock</span>
                            ) : item.quantity >= (item.max_quantity || 100) ? (
                              <span className="badge badge-danger">Overstock</span>
                            ) : (
                              <span className="badge badge-success">Good</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <Package size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <p>No inventory data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Performance Modal */}
      {showPerformanceModal && (
        <div className="modal-overlay" onClick={() => setShowPerformanceModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📊 {selectedStore?.name} - Performance</h2>
              <button className="btn-close" onClick={() => setShowPerformanceModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {loadingPerformance ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="spinner"></div>
                  <p>Loading performance data...</p>
                </div>
              ) : storePerformance ? (
                <div className="performance-dashboard">
                  <div className="performance-stats">
                    <div className="stat-card">
                      <div className="stat-icon">💰</div>
                      <div className="stat-info">
                        <div className="stat-value">{storePerformance.total_sales?.toLocaleString() || 0} Ks</div>
                        <div className="stat-label">Total Sales</div>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">📋</div>
                      <div className="stat-info">
                        <div className="stat-value">{storePerformance.total_orders || 0}</div>
                        <div className="stat-label">Total Orders</div>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">📦</div>
                      <div className="stat-info">
                        <div className="stat-value">{storePerformance.total_products || 0}</div>
                        <div className="stat-label">Products</div>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">👥</div>
                      <div className="stat-info">
                        <div className="stat-value">{storePerformance.total_customers || 0}</div>
                        <div className="stat-label">Customers</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="performance-metrics">
                    <div className="metric-row">
                      <span className="metric-label">Average Order Value:</span>
                      <span className="metric-value">{storePerformance.avg_order_value?.toLocaleString() || 0} Ks</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Total Inventory Value:</span>
                      <span className="metric-value">{storePerformance.total_inventory_value?.toLocaleString() || 0} Ks</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Low Stock Items:</span>
                      <span className="metric-value badge badge-warning">{storePerformance.low_stock_items || 0}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <TrendingUp size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <p>No performance data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Store Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingStore ? 'Edit Store' : 'Add New Store'}</h2>
              <button className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Store Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Main Store"
                  />
                </div>

                <div className="form-group">
                  <label>Myanmar Name</label>
                  <input
                    type="text"
                    name="name_mm"
                    value={formData.name_mm}
                    onChange={handleChange}
                    placeholder="ပင်မဆိုင်"
                  />
                </div>

                <div className="form-group">
                  <label>Store Code *</label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    required
                    placeholder="MAIN"
                    disabled={editingStore}
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+95 9 123 456 789"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="store@example.com"
                  />
                </div>

                <div className="form-group">
                  <label>Currency</label>
                  <select name="currency" value={formData.currency} onChange={handleChange}>
                    <option value="MMK">MMK (Kyat)</option>
                    <option value="USD">USD (Dollar)</option>
                    <option value="THB">THB (Baht)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Tax Rate (%)</label>
                  <input
                    type="number"
                    name="tax_rate"
                    value={formData.tax_rate}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Timezone</label>
                  <select name="timezone" value={formData.timezone} onChange={handleChange}>
                    <option value="Asia/Yangon">Asia/Yangon</option>
                    <option value="Asia/Bangkok">Asia/Bangkok</option>
                    <option value="Asia/Singapore">Asia/Singapore</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Store address..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingStore ? 'Update Store' : 'Create Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stores;
