import React, { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { getOrders, updateOrderStatus } from '../api/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await getOrders();
      setOrders(res.data?.data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      alert('Failed to load orders: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      await loadOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update order status: ' + (error.response?.data?.error || error.message));
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      completed: 'badge-success',
      cancelled: 'badge-danger'
    };
    return badges[status] || 'badge-info';
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Orders / မှာယူမှုများ</h1>
        <p className="page-subtitle">Manage customer orders</p>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            <p>No orders found</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>Orders will appear here once created from POS</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Source</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id.slice(0, 8)}</td>
                  <td>{order.customers?.name || 'Walk-in'}</td>
                  <td>{parseFloat(order.total_amount).toLocaleString()} Ks</td>
                  <td style={{ textTransform: 'capitalize' }}>{order.payment_method}</td>
                  <td>
                    <span className="badge badge-info" style={{ textTransform: 'uppercase' }}>{order.source}</span>
                  </td>
                  <td>
                    <select
                      className={`badge ${getStatusBadge(order.status)}`}
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      style={{ border: 'none', cursor: 'pointer', textTransform: 'capitalize' }}
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={() => setSelectedOrder(order)}>
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Order Details / အော်ဒါအသေးစိတ်</h2>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Order ID</p>
                  <p style={{ fontWeight: '500' }}>#{selectedOrder.id.slice(0, 8)}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Customer</p>
                  <p style={{ fontWeight: '500' }}>{selectedOrder.customers?.name || 'Walk-in'}</p>
                  {selectedOrder.customers?.phone && (
                    <p style={{ fontSize: '12px', color: '#666' }}>{selectedOrder.customers.phone}</p>
                  )}
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Status</p>
                  <span className={`badge ${getStatusBadge(selectedOrder.status)}`} style={{ textTransform: 'capitalize' }}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Payment Method</p>
                  <p style={{ fontWeight: '500', textTransform: 'capitalize' }}>{selectedOrder.payment_method}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Source</p>
                  <p style={{ fontWeight: '500', textTransform: 'uppercase' }}>{selectedOrder.source}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Date</p>
                  <p style={{ fontWeight: '500' }}>{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
              </div>

              {selectedOrder.notes && (
                <div style={{ marginBottom: '20px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Notes</p>
                  <p style={{ fontSize: '14px' }}>{selectedOrder.notes}</p>
                </div>
              )}
              
              <h4 style={{ marginTop: '20px', marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                Order Items / ပစ္စည်းများ
              </h4>
              {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                <>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th style={{ textAlign: 'center' }}>Qty</th>
                        <th style={{ textAlign: 'right' }}>Price</th>
                        <th style={{ textAlign: 'right' }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.order_items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.products?.name_mm || item.products?.name || 'Unknown Product'}</td>
                          <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                          <td style={{ textAlign: 'right' }}>{parseFloat(item.price).toLocaleString()} Ks</td>
                          <td style={{ textAlign: 'right' }}>{parseFloat(item.subtotal).toLocaleString()} Ks</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ marginTop: '16px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '16px', fontWeight: '600' }}>Total Amount:</span>
                      <span style={{ fontSize: '20px', fontWeight: '700', color: '#059669' }}>
                        {parseFloat(selectedOrder.total_amount).toLocaleString()} Ks
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <p style={{ color: '#666', fontSize: '14px', textAlign: 'center', padding: '20px' }}>No items found</p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Close / ပိတ်ရန်</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
