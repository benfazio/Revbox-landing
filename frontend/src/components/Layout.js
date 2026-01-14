import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Upload, 
  ClipboardCheck,
  AlertTriangle,
  DollarSign,
  LogOut,
  FileSpreadsheet
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/carriers', label: 'Carriers', icon: Building2 },
  { path: '/agents', label: 'Agents', icon: Users },
  { path: '/upload', label: 'Upload Center', icon: Upload },
  { path: '/review', label: 'Data Review', icon: ClipboardCheck },
  { path: '/conflicts', label: 'Conflicts', icon: AlertTriangle },
  { path: '/payouts', label: 'Payouts', icon: DollarSign },
];

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg tracking-tight">PayoutHub</h1>
              <p className="text-xs text-slate-400">Insurance Aggregator</p>
            </div>
          </div>
        </div>

        <nav className="py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <item.icon className="nav-item-icon" />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
