import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import { getProducts, getCustomers, createOrder } from '../api/api';

const POS = () => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await getProducts();
      setProducts(res.data.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await getCustomers();
      setCustomers(res.data.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        name_mm: product.name_mm,
        price: product.price,
        quantity: 1
      }]);
    }
  };

  const updateQuantity = (productId, change) => {
    setCart(cart.map(item =>
      item.product_id === productId
        ? { ...item, quantity: Math.max(1, item.quantity + change) }
        : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    try {
      const orderData = {
        customer_id: selectedCustomer || null,
        items: cart,
        total_amount: calculateTotal(),
        discount: 0,
        tax: 0,
        payment_method: paymentMethod,
        source: 'pos'
      };

      await createOrder(orderData);
      alert('Order created successfully!');
      setCart([]);
      setSelectedCustomer('');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.name_mm && p.name_mm.includes(searchTerm))
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Point of Sale / ရောင်းချရန်</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div>
          <div className="card">
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              <input
                type="text"
                className="input"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  style={{
                    padding: '16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                >
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                    {product.name_mm || product.name}
                  </div>
                  <div style={{ fontSize: '16px', color: '#2563eb', fontWeight: '700' }}>
                    {product.price} Ks
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    Stock: {product.stock_quantity}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={20} />
              Cart / စျေးခြင်း
            </h3>

            <div className="form-group">
              <label className="form-label">Customer</label>
              <select className="input" value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)}>
                <option value="">Walk-in Customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '16px', maxHeight: '300px', overflowY: 'auto' }}>
              {cart.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>Cart is empty</p>
              ) : (
                cart.map((item) => (
                  <div key={item.product_id} style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '500' }}>
                        {item.name_mm || item.name}
                      </div>
                      <button onClick={() => removeFromCart(item.product_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button onClick={() => updateQuantity(item.product_id, -1)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
                          <Minus size={14} />
                        </button>
                        <span style={{ minWidth: '30px', textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product_id, 1)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
                          <Plus size={14} />
                        </button>
                      </div>
                      <div style={{ fontWeight: '600' }}>{item.price * item.quantity} Ks</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="kpay">KPay</option>
                <option value="wavepay">Wave Pay</option>
                <option value="card">Card</option>
              </select>
            </div>

            <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: '700' }}>
                <span>Total:</span>
                <span>{calculateTotal()} Ks</span>
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCheckout}>
              Complete Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;
