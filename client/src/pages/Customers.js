import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../api/api';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', address: '',
    viber_id: '', telegram_id: '', messenger_id: ''
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const res = await getCustomers();
      setCustomers(res.data?.data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      alert('Failed to load customers: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, formData);
      } else {
        await createCustomer(formData);
      }
      setShowModal(false);
      setEditingCustomer(null);
      setFormData({ name: '', phone: '', email: '', address: '', viber_id: '', telegram_id: '', messenger_id: '' });
      await loadCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Failed to save customer: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData(customer);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer(id);
        await loadCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Failed to delete customer: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Customers / ဖောက်သည်များ</h1>
        <p className="page-subtitle">Manage customer information</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            <input
              type="text"
              className="input"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
          <button className="btn btn-primary" onClick={() => { setShowModal(true); setEditingCustomer(null); }}>
            <Plus size={18} style={{ marginRight: '8px', display: 'inline' }} />
            Add Customer
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Channels</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.phone}</td>
                <td>{customer.email}</td>
                <td>
                  {customer.viber_id && <span className="badge badge-info" style={{ marginRight: '4px' }}>Viber</span>}
                  {customer.telegram_id && <span className="badge badge-info" style={{ marginRight: '4px' }}>Telegram</span>}
                  {customer.messenger_id && <span className="badge badge-info">Messenger</span>}
                </td>
                <td>
                  <button className="btn btn-secondary" style={{ marginRight: '8px', padding: '6px 12px' }} onClick={() => handleEdit(customer)}>
                    <Edit size={16} />
                  </button>
                  <button className="btn btn-danger" style={{ padding: '6px 12px' }} onClick={() => handleDelete(customer.id)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="input" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="input" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea className="input" rows="2" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
