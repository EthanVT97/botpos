import React, { useState, useEffect } from 'react';
import { TrendingUp, ShoppingCart, Users, Package } from 'lucide-react';
import { getSalesSummary, getTopProducts, getLowStock } from '../api/api';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [summaryRes, topRes, stockRes] = await Promise.all([
        getSalesSummary(),
        getTopProducts(5),
        getLowStock()
      ]);
      
      console.log('✅ Dashboard data loaded:', {
        summary: summaryRes.data?.data,
        topProducts: topRes.data?.data,
        lowStock: stockRes.data?.data,
        timestamp: new Date().toISOString()
      });
      
      setSummary(summaryRes.data?.data || { total_sales: 0, order_count: 0 });
      setTopProducts(topRes.data?.data || []);
      setLowStock(stockRes.data?.data || []);
    } catch (error) {
      console.error('❌ Error loading dashboard data:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        timestamp: new Date().toISOString()
      });
      
      setError(error.message);
      // Set empty states on error
      setSummary({ total_sales: 0, order_count: 0 });
      setTopProducts([]);
      setLowStock([]);
    } finally {
      setLoading(false);
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
  ];

  if (loading) {
    return (
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', flexDirection: 'column', gap: '16px' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '4px solid #e5e7eb', 
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <p style={{ color: '#666', fontSize: '16px' }}>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">ပင်မစာမျက်နှာ - Overview of your business</p>
        </div>
        <button 
          onClick={loadDashboardData}
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div style={{
          padding: '16px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          marginBottom: '20px',
          color: '#dc2626'
        }}>
          ⚠️ Error loading data: {error}
        </div>
      )}

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
                justifyContent: 'center'
              }}>
                <Icon size={28} color={stat.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  {stat.title} / {stat.titleMm}
                </div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a' }}>
                  {typeof stat.value === 'number' && stat.title.includes('Sales') 
                    ? `${stat.value.toLocaleString()} Ks` 
                    : stat.value}
                </div>
                {stat.value === 0 && (
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                    No recent data
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

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
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              color: '#9ca3af'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
              <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>
                No recent sales data
              </p>
              <p style={{ fontSize: '14px' }}>
                ရောင်းချမှုမရှိသေးပါ - Create some orders to see top products
              </p>
            </div>
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
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              color: '#10b981'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
              <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>
                All products in stock
              </p>
              <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                ကုန်ပစ္စည်းအားလုံးလုံလောက်သည် - No low stock alerts
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
