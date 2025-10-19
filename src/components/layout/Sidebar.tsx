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
  DollarSign,
  Briefcase,
  UserCheck,
  CalendarCheck,
  TrendingUp
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { CompanySelector } from '../ui/CompanySelector';
import { NavigationGroup } from './NavigationGroup';

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

// ✅ AANGEPAST: Navigation items voor loonmaatschappij/werkmaatschappij
export const navigation: NavigationItem[] = [
  // Dashboard
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'employee'] },
  
  // ✅ AANGEPAST: Bedrijfsbeheer - Alleen Admin
  { name: 'Loonmaatschappij', href: '/payroll-company', icon: DollarSign, roles: ['admin'] },
  { name: 'Werkmaatschappijen', href: '/work-companies', icon: Briefcase, roles: ['admin'] },
  
  // Werknemerbeheer
  { name: 'Werknemers', href: '/employees', icon: Users, roles: ['admin', 'manager'] },
  { name: 'Team', href: '/team', icon: UserCheck, roles: ['manager'] },
  
  // Tijd & Aanwezigheid
  { name: 'Urenregistratie', href: '/timesheets', icon: Clock, roles: ['admin', 'manager', 'employee'] },
  { name: 'Uren Goedkeuren', href: '/timesheet-approvals', icon: CalendarCheck, roles: ['admin', 'manager'] },
  { name: 'Verlofaanvragen', href: '/leave-requests', icon: Calendar, roles: ['admin', 'manager', 'employee'] },
  { name: 'Verzuimbeheer', href: '/absence-management', icon: HeartPulse, roles: ['admin', 'manager'] },
  
  // ✅ AANGEPAST: Financieel met werkmaatschappij focus
  { name: 'Loonverwerking', href: '/payroll-processing', icon: Calculator, roles: ['admin'] },
  { name: 'Loonstroken', href: '/payslips', icon: FileText, roles: ['admin', 'manager', 'employee'] },
  { name: 'Werkmaatschappij Facturatie', href: '/work-company-billing', icon: TrendingUp, roles: ['admin'] },
  { name: 'Declaraties', href: '/expenses', icon: Receipt, roles: ['admin', 'manager', 'employee'] },
  
  // Rapportage
  { name: 'Loonaangiftes', href: '/tax-returns', icon: BookOpen, roles: ['admin'] },
  { name: 'Exports', href: '/exports', icon: Download, roles: ['admin'] },
  { name: 'Audit Log', href: '/audit-log', icon: Shield, roles: ['admin'] },
  
  // Systeem
  { name: 'Instellingen', href: '/settings', icon: Settings, roles: ['admin', 'manager', 'employee'] },
];

// ✅ AANGEPAST: Gegroepeerde navigatie items
const mainNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'manager'] },
  { name: 'Loonmaatschappij', href: '/payroll-company', icon: DollarSign, roles: ['admin'] },
  { name: 'Werkmaatschappijen', href: '/work-companies', icon: Briefcase, roles: ['admin'] },
  { name: 'Werknemers', href: '/employees', icon: Users, roles: ['admin', 'manager'] },
  { name: 'Team', href: '/team', icon: UserCheck, roles: ['manager'] },
];

const timeNavigation: NavigationItem[] = [
  { name: 'Urenregistratie', href: '/timesheets', icon: Clock, roles: ['admin', 'manager', 'employee'] },
  { name: 'Uren Goedkeuren', href: '/timesheet-approvals', icon: CalendarCheck, roles: ['admin', 'manager'] },
  { name: 'Verlofaanvragen', href: '/leave-requests', icon: Calendar, roles: ['admin', 'manager', 'employee'] },
  { name: 'Verzuimbeheer', href: '/absence-management', icon: HeartPulse, roles: ['admin', 'manager'] },
];

const financialNavigation: NavigationItem[] = [
  { name: 'Loonverwerking', href: '/payroll-processing', icon: Calculator, roles: ['admin'] },
  { name: 'Loonstroken', href: '/payslips', icon: FileText, roles: ['admin', 'manager', 'employee'] },
  { name: 'Werkmaatschappij Facturatie', href: '/work-company-billing', icon: TrendingUp, roles: ['admin'] },
  { name: 'Declaraties', href: '/expenses', icon: Receipt, roles: ['admin', 'manager', 'employee'] },
];

const systemNavigation: NavigationItem[] = [
  { name: 'Loonaangiftes', href: '/tax-returns', icon: BookOpen, roles: ['admin'] },
  { name: 'Exports', href: '/exports', icon: Download, roles: ['admin'] },
  { name: 'Audit Log', href: '/audit-log', icon: Shield, roles: ['admin'] },
  { name: 'Instellingen', href: '/settings', icon: Settings, roles: ['admin', 'manager', 'employee'] },
];

const Sidebar: React.FC = () => {
  const { signOut, userRole } = useAuth();

  // Filter navigation items based on user role
  const filteredMainNav = mainNavigation.filter(item => 
    userRole && item.roles.includes(userRole)
  );
  const filteredTimeNav = timeNavigation.filter(item => 
    userRole && item.roles.includes(userRole)
  );
  const filteredFinancialNav = financialNavigation.filter(item => 
    userRole && item.roles.includes(userRole)
  );
  const filteredSystemNav = systemNavigation.filter(item => 
    userRole && item.roles.includes(userRole)
  );

  const isEmployee = userRole === 'employee';

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:bg-white lg:border-r lg:border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-200 px-6">
        <img src="/Logo-groot.png" alt="AlloonApp Logo" className="h-10 w-auto" />
      </div>

      {/* ✅ AANGEPAST: Company Selector - Alleen voor Admin/Manager */}
      {(userRole === 'admin' || userRole === 'manager') && (
        <div className="border-b border-gray-100 p-4">
          <CompanySelector />
        </div>
      )}

      {/* Notifications */}
      <div className="border-b border-gray-100 p-4">
        <NotificationCenter />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 px-4 py-6 overflow-y-auto">
        
        {/* ✅ Main Navigation */}
        {filteredMainNav.length > 0 && (
          isEmployee ? (
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Hoofdmenu
              </div>
              {filteredMainNav.map((item) => (
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
            </div>
          ) : (
            <NavigationGroup
              title="Hoofdmenu"
              items={filteredMainNav}
              storageKey="nav-main"
              defaultOpen={true}
            />
          )
        )}

        {/* ✅ Time & Attendance Navigation */}
        {filteredTimeNav.length > 0 && (
          isEmployee ? (
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Tijd & Aanwezigheid
              </div>
              {filteredTimeNav.map((item) => (
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
            </div>
          ) : (
            <NavigationGroup
              title="Tijd & Aanwezigheid"
              items={filteredTimeNav}
              storageKey="nav-time-attendance"
              defaultOpen={false}
            />
          )
        )}

        {/* ✅ Financial Navigation */}
        {filteredFinancialNav.length > 0 && (
          isEmployee ? (
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Financieel
              </div>
              {filteredFinancialNav.map((item) => (
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
            </div>
          ) : (
            <NavigationGroup
              title="Financieel"
              items={filteredFinancialNav}
              storageKey="nav-financial"
              defaultOpen={false}
            />
          )
        )}

        {/* ✅ System Navigation */}
        {filteredSystemNav.length > 0 && (
          isEmployee ? (
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Systeem
              </div>
              {filteredSystemNav.map((item) => (
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
            </div>
          ) : (
            <NavigationGroup
              title="Systeem"
              items={filteredSystemNav}
              storageKey="nav-system"
              defaultOpen={false}
            />
          )
        )}
      </nav>

      {/* ✅ User Actions */}
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