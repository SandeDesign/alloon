import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  HeartPulse,
  Receipt,
  Clock,
  Calculator,
  FileText,
  BookOpen,
  Download,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { CompanySelector } from '../ui/CompanySelector';

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

export const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin'] },
  { name: 'Bedrijven', href: '/companies', icon: Building2, roles: ['admin'] },
  { name: 'Werknemers', href: '/employees', icon: Users, roles: ['admin'] },
  { name: 'Urenregistratie', href: '/timesheets', icon: Clock, roles: ['admin', 'employee'] },
  { name: 'Uren Goedkeuren', href: '/timesheet-approvals', icon: Calendar, roles: ['admin'] },
  { name: 'Verlof Goedkeuren', href: '/admin/leave-approvals', icon: Calendar, roles: ['admin'] },
  { name: 'Verzuim Beheren', href: '/admin/absence-management', icon: HeartPulse, roles: ['admin'] },
  { name: 'Declaraties', href: '/admin/expenses', icon: Receipt, roles: ['admin'] },
  { name: 'Loonverwerking', href: '/payroll-processing', icon: Calculator, roles: ['admin'] },
  { name: 'Loonstroken', href: '/payslips', icon: FileText, roles: ['admin', 'employee'] },
  { name: 'Loonaangiftes', href: '/tax-returns', icon: BookOpen, roles: ['admin'] },
  { name: 'Exports', href: '/exports', icon: Download, roles: ['admin'] },
  { name: 'Audit Log', href: '/audit-log', icon: Shield, roles: ['admin'] },
  { name: 'Instellingen', href: '/settings', icon: Settings, roles: ['admin', 'employee'] },
];

export const Sidebar: React.FC = () => {
  const { user, signOut, userRole } = useAuth();

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(userRole || '')
  );

  return (
    <div className="hidden lg:flex h-screen w-64 flex-col bg-white border-r border-gray-200 shadow-sm">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <img src="/Logo-groot.png" alt="AlloonApp Logo" className="h-10 w-40" />
        </div>
        <NotificationCenter />
      </div>


      {/* Company Selector */}
      {userRole === 'admin' && (
        <div className="px-4 py-3 border-b border-gray-100">
          <CompanySelector />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`
            }
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* User actions */}
      <div className="border-t border-gray-100 p-3">
        <button
          onClick={signOut}
          className="flex w-full items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Uitloggen
        </button>
      </div>
    </div>
  );
};

export default Sidebar;