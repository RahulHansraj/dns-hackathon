import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect } from 'react';
import { notificationsAPI } from '../services/api';
import LanguageSwitcher from './LanguageSwitcher';
import { 
  Home, 
  BarChart3, 
  CheckCircle, 
  Bell, 
  User, 
  Sun, 
  Moon, 
  LogOut,
  Menu,
  X 
} from 'lucide-react';

export default function Layout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadUnreadCount();
    // Poll for notifications every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const res = await notificationsAPI.getUnreadCount();
      setUnreadCount(res.data.count);
    } catch (error) {
      console.error('Failed to load notification count');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: Home, label: t('nav.home') },
    { path: '/analyze', icon: BarChart3, label: t('nav.analyze') },
    { path: '/confirmed', icon: CheckCircle, label: t('nav.confirmed') },
    { path: '/notifications', icon: Bell, label: t('nav.alerts'), badge: unreadCount },
  ];

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: 'url(/images/farm-bg.jpg)' }}
    >
      {/* Dark overlay for readability */}
      <div className="min-h-screen bg-black/60">
        {/* Top Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-amoled-card border-b border-gray-200 dark:border-amoled-border">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 -ml-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="text-xl font-bold text-primary-600">
              {t('common.farmMarket')}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={t('nav.toggleTheme')}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <NavLink 
              to="/profile" 
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <User size={20} />
              <span className="text-sm font-medium">{user?.fullName?.split(' ')[0]}</span>
            </NavLink>
            
            <button
              onClick={handleLogout}
              className="hidden md:flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-14 left-0 bottom-0 w-64 bg-white dark:bg-amoled-card p-4">
            <nav className="space-y-2">
              {navItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`
                  }
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                  {item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
              <NavLink
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`
                }
              >
                <User size={20} />
                <span>{t('nav.profile')}</span>
              </NavLink>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-red-500"
              >
                <LogOut size={20} />
                <span>{t('nav.logout')}</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-14 pb-20 md:pb-6">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-amoled-card border-t border-gray-200 dark:border-amoled-border">
        <div className="flex justify-around items-center h-16">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full relative transition-colors ${
                  isActive ? 'text-primary-600' : 'text-gray-500'
                }`
              }
            >
              <item.icon size={22} />
              <span className="text-xs mt-1">{item.label}</span>
              {item.badge > 0 && (
                <span className="absolute top-2 right-1/4 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
      </div>
    </div>
  );
}
