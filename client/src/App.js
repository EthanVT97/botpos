import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { RealtimeProvider } from './contexts/RealtimeContext';
import ErrorBoundary from './components/ErrorBoundary';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import BotFlows from './pages/BotFlows';
import FlowBuilder from './pages/FlowBuilder';
import UOM from './pages/UOM';
import SellingPrice from './pages/SellingPrice';
import Stores from './pages/Stores';
import StoreTransfers from './pages/StoreTransfers';
import Messages from './pages/Messages';
import NotFound from './pages/NotFound';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AuthProvider>
          <RealtimeProvider>
            <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Private routes */}
            <Route path="/" element={
              <PrivateRoute requiredPermission="dashboard">
                <Layout><Dashboard /></Layout>
              </PrivateRoute>
            } />
            <Route path="/analytics" element={
              <PrivateRoute requiredPermission="reports">
                <Layout><Analytics /></Layout>
              </PrivateRoute>
            } />
            <Route path="/pos" element={
              <PrivateRoute requiredPermission="pos">
                <Layout><POS /></Layout>
              </PrivateRoute>
            } />
            <Route path="/products" element={
              <PrivateRoute requiredPermission="products">
                <Layout><Products /></Layout>
              </PrivateRoute>
            } />
            <Route path="/categories" element={
              <PrivateRoute requiredPermission="categories">
                <Layout><Categories /></Layout>
              </PrivateRoute>
            } />
            <Route path="/customers" element={
              <PrivateRoute requiredPermission="customers">
                <Layout><Customers /></Layout>
              </PrivateRoute>
            } />
            <Route path="/orders" element={
              <PrivateRoute requiredPermission="orders">
                <Layout><Orders /></Layout>
              </PrivateRoute>
            } />
            <Route path="/inventory" element={
              <PrivateRoute requiredPermission="inventory">
                <Layout><Inventory /></Layout>
              </PrivateRoute>
            } />
            <Route path="/reports" element={
              <PrivateRoute requiredPermission="reports">
                <Layout><Reports /></Layout>
              </PrivateRoute>
            } />
            <Route path="/settings" element={
              <PrivateRoute requiredPermission="settings">
                <Layout><Settings /></Layout>
              </PrivateRoute>
            } />
            <Route path="/bot-flows" element={
              <PrivateRoute requiredPermission="bot_flows">
                <Layout><BotFlows /></Layout>
              </PrivateRoute>
            } />
            <Route path="/bot-flows/:id" element={
              <PrivateRoute requiredPermission="bot_flows">
                <Layout><FlowBuilder /></Layout>
              </PrivateRoute>
            } />
            <Route path="/uom" element={
              <PrivateRoute requiredPermission="uom">
                <Layout><UOM /></Layout>
              </PrivateRoute>
            } />
            <Route path="/sellingprice" element={
              <PrivateRoute requiredPermission="selling_price">
                <Layout><SellingPrice /></Layout>
              </PrivateRoute>
            } />
            <Route path="/stores" element={
              <PrivateRoute requiredPermission="stores">
                <Layout><Stores /></Layout>
              </PrivateRoute>
            } />
            <Route path="/store-transfers" element={
              <PrivateRoute requiredPermission="stores">
                <Layout><StoreTransfers /></Layout>
              </PrivateRoute>
            } />
            <Route path="/messages" element={
              <PrivateRoute requiredPermission="dashboard">
                <Layout><Messages /></Layout>
              </PrivateRoute>
            } />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
            </Router>
          </RealtimeProvider>
        </AuthProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
