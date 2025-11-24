import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, Users, 
  ShoppingBag, Warehouse, BarChart3, Settings, Menu, X, Store, ArrowLeftRight, MessageCircle
} from 'lucide-react';
import './Layout.css';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavClick = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', labelMm: 'ပင်မစာမျက်နှာ' },
    { path: '/pos', icon: ShoppingCart, label: 'POS', labelMm: 'ရောင်းချရန်' },
    { path: '/messages', icon: MessageCircle, label: 'Messages', labelMm: 'မက်ဆေ့ခ်ျများ' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics', labelMm: 'ခွဲခြမ်းစိတ်ဖြာမှု' },
    { path: '/products', icon: Package, label: 'Products', labelMm: 'ကုန်ပစ္စည်းများ' },
    { path: '/sellingprice', icon: ShoppingBag, label: 'Selling Price', labelMm: 'ရောင်းဈေး' },
    { path: '/categories', icon: ShoppingBag, label: 'Categories', labelMm: 'အမျိုးအစားများ' },
    { path: '/uom', icon: Package, label: 'UOM', labelMm: 'တိုင်းတာမှုယူနစ်' },
    { path: '/customers', icon: Users, label: 'Customers', labelMm: 'ဖောက်သည်များ' },
    { path: '/orders', icon: ShoppingBag, label: 'Orders', labelMm: 'မှာယူမှုများ' },
    { path: '/inventory', icon: Warehouse, label: 'Inventory', labelMm: 'စာရင်းကိုင်' },
    { path: '/stores', icon: Store, label: 'Stores', labelMm: 'ဆိုင်များ' },
    { path: '/store-transfers', icon: ArrowLeftRight, label: 'Transfers', labelMm: 'လွှဲပြောင်းမှု' },
    { path: '/reports', icon: BarChart3, label: 'Reports', labelMm: 'အစီရင်ခံစာများ' },
    { path: '/bot-flows', icon: Package, label: 'Bot Flows', labelMm: 'ဘော့ဖလိုး' },
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
                onClick={handleNavClick}
              >
                <Icon size={20} />
                <div className="nav-label">
                  <span>{item.label}</span>
                  <span className="nav-label-mm">{item.labelMm}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className={`main-content ${sidebarOpen ? '' : 'expanded'}`}>
        <button 
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu size={24} />
        </button>
        {children}
      </main>
    </div>
  );
};

export default Layout;
