import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getInventoryMovements, addInventoryMovement, getProducts } from '../api/api';

const Inventory = () => {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: '',
    type: 'in',
    notes: ''
  });

  useEffect(() => {
    loadMovements();
    loadProducts();
  }, []);

  const loadMovements = async () => {
    try {
      const res = await getInventoryMovements();
      setMovements(res.data?.data || []);
    } catch (error) {
      console.error('Error loading movements:', error);
      alert('Failed to load inventory movements: ' + (error.response?.data?.error || error.message));
    }
  };

  const loadProducts = async () => {
    try {
      const res = await getProducts();
      setProducts(res.data?.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      alert('Failed to load products: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addInventoryMovement(formData);
      setShowModal(false);
      setFormData({ product_id: '', quantity: '', type: 'in', notes: '' });
      await Promise.all([loadMovements(), loadProducts()]);
    } catch (error) {
      console.error('Error adding movement:', error);
      alert('Failed to add inventory movement: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Inventory / စာရင်းကိုင်</h1>
        <p className="page-subtitle">Track stock movements</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} style={{ marginRight: '8px', display: 'inline' }} />
            Add Movement
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Notes</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((movement) => (
              <tr key={movement.id}>
                <td>{movement.products?.name_mm || movement.products?.name}</td>
                <td>
                  <span className={`badge ${movement.type === 'in' ? 'badge-success' : movement.type === 'out' ? 'badge-danger' : 'badge-warning'}`}>
                    {movement.type}
                  </span>
                </td>
                <td>{movement.quantity}</td>
                <td>{movement.notes}</td>
                <td>{new Date(movement.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Inventory Movement</h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Product *</label>
                <select className="input" value={formData.product_id} onChange={(e) => setFormData({...formData, product_id: e.target.value})} required>
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name_mm || p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Type *</label>
                <select className="input" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} required>
                  <option value="in">Stock In</option>
                  <option value="out">Stock Out</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Quantity *</label>
                <input type="number" className="input" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="input" rows="3" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
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

export default Inventory;
