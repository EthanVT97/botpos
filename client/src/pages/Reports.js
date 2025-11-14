import React, { useState, useEffect } from 'react';
import { getDailySales, getMonthlySales, getProductPerformance } from '../api/api';
import * as XLSX from 'xlsx';
import api from '../api/client';

const Reports = () => {
  const [dailySales, setDailySales] = useState(null);
  const [monthlySales, setMonthlySales] = useState(null);
  const [productPerformance, setProductPerformance] = useState([]);
  const [profitLoss, setProfitLoss] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadReports();
  }, [selectedDate, selectedMonth, dateRange]);

  const loadReports = async () => {
    try {
      const [daily, monthly, performance, profitLossData] = await Promise.all([
        getDailySales(selectedDate),
        getMonthlySales(selectedMonth),
        getProductPerformance(dateRange),
        api.get('/reports/profit-loss', { params: dateRange })
      ]);
      setDailySales(daily.data.data);
      setMonthlySales(monthly.data.data);
      setProductPerformance(performance.data.data);
      setProfitLoss(profitLossData.data.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const exportToExcel = (data, filename) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportProductPerformance = () => {
    const exportData = productPerformance.map(item => ({
      'Product Name': item.name_mm || item.name,
      'Quantity Sold': item.total_quantity,
      'Revenue (Ks)': item.total_revenue,
      'Cost (Ks)': item.total_cost,
      'Profit (Ks)': item.profit,
      'Profit Margin (%)': item.profit_margin
    }));
    exportToExcel(exportData, 'Product_Performance');
  };

  const handleExportProfitLoss = () => {
    if (!profitLoss) return;
    const exportData = [
      { 'Category': 'Revenue', 'Item': 'Total Revenue', 'Amount (Ks)': profitLoss.revenue.total_revenue },
      { 'Category': 'Revenue', 'Item': 'Total Orders', 'Amount (Ks)': profitLoss.revenue.total_orders },
      { 'Category': 'Revenue', 'Item': 'Average Order Value', 'Amount (Ks)': profitLoss.revenue.average_order_value.toFixed(2) },
      { 'Category': 'Costs', 'Item': 'Total Cost', 'Amount (Ks)': profitLoss.costs.total_cost },
      { 'Category': 'Costs', 'Item': 'Total Discount', 'Amount (Ks)': profitLoss.costs.total_discount },
      { 'Category': 'Costs', 'Item': 'Total Tax', 'Amount (Ks)': profitLoss.costs.total_tax },
      { 'Category': 'Profit', 'Item': 'Gross Profit', 'Amount (Ks)': profitLoss.profit.gross_profit },
      { 'Category': 'Profit', 'Item': 'Net Profit', 'Amount (Ks)': profitLoss.profit.net_profit },
      { 'Category': 'Profit', 'Item': 'Profit Margin (%)', 'Amount (Ks)': profitLoss.profit.profit_margin }
    ];
    exportToExcel(exportData, 'Profit_Loss_Statement');
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
                <strong>{dailySales.total_revenue.toLocaleString()} Ks</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f9fafb', borderRadius: '6px', marginBottom: '8px' }}>
                <span>Total Discount:</span>
                <strong>{dailySales.total_discount.toLocaleString()} Ks</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
                <span>Total Tax:</span>
                <strong>{dailySales.total_tax.toLocaleString()} Ks</strong>
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
                <strong>{monthlySales.total_revenue.toLocaleString()} Ks</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f9fafb', borderRadius: '6px', marginBottom: '8px' }}>
                <span>Total Discount:</span>
                <strong>{monthlySales.total_discount.toLocaleString()} Ks</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
                <span>Total Tax:</span>
                <strong>{monthlySales.total_tax.toLocaleString()} Ks</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600' }}>
            Profit & Loss Statement / အမြတ်အရှုံးစာရင်း
          </h3>
          <button 
            className="btn btn-primary"
            onClick={handleExportProfitLoss}
            disabled={!profitLoss}
          >
            📊 Export to Excel
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="input"
              value={dateRange.start_date}
              onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="input"
              value={dateRange.end_date}
              onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
            />
          </div>
        </div>

        {profitLoss && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div style={{ padding: '20px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              <h4 style={{ fontSize: '14px', color: '#1e40af', marginBottom: '12px', fontWeight: '600' }}>
                💰 Revenue
              </h4>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Total Revenue</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e40af' }}>
                  {profitLoss.revenue.total_revenue.toLocaleString()} Ks
                </div>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Total Orders</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>
                  {profitLoss.revenue.total_orders}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Avg Order Value</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>
                  {profitLoss.revenue.average_order_value.toLocaleString()} Ks
                </div>
              </div>
            </div>

            <div style={{ padding: '20px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <h4 style={{ fontSize: '14px', color: '#dc2626', marginBottom: '12px', fontWeight: '600' }}>
                💸 Costs
              </h4>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Total Cost</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#dc2626' }}>
                  {profitLoss.costs.total_cost.toLocaleString()} Ks
                </div>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Total Discount</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>
                  {profitLoss.costs.total_discount.toLocaleString()} Ks
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Total Tax</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>
                  {profitLoss.costs.total_tax.toLocaleString()} Ks
                </div>
              </div>
            </div>

            <div style={{ padding: '20px', background: profitLoss.profit.net_profit >= 0 ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', border: `1px solid ${profitLoss.profit.net_profit >= 0 ? '#bbf7d0' : '#fecaca'}` }}>
              <h4 style={{ fontSize: '14px', color: profitLoss.profit.net_profit >= 0 ? '#16a34a' : '#dc2626', marginBottom: '12px', fontWeight: '600' }}>
                {profitLoss.profit.net_profit >= 0 ? '📈' : '📉'} Profit
              </h4>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Gross Profit</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: profitLoss.profit.gross_profit >= 0 ? '#16a34a' : '#dc2626' }}>
                  {profitLoss.profit.gross_profit.toLocaleString()} Ks
                </div>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Net Profit</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: profitLoss.profit.net_profit >= 0 ? '#16a34a' : '#dc2626' }}>
                  {profitLoss.profit.net_profit.toLocaleString()} Ks
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Profit Margin</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>
                  {profitLoss.profit.profit_margin}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600' }}>
            Product Performance / ကုန်ပစ္စည်းစွမ်းဆောင်ရည်
          </h3>
          <button 
            className="btn btn-primary"
            onClick={handleExportProductPerformance}
            disabled={productPerformance.length === 0}
          >
            📊 Export to Excel
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity Sold</th>
                <th>Revenue</th>
                <th>Cost</th>
                <th>Profit</th>
                <th>Margin %</th>
              </tr>
            </thead>
            <tbody>
              {productPerformance.slice(0, 20).map((item, index) => (
                <tr key={index}>
                  <td>{item.name_mm || item.name}</td>
                  <td>{item.total_quantity}</td>
                  <td>{item.total_revenue.toLocaleString()} Ks</td>
                  <td>{item.total_cost.toLocaleString()} Ks</td>
                  <td style={{ color: item.profit > 0 ? '#10b981' : '#dc2626', fontWeight: '600' }}>
                    {item.profit.toLocaleString()} Ks
                  </td>
                  <td style={{ color: item.profit_margin > 0 ? '#10b981' : '#dc2626' }}>
                    {item.profit_margin}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
