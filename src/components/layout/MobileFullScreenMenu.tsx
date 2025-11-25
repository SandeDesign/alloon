import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  X,
  ChevronRight,
  Users,
  Wallet,
  Factory,
  Download,
  User,
  Settings,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { navigation } from './Sidebar';

interface MobileFullScreenMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuSection {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  items: typeof navigation;
}

export const MobileFullScreenMenu: React.FC<MobileFullScreenMenuProps> = ({ isOpen, onClose }) => {
  const { userRole, signOut } = useAuth();
  const { companies, selectedCompany, setSelectedCompany } = useApp();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  if (!isOpen) return null;

  const companyType = selectedCompany?.companyType as 'employer' | 'project' | undefined;

  // Filter navigation by role AND company type
  const filteredNavigation = navigation.filter(item => {
    const roleMatches = userRole && item.roles.includes(userRole);
    const companyTypeMatches = !companyType || !item.companyTypes || item.companyTypes.includes(companyType);
    return roleMatches && companyTypeMatches;
  });

  // Dashboard item (standalone)
  const dashboardItem = filteredNavigation.find(i => i.name === 'Dashboard');

  // Sections matching Sidebar
  const menuSections: MenuSection[] = [
    {
      title: 'HR',
      icon: Users,
      color: 'bg-blue-500',
      items: filteredNavigation.filter(i =>
        ['Werknemers', 'Uren Goedkeuren', 'Verlof Beheren', 'Verzuim Beheren', 'Mijn Team'].includes(i.name)
      )
    },
    {
      title: 'Financieel',
      icon: Wallet,
      color: 'bg-emerald-500',
      items: filteredNavigation.filter(i =>
        ['Klanten & Leveranciers', 'Begroting', 'Verkoop', 'Inkoop Upload', 'Inkoop Overzicht', 'Declaraties'].includes(i.name)
      )
    },
    {
      title: 'Project',
      icon: Factory,
      color: 'bg-orange-500',
      items: filteredNavigation.filter(i => ['Productie', 'Project Stats'].includes(i.name))
    },
    {
      title: 'Data',
      icon: Download,
      color: 'bg-purple-500',
      items: filteredNavigation.filter(i => ['Uren Export', 'Loonstroken', 'Drive'].includes(i.name))
    },
    {
      title: 'Mijn Zaken',
      icon: User,
      color: 'bg-cyan-500',
      items: filteredNavigation.filter(i =>
        ['Mijn Uren', 'Mijn Verlof', 'Mijn Declaraties', 'Mijn Loonstroken', 'Verlof Goedkeuren'].includes(i.name)
      )
    },
    {
      title: 'Systeem',
      icon: Settings,
      color: 'bg-gray-500',
      items: filteredNavigation.filter(i => ['Bedrijven', 'Audit Log', 'Instellingen'].includes(i.name))
    },
  ].filter(section => section.items.length > 0);

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionTitle)
        ? prev.filter(s => s !== sectionTitle)
        : [...prev, sectionTitle]
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
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-out overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">FLG-Administratie</h2>
              <p className="text-xs text-gray-500 truncate">{selectedCompany?.name || 'Menu'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Company Selector - Only for admin */}
        {userRole === 'admin' && companies && companies.length > 0 && (
          <div className="p-4 border-b border-gray-100 flex-shrink-0">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Bedrijf
            </label>
            <select
              value={selectedCompany?.id || ''}
              onChange={(e) => {
                const company = companies.find(c => c.id === e.target.value);
                if (company) setSelectedCompany(company);
              }}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
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

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          
          {/* Dashboard */}
          {dashboardItem && (
            <div className="pb-3 mb-2 border-b border-gray-100">
              <NavLink
                to={dashboardItem.href}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-50 to-indigo-50 text-primary-700 shadow-sm border border-primary-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`p-2 rounded-lg transition-all duration-200 ${
                      isActive ? 'bg-primary-500 shadow-sm' : 'bg-gray-100'
                    }`}>
                      <LayoutDashboard className={`h-4 w-4 ${
                        isActive ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <span>Dashboard</span>
                  </>
                )}
              </NavLink>
            </div>
          )}

          {/* Sections */}
          {menuSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 rounded-lg transition-colors duration-200 group"
              >
                <div className="flex items-center space-x-2">
                  <div className={`p-1.5 rounded-md ${section.color}`}>
                    <section.icon className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{section.title}</span>
                </div>
                <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                  expandedSections.includes(section.title) ? 'rotate-90' : ''
                }`} />
              </button>

              {/* Section Items */}
              {expandedSections.includes(section.title) && (
                <div className="space-y-0.5 ml-2 pl-3 border-l border-gray-100">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                          isActive
                            ? 'bg-gradient-to-r from-primary-50 to-indigo-50 text-primary-700 shadow-sm border border-primary-200'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className={`p-1.5 rounded-lg transition-all duration-200 ${
                            isActive ? 'bg-primary-500 shadow-sm' : 'bg-gray-100'
                          }`}>
                            <item.icon className={`h-3.5 w-3.5 ${
                              isActive ? 'text-white' : 'text-gray-600'
                            }`} />
                          </div>
                          <span className="font-medium">{item.name}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 p-4 bg-gradient-to-r from-slate-50 to-gray-50 flex-shrink-0">
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
  );
};

export default MobileFullScreenMenu;