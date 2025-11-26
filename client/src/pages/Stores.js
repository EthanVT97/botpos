import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Phone, Mail, User, TrendingUp, Package, AlertCircle } from 'lucide-react';
import api from '../api/api';
import './Stores.css';

const Stores = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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
    try {
      await api.put(`/stores/${store.id}`, { is_active: !store.is_active });
      loadStores();
    } catch (error) {
      console.error('Error updating store:', error);
      alert('Failed to update store status');
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

            <div className="store-footer">
              <button 
                className="btn-secondary btn-sm"
                onClick={() => window.location.href = `/stores/${store.id}/inventory`}
              >
                <Package size={16} />
                View Inventory
              </button>
              <button 
                className="btn-secondary btn-sm"
                onClick={() => window.location.href = `/stores/${store.id}/performance`}
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
