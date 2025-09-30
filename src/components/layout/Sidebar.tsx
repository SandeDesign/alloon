import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Clock,
  Calculator,
  FileText,
  BookOpen,
  Download,
  Settings,
  Moon,
  Sun,
  LogOut,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Bedrijven', href: '/companies', icon: Building2 },
  { name: 'Werknemers', href: '/employees', icon: Users },
  { name: 'Uren', href: '/hours', icon: Clock },
  { name: 'Loonberekening', href: '/payroll', icon: Calculator },
  { name: 'Loonstroken', href: '/payslips', icon: FileText },
  { name: 'Regelgeving', href: '/regulations', icon: BookOpen },
  { name: 'Export', href: '/export', icon: Download },
  { name: 'Instellingen', href: '/settings', icon: Settings },
];

const Sidebar: React.FC = () => {
  const { darkMode, toggleDarkMode } = useApp();
  const { user, signOut } = useAuth();

  return (
    <div className="flex h-screen w-72 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-elevation-2">
      {/* Logo */}
      <div className="flex h-20 items-center justify-center px-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-elevation-2">
            <Calculator className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              AlloonApp
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Loonadministratie
            </p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold shadow-elevation-2">
            {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white truncate">
              {user?.displayName || 'Gebruiker'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-4 py-6 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 shadow-elevation-1'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800'
              }`
            }
          >
            <item.icon className={`mr-4 h-5 w-5 transition-colors ${
              ({ isActive }: { isActive: boolean }) => isActive ? 'text-primary-600 dark:text-primary-400' : ''
            }`} />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Theme Toggle & Logout */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-2">
        <button
          onClick={toggleDarkMode}
          className="flex w-full items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
        >
          {darkMode ? (
            <Sun className="mr-4 h-5 w-5" />
          ) : (
            <Moon className="mr-4 h-5 w-5" />
          )}
          {darkMode ? 'Lichte modus' : 'Donkere modus'}
        </button>
        
        <button
          onClick={signOut}
          className="flex w-full items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-300 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200"
        >
          <LogOut className="mr-4 h-5 w-5" />
          Uitloggen
        </button>
      </div>
    </div>
  );
};

export default Sidebar;