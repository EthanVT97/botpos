import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, Users, 
  ShoppingBag, Warehouse, BarChart3, Settings, Menu, X 
} from 'lucide-react';
import './Layout.css';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', labelMm: 'ပင်မစာမျက်နှာ' },
    { path: '/pos', icon: ShoppingCart, label: 'POS', labelMm: 'ရောင်းချရန်' },
    { path: '/products', icon: Package, label: 'Products', labelMm: 'ကုန်ပစ္စည်းများ' },
    { path: '/categories', icon: ShoppingBag, label: 'Categories', labelMm: 'အမျိုးအစားများ' },
    { path: '/customers', icon: Users, label: 'Customers', labelMm: 'ဖောက်သည်များ' },
    { path: '/orders', icon: ShoppingBag, label: 'Orders', labelMm: 'မှာယူမှုများ' },
    { path: '/inventory', icon: Warehouse, label: 'Inventory', labelMm: 'စာရင်းကိုင်' },
    { path: '/reports', icon: BarChart3, label: 'Reports', labelMm: 'အစီရင်ခံစာများ' },
    { path: '/settings', icon: Settings, label: 'Settings', labelMm: 'ဆက်တင်များ' },
  ];

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">Myanmar POS</h1>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                {sidebarOpen && (
                  <div className="nav-label">
                    <span>{item.label}</span>
                    <span className="nav-label-mm">{item.labelMm}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className={`main-content ${sidebarOpen ? '' : 'expanded'}`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
