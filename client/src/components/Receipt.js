import React, { forwardRef } from 'react';
import './Receipt.css';

const Receipt = forwardRef(({ order, settings }, ref) => {
  if (!order) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `${parseFloat(amount || 0).toLocaleString()} Ks`;
  };

  return (
    <div ref={ref} className="receipt-container">
      <div className="receipt">
        {/* Header */}
        <div className="receipt-header">
          <h1>Myanmar POS System</h1>
          <h2>ရောင်းချမှုဘောင်ချာ</h2>
          {settings?.store_name && (
            <div className="store-name">{settings.store_name}</div>
          )}
          {settings?.store_address && (
            <div className="store-info">{settings.store_address}</div>
          )}
          {settings?.store_phone && (
            <div className="store-info">Phone: {settings.store_phone}</div>
          )}
        </div>

        <div className="receipt-divider"></div>

        {/* Order Info */}
        <div className="receipt-info">
          <div className="info-row">
            <span>Receipt No:</span>
            <span>{order.id?.substring(0, 8).toUpperCase()}</span>
          </div>
          <div className="info-row">
            <span>Date:</span>
            <span>{formatDate(order.created_at)}</span>
          </div>
          {order.customers && (
            <>
              <div className="info-row">
                <span>Customer:</span>
                <span>{order.customers.name}</span>
              </div>
              {order.customers.phone && (
                <div className="info-row">
                  <span>Phone:</span>
                  <span>{order.customers.phone}</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="receipt-divider"></div>

        {/* Items */}
        <table className="receipt-items">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.order_items?.map((item, index) => (
              <tr key={index}>
                <td>{item.products?.name_mm || item.products?.name}</td>
                <td>{item.quantity}</td>
                <td>{formatCurrency(item.price)}</td>
                <td>{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="receipt-divider"></div>

        {/* Totals */}
        <div className="receipt-totals">
          <div className="total-row">
            <span>Subtotal:</span>
            <span>{formatCurrency(order.total_amount)}</span>
          </div>
          {order.discount > 0 && (
            <div className="total-row">
              <span>Discount:</span>
              <span>-{formatCurrency(order.discount)}</span>
            </div>
          )}
          {order.tax > 0 && (
            <div className="total-row">
              <span>Tax:</span>
              <span>{formatCurrency(order.tax)}</span>
            </div>
          )}
          <div className="total-row grand-total">
            <span>Total:</span>
            <span>{formatCurrency(order.total_amount)}</span>
          </div>
          <div className="total-row">
            <span>Payment:</span>
            <span>{order.payment_method?.toUpperCase()}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="receipt-footer">
          <p>Thank you for your business!</p>
          <p>ဝယ်ယူအားပေးမှုအတွက် ကျေးဇူးတင်ပါသည်။</p>
          <p className="print-time">Printed: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';

export default Receipt;
