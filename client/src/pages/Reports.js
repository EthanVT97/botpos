import React, { useState, useEffect } from 'react';
import { getDailySales, getMonthlySales, getProductPerformance } from '../api/api';

const Reports = () => {
  const [dailySales, setDailySales] = useState(null);
  const [monthlySales, setMonthlySales] = useState(null);
  const [productPerformance, setProductPerformance] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    loadReports();
  }, [selectedDate, selectedMonth]);

  const loadReports = async () => {
    try {
      const [daily, monthly, performance] = await Promise.all([
        getDailySales(selectedDate),
        getMonthlySales(selectedMonth),
        getProductPerformance({})
      ]);
      setDailySales(daily.data.data);
      setMonthlySales(monthly.data.data);
      setProductPerformance(performance.data.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Reports / အစီရင်ခံစာများ</h1>
        <p className="page-subtitle">Sales and performance analytics</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
            Daily Sales / နေ့စဉ်ရောင်းအား
          </h3>
          <div className="form-group">
            <label className="form-label">Select Date</label>
            <input
              type="date"
              className="input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          {dailySales && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f9fafb', borderRadius: '6px', marginBottom: '8px' }}>
                <span>Total Orders:</span>
                <strong>{dailySales.total_orders}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f9fafb', borderRadius: '6px', marginBottom: '8px' }}>
                <span>Total Revenue:</span>
                <strong>{dailySales.total_revenue} Ks</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f9fafb', borderRadius: '6px', marginBottom: '8px' }}>
                <span>Total Discount:</span>
                <strong>{dailySales.total_discount} Ks</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
                <span>Total Tax:</span>
                <strong>{dailySales.total_tax} Ks</strong>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
            Monthly Sales / လစဉ်ရောင်းအား
          </h3>
          <div className="form-group">
            <label className="form-label">Select Month</label>
            <input
              type="month"
              className="input"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
          {monthlySales && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f9fafb', borderRadius: '6px', marginBottom: '8px' }}>
                <span>Total Orders:</span>
                <strong>{monthlySales.total_orders}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f9fafb', borderRadius: '6px', marginBottom: '8px' }}>
                <span>Total Revenue:</span>
                <strong>{monthlySales.total_revenue} Ks</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f9fafb', borderRadius: '6px', marginBottom: '8px' }}>
                <span>Total Discount:</span>
                <strong>{monthlySales.total_discount} Ks</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
                <span>Total Tax:</span>
                <strong>{monthlySales.total_tax} Ks</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
          Product Performance / ကုန်ပစ္စည်းစွမ်းဆောင်ရည်
        </h3>
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity Sold</th>
              <th>Revenue</th>
              <th>Cost</th>
              <th>Profit</th>
            </tr>
          </thead>
          <tbody>
            {productPerformance.slice(0, 10).map((item, index) => (
              <tr key={index}>
                <td>{item.name_mm || item.name}</td>
                <td>{item.total_quantity}</td>
                <td>{item.total_revenue} Ks</td>
                <td>{item.total_cost} Ks</td>
                <td style={{ color: item.profit > 0 ? '#10b981' : '#dc2626', fontWeight: '600' }}>
                  {item.profit} Ks
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
