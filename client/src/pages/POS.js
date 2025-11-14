import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, Package } from 'lucide-react';
import { getProducts, getCustomers, createOrder, getProductUOMs } from '../api/api';
import './POS.css';

const POS = () => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showUOMModal, setShowUOMModal] = useState(false);
  const [selectedProductForUOM, setSelectedProductForUOM] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(null);

  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await getProducts();
      setProducts(res.data.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await getCustomers();
      setCustomers(res.data.data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadProductUOMs = async (productId) => {
    try {
      const res = await getProductUOMs(productId);
      console.log('Product UOMs loaded:', res.data.data);
      return res.data.data || [];
    } catch (error) {
      console.error('Error loading UOMs:', error);
      return [];
    }
  };

  const addToCart = async (product) => {
    // Show loading state
    setLoadingProduct(product.id);
    
    try {
      // Always check for UOMs when clicking a product
      const uoms = await loadProductUOMs(product.id);
      
      console.log(`Product: ${product.name}, UOMs found:`, uoms.length);
      
      if (uoms.length > 0) {
        // Show UOM selection modal
        console.log('Showing UOM modal with options:', uoms);
        setSelectedProductForUOM({ ...product, uoms });
        setShowUOMModal(true);
      } else {
        // No UOMs configured, add directly
        console.log('No UOMs configured, adding directly');
        addToCartDirect(product, null);
      }
    } finally {
      setLoadingProduct(null);
    }
  };

  const addToCartDirect = (product, uom) => {
    const cartKey = `${product.id}-${uom?.uom_id || 'default'}`;
    const existing = cart.find(item => 
      item.product_id === product.id && item.uom_id === (uom?.uom_id || null)
    );

    if (existing) {
      setCart(cart.map(item =>
        item.product_id === product.id && item.uom_id === (uom?.uom_id || null)
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        name_mm: product.name_mm,
        price: uom?.price || product.price,
        quantity: 1,
        uom_id: uom?.uom_id || null,
        uom_name: uom?.uom_name || null,
        uom_code: uom?.uom_code || null,
        uom_name_mm: uom?.uom_name_mm || null
      }]);
    }
  };

  const selectUOM = (uom) => {
    if (selectedProductForUOM) {
      addToCartDirect(selectedProductForUOM, uom);
      setShowUOMModal(false);
      setSelectedProductForUOM(null);
    }
  };

  const updateQuantity = (index, change) => {
    setCart(cart.map((item, i) =>
      i === index
        ? { ...item, quantity: Math.max(1, item.quantity + change) }
        : item
    ));
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
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
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          uom_id: item.uom_id
        })),
        total_amount: calculateTotal(),
        discount: 0,
        tax: 0,
        payment_method: paymentMethod,
        source: 'pos'
      };

      await createOrder(orderData);
      alert('Order created successfully! 🎉');
      setCart([]);
      setSelectedCustomer('');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order: ' + (error.response?.data?.error || error.message));
    }
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.name_mm && p.name_mm.includes(searchTerm)) ||
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="pos-page">
      <div className="pos-header">
        <h1 className="pos-title">Point of Sale / ရောင်းချရန်</h1>
      </div>

      <div className="pos-container">
        {/* Products Section */}
        <div className="pos-products">
          <div className="pos-search">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search products... / ကုန်ပစ္စည်းရှာရန်"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="products-grid">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`product-card ${loadingProduct === product.id ? 'loading' : ''}`}
                onClick={() => addToCart(product)}
              >
                {product.base_uom_id && (
                  <div className="product-badge">
                    <Package size={12} />
                    UOM
                  </div>
                )}
                <div className="product-name">
                  {product.name_mm || product.name}
                </div>
                <div className="product-price">
                  {product.price.toLocaleString()} Ks
                </div>
                <div className="product-stock">
                  Stock: {product.stock_quantity}
                </div>
                {loadingProduct === product.id && (
                  <div className="product-loading">Loading...</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Cart Section */}
        <div className="pos-cart">
          <div className="cart-header">
            <ShoppingCart size={24} />
            <h2>Cart / စျေးခြင်း</h2>
          </div>

          <div className="cart-customer">
            <label>Customer / ဖောက်သည်</label>
            <select 
              value={selectedCustomer} 
              onChange={(e) => setSelectedCustomer(e.target.value)}
            >
              <option value="">Walk-in Customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="cart-empty">
                <ShoppingCart size={48} />
                <p>Cart is empty</p>
                <p className="cart-empty-subtitle">Add products to start</p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={index} className="cart-item">
                  <div className="cart-item-header">
                    <div className="cart-item-info">
                      <div className="cart-item-name">
                        {item.name_mm || item.name}
                      </div>
                      {item.uom_name && (
                        <div className="cart-item-uom">
                          {item.uom_name_mm || item.uom_name} ({item.uom_code})
                        </div>
                      )}
                    </div>
                    <button 
                      className="cart-item-remove"
                      onClick={() => removeFromCart(index)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="cart-item-footer">
                    <div className="cart-item-quantity">
                      <button onClick={() => updateQuantity(index, -1)}>
                        <Minus size={14} />
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(index, 1)}>
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="cart-item-price">
                      {(item.price * item.quantity).toLocaleString()} Ks
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="cart-payment">
            <label>Payment Method / ငွေပေးချေမှု</label>
            <select 
              value={paymentMethod} 
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="cash">Cash / ငွေသား</option>
              <option value="kpay">KPay</option>
              <option value="wavepay">Wave Pay</option>
              <option value="card">Card / ကတ်</option>
            </select>
          </div>

          <div className="cart-total">
            <span>Total:</span>
            <span>{calculateTotal().toLocaleString()} Ks</span>
          </div>

          <button 
            className="cart-checkout"
            onClick={handleCheckout}
            disabled={cart.length === 0}
          >
            Complete Order / အော်ဒါပြီးမြောက်ရန်
          </button>
        </div>
      </div>

      {/* UOM Selection Modal */}
      {showUOMModal && selectedProductForUOM && (
        <div className="modal-overlay" onClick={() => setShowUOMModal(false)}>
          <div className="uom-modal" onClick={(e) => e.stopPropagation()}>
            <div className="uom-modal-header">
              <h2>Select Unit / ယူနစ်ရွေးချယ်ရန်</h2>
              <p>{selectedProductForUOM.name_mm || selectedProductForUOM.name}</p>
            </div>
            <div className="uom-modal-body">
              {selectedProductForUOM.uoms.map((uom) => (
                <div
                  key={uom.uom_id}
                  className="uom-option"
                  onClick={() => selectUOM(uom)}
                >
                  <div className="uom-option-info">
                    <div className="uom-option-name">
                      {uom.uom_name} ({uom.uom_code})
                    </div>
                    {uom.uom_name_mm && (
                      <div className="uom-option-name-mm">
                        {uom.uom_name_mm}
                      </div>
                    )}
                    {uom.conversion_factor !== 1 && (
                      <div className="uom-option-factor">
                        Factor: {uom.conversion_factor}
                      </div>
                    )}
                  </div>
                  <div className="uom-option-price">
                    {(uom.price || selectedProductForUOM.price).toLocaleString()} Ks
                  </div>
                </div>
              ))}
            </div>
            <div className="uom-modal-footer">
              <button 
                className="btn-cancel"
                onClick={() => setShowUOMModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
