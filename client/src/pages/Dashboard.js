import React, { useState, useEffect } from 'react';
import { TrendingUp, ShoppingCart, Users, Package, MessageCircle } from 'lucide-react';
import { getSalesSummary, getTopProducts, getLowStock, getUnreadCount } from '../api/api';
import Chat from '../components/Chat';
import api from '../api/api';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    loadDashboardData();
    loadUnreadMessages();
    
    // Poll for unread messages every 5 seconds
    const interval = setInterval(loadUnreadMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [summaryRes, topRes, stockRes] = await Promise.all([
        getSalesSummary(),
        getTopProducts(5),
        getLowStock()
      ]);
      setSummary(summaryRes.data.data);
      setTopProducts(topRes.data.data);
      setLowStock(stockRes.data.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const loadUnreadMessages = async () => {
    try {
      const response = await getUnreadCount();
      if (response.data.success) {
        setUnreadMessages(response.data.data.total);
      }
    } catch (error) {
      console.error('Error loading unread messages:', error);
    }
  };

  const stats = [
    { 
      title: 'Total Sales', 
      titleMm: 'စုစုပေါင်းရောင်းအား',
      value: summary?.total_sales || 0, 
      icon: TrendingUp, 
      color: '#10b981' 
    },
    { 
      title: 'Orders', 
      titleMm: 'မှာယူမှုများ',
      value: summary?.order_count || 0, 
      icon: ShoppingCart, 
      color: '#3b82f6' 
    },
    { 
      title: 'Low Stock', 
      titleMm: 'ကုန်ပစ္စည်းနည်း',
      value: lowStock.length, 
      icon: Package, 
      color: '#f59e0b' 
    },
    { 
      title: 'Messages', 
      titleMm: 'မက်ဆေ့ခ်ျများ',
      value: unreadMessages, 
      icon: MessageCircle, 
      color: '#8b5cf6',
      onClick: () => setShowChat(!showChat)
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">ပင်မစာမျက်နှာ - Overview of your business</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index} 
              className="card" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px',
                cursor: stat.onClick ? 'pointer' : 'default',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onClick={stat.onClick}
              onMouseEnter={(e) => {
                if (stat.onClick) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (stat.onClick) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                }
              }}
            >
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '12px', 
                background: `${stat.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                <Icon size={28} color={stat.color} />
                {stat.title === 'Messages' && unreadMessages > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#ef4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {unreadMessages}
                  </span>
                )}
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  {stat.title} / {stat.titleMm}
                </div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a' }}>
                  {typeof stat.value === 'number' && stat.title.includes('Sales') 
                    ? `${stat.value.toLocaleString()} Ks` 
                    : stat.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showChat && (
        <div style={{ marginBottom: '24px' }}>
          <Chat api={api} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
            Top Products / အရောင်းရဆုံး
          </h3>
          {topProducts.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((item, index) => (
                  <tr key={index}>
                    <td>{item.products?.name_mm || item.products?.name}</td>
                    <td>{item.quantity}</td>
                    <td>{item.products?.price} Ks</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>No data available</p>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
            Low Stock Alert / ကုန်ပစ္စည်းနည်းနေသော
          </h3>
          {lowStock.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.slice(0, 5).map((product) => (
                  <tr key={product.id}>
                    <td>{product.name_mm || product.name}</td>
                    <td>{product.stock_quantity}</td>
                    <td>
                      <span className="badge badge-warning">Low</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>All products in stock</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
