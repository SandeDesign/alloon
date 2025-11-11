import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  X, 
  ChevronDown, 
  ChevronRight,
  LayoutDashboard,
  Building2,
  Users,
  Clock,
  Calendar,
  HeartPulse,
  FileText,
  Upload,
  Download,
  Settings,
  LogOut,
  Shield,
  Activity,
  Receipt,
  Send,
  FolderOpen,
  TrendingUp,
  UserCheck,
  Briefcase,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

interface MobileFullScreenMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuCategory {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    roles: string[];
    companyTypes?: ('employer' | 'project')[]; // ✅ NEW
    color?: string;
  }[];
}

export const MobileFullScreenMenu: React.FC<MobileFullScreenMenuProps> = ({ isOpen, onClose }) => {
  const { userRole, signOut } = useAuth();
  const { companies, selectedCompany, setSelectedCompany } = useApp();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  if (!isOpen) return null;

  const companyType = selectedCompany?.companyType as 'employer' | 'project' | undefined; // ✅ NEW

  // ✅ NEW: Updated menu with company types
  const menuCategories: MenuCategory[] = [
    {
      title: 'Personeel',
      icon: Activity,
      items: [
        { name: 'Werknemers', href: '/employees', icon: Users, roles: ['admin', 'manager'], companyTypes: ['employer'], color: 'text-emerald-600' },
        { name: 'Urenregistratie', href: '/timesheets', icon: Clock, roles: ['admin', 'employee', 'manager'], companyTypes: ['employer'], color: 'text-amber-600' },
        { name: 'Uren Goedkeuren', href: '/timesheet-approvals', icon: Clock, roles: ['admin', 'manager'], companyTypes: ['employer'], color: 'text-blue-600' },
        { name: 'Verlof Goedkeuren', href: '/admin/leave-approvals', icon: Calendar, roles: ['admin', 'manager'], companyTypes: ['employer'], color: 'text-rose-600' },
        { name: 'Verzuim Beheren', href: '/admin/absence-management', icon: HeartPulse, roles: ['admin', 'manager'], companyTypes: ['employer'], color: 'text-red-600' },
      ]
    },
    {
      title: 'Facturatie',
      icon: Receipt,
      items: [
        { name: 'Relaties', href: '/invoice-relations', icon: UserCheck, roles: ['admin'], companyTypes: ['employer', 'project'], color: 'text-indigo-600' },
        { name: 'Uitgaande Facturen', href: '/outgoing-invoices', icon: Send, roles: ['admin'], companyTypes: ['employer', 'project'], color: 'text-green-600' },
        { name: 'Inkomende Facturen', href: '/incoming-invoices', icon: Upload, roles: ['admin'], companyTypes: ['employer', 'project'], color: 'text-orange-600' },
      ]
    },
    {
      title: 'Project',
      icon: Briefcase,
      items: [
        { name: 'Productie', href: '/project-production', icon: Briefcase, roles: ['admin'], companyTypes: ['project'], color: 'text-cyan-600' },
        { name: 'Statistieken', href: '/project-statistics', icon: BarChart3, roles: ['admin'], companyTypes: ['project'], color: 'text-purple-600' },
      ]
    },
    {
      title: 'Data & Exports',
      icon: TrendingUp,
      items: [
        { name: 'Uren Export', href: '/timesheet-export', icon: Download, roles: ['admin', 'manager'], companyTypes: ['employer'], color: 'text-cyan-600' },
        { name: 'Drive Bestanden', href: '/drive-files', icon: FolderOpen, roles: ['admin'], companyTypes: ['employer'], color: 'text-fuchsia-600' },
      ]
    },
    {
      title: 'Systeem',
      icon: Settings,
      items: [
        { name: 'Bedrijven', href: '/companies', icon: Building2, roles: ['admin'], companyTypes: ['employer'], color: 'text-blue-600' },
        { name: 'Loonstroken', href: '/payslips', icon: FileText, roles: ['admin', 'employee', 'manager'], companyTypes: ['employer', 'project'], color: 'text-teal-600' },
        { name: 'Audit Log', href: '/audit-log', icon: Shield, roles: ['admin'], companyTypes: ['employer'], color: 'text-slate-600' },
        { name: 'Instellingen', href: '/settings', icon: Settings, roles: ['admin', 'employee', 'manager'], companyTypes: ['employer', 'project'], color: 'text-gray-600' },
      ]
    }
  ];

  // ✅ NEW: Filter categories and items by role AND company type
  const filteredCategories = menuCategories
    .map(category => ({
      ...category,
      items: category.items.filter(item => {
        const roleMatches = item.roles.includes(userRole || '');
        const companyTypeMatches = !companyType || !item.companyTypes || item.companyTypes.includes(companyType);
        return roleMatches && companyTypeMatches;
      })
    }))
    .filter(category => category.items.length > 0);

  const toggleCategory = (categoryTitle: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryTitle)
        ? prev.filter(cat => cat !== categoryTitle)
        : [...prev, categoryTitle]
    );
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Menu Content */}
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Menu</h2>
                <p className="text-xs text-gray-500">{selectedCompany?.name || 'AlloonApp'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Company Selector - Only for admin */}
          {userRole === 'admin' && companies && companies.length > 0 && (
            <div className="p-4 border-b border-gray-100 bg-white">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Actief Bedrijf
              </label>
              <select
                value={selectedCompany?.id || ''}
                onChange={(e) => {
                  const company = companies.find(c => c.id === e.target.value);
                  if (company) setSelectedCompany(company);
                }}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Selecteer bedrijf</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name} {company.companyType === 'project' ? '(Project)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Navigation Categories */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-3">
              {/* ✅ DASHBOARD - SOLO (NO SECTION) */}
              <NavLink
                to="/"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`p-2 rounded-lg transition-colors ${
                      isActive ? 'bg-blue-500/10' : 'bg-gray-100'
                    }`}>
                      <LayoutDashboard className={`h-5 w-5 ${
                        isActive ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <span className="font-medium">{isActive && '✓'} Dashboard</span>
                  </>
                )}
              </NavLink>

              <div className="border-t border-gray-100 my-2" />

              {/* ✅ SECTIONS */}
              {filteredCategories.map((category) => (
                <div key={category.title} className="space-y-1">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category.title)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 rounded-lg transition-colors duration-200 group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg group-hover:from-blue-50 group-hover:to-blue-100 transition-colors">
                        <category.icon className="h-4 w-4 text-gray-600 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{category.title}</span>
                    </div>
                    <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                      expandedCategories.includes(category.title) ? 'rotate-90' : ''
                    }`} />
                  </button>

                  {/* Category Items */}
                  {expandedCategories.includes(category.title) && (
                    <div className="pl-4 space-y-1 border-l-2 border-gray-100 ml-3 my-1">
                      {category.items.map((item) => (
                        <NavLink
                          key={item.name}
                          to={item.href}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                              isActive
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <div className={`p-1.5 rounded-md transition-all ${
                                isActive 
                                  ? `bg-${item.color?.split('-')[1]}-100` 
                                  : 'bg-gray-100'
                              }`}>
                                <item.icon className={`h-4 w-4 ${
                                  isActive ? item.color || 'text-blue-600' : 'text-gray-500'
                                }`} />
                              </div>
                              <span>{isActive && '→'} {item.name}</span>
                            </>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 p-4 bg-white">
            <button
              onClick={() => {
                signOut();
                onClose();
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span>Uitloggen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileFullScreenMenu;