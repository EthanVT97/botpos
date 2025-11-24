import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Users, Package, Calendar, Download } from 'lucide-react';
import api from '../api/client';
import './Analytics.css';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/analytics/dashboard', {
        params: dateRange
      });
      
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      alert('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const exportData = async (type) => {
    try {
      // TODO: Implement export functionality
      alert(`Export as ${type} - Coming soon!`);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="page">
        <div className="error-container">
          <p>Failed to load analytics data</p>
        </div>
      </div>
    );
  }

  const { summary, sales_trend, top_products, payment_methods, top_categories, hourly_sales } = dashboardData;

  // Prepare chart colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Format currency
  const formatCurrency = (value) => {
    return `${parseFloat(value || 0).toLocaleString()} Ks`;
  };

  // Format number
  const formatNumber = (value) => {
    return parseFloat(value || 0).toLocaleString();
  };

  // Stats cards data
  const stats = [
    {
      title: 'Total Sales',
      titleMm: 'စုစုပေါင်းရောင်းအား',
      value: formatCurrency(summary.total_sales),
      icon: DollarSign,
      color: '#10b981',
      change: '+12.5%'
    },
    {
      title: 'Total Orders',
      titleMm: 'စုစုပေါင်းမှာယူမှု',
      value: formatNumber(summary.total_orders),
      icon: ShoppingCart,
      color: '#3b82f6',
      change: '+8.2%'
    },
    {
      title: 'Avg Order Value',
      titleMm: 'ပျမ်းမျှတန်ဖိုး',
      value: formatCurrency(summary.avg_order_value),
      icon: TrendingUp,
      color: '#f59e0b',
      change: '+5.1%'
    },
    {
      title: 'Total Profit',
      titleMm: 'စုစုပေါင်းအမြတ်',
      value: formatCurrency(summary.total_profit),
      icon: DollarSign,
      color: '#8b5cf6',
      change: '+15.3%'
    },
    {
      title: 'Unique Customers',
      titleMm: 'ဖောက်သည်အရေအတွက်',
      value: formatNumber(summary.unique_customers),
      icon: Users,
      color: '#ec4899',
      change: '+6.7%'
    },
    {
      title: 'Total Discount',
      titleMm: 'စုစုပေါင်းလျှော့ဈေး',
      value: formatCurrency(summary.total_discount),
      icon: Package,
      color: '#ef4444',
      change: '-2.1%'
    }
  ];

  return (
    <div className="page analytics-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-subtitle">ခွဲခြမ်းစိတ်ဖြာမှု - Advanced Business Insights</p>
        </div>
        <div className="analytics-actions">
          <button className="btn-secondary" onClick={() => exportData('excel')}>
            <Download size={18} />
            Export Excel
          </button>
          <button className="btn-secondary" onClick={() => exportData('pdf')}>
            <Download size={18} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="card date-range-card">
        <div className="date-range-selector">
          <Calendar size={20} />
          <div className="date-inputs">
            <div className="date-input-group">
              <label>Start Date</label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => handleDateChange('start_date', e.target.value)}
              />
            </div>
            <span className="date-separator">to</span>
            <div className="date-input-group">
              <label>End Date</label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => handleDateChange('end_date', e.target.value)}
              />
            </div>
          </div>
          <button className="btn-primary" onClick={loadDashboardData}>
            Apply
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="stat-card">
              <div className="stat-icon" style={{ background: `${stat.color}20` }}>
                <Icon size={24} color={stat.color} />
              </div>
              <div className="stat-content">
                <div className="stat-label">
                  {stat.title} / {stat.titleMm}
                </div>
                <div className="stat-value">{stat.value}</div>
                {/* <div className={`stat-change ${stat.change.startsWith('+') ? 'positive' : 'negative'}`}>
                  {stat.change} from last period
                </div> */}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sales Trend Chart */}
      <div className="card chart-card">
        <h3 className="chart-title">
          Sales Trend / ရောင်းအားလမ်းကြောင်း
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sales_trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="total_sales" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Total Sales"
            />
            <Line 
              type="monotone" 
              dataKey="order_count" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Order Count"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Two Column Charts */}
      <div className="charts-row">
        {/* Top Products */}
        <div className="card chart-card">
          <h3 className="chart-title">
            Top Products / အရောင်းရဆုံး
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={top_products}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="product_name_mm" />
              <YAxis />
              <Tooltip formatter={(value) => formatNumber(value)} />
              <Legend />
              <Bar dataKey="quantity_sold" fill="#3b82f6" name="Quantity Sold" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods */}
        <div className="card chart-card">
          <h3 className="chart-title">
            Payment Methods / ငွေပေးချေမှုနည်းလမ်း
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={payment_methods}
                dataKey="total_amount"
                nameKey="payment_method"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.payment_method}: ${formatCurrency(entry.total_amount)}`}
              >
                {payment_methods.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly Sales Pattern */}
      <div className="card chart-card">
        <h3 className="chart-title">
          Hourly Sales Pattern / နာရီအလိုက်ရောင်းအား
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={hourly_sales}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour_of_day" label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }} />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="total_sales" fill="#8b5cf6" name="Total Sales" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Categories */}
      <div className="card">
        <h3 className="chart-title">
          Top Categories / အရောင်းရဆုံးအမျိုးအစားများ
        </h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Products</th>
                <th>Quantity Sold</th>
                <th>Revenue</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {top_categories.map((category, index) => (
                <tr key={index}>
                  <td>{category.name_mm || category.name}</td>
                  <td>{formatNumber(category.product_count)}</td>
                  <td>{formatNumber(category.total_quantity_sold)}</td>
                  <td>{formatCurrency(category.total_revenue)}</td>
                  <td className="profit-cell">{formatCurrency(category.total_profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
