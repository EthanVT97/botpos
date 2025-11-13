import React, { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { getOrders, updateOrderStatus } from '../api/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await getOrders();
      setOrders(res.data.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      loadOrders();
    } catch (error) {
      console.error('Error:', error);
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
                <td>{order.total_amount} Ks</td>
                <td>{order.payment_method}</td>
                <td>
                  <span className="badge badge-info">{order.source}</span>
                </td>
                <td>
                  <select
                    className={`badge ${getStatusBadge(order.status)}`}
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    style={{ border: 'none', cursor: 'pointer' }}
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
      </div>

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Order Details</h2>
            </div>
            <div>
              <p><strong>Order ID:</strong> {selectedOrder.id}</p>
              <p><strong>Customer:</strong> {selectedOrder.customers?.name || 'Walk-in'}</p>
              <p><strong>Status:</strong> <span className={`badge ${getStatusBadge(selectedOrder.status)}`}>{selectedOrder.status}</span></p>
              <p><strong>Payment:</strong> {selectedOrder.payment_method}</p>
              <p><strong>Total:</strong> {selectedOrder.total_amount} Ks</p>
              
              <h4 style={{ marginTop: '20px', marginBottom: '12px' }}>Items:</h4>
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.order_items?.map((item) => (
                    <tr key={item.id}>
                      <td>{item.products?.name_mm || item.products?.name}</td>
                      <td>{item.quantity}</td>
                      <td>{item.price} Ks</td>
                      <td>{item.subtotal} Ks</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
