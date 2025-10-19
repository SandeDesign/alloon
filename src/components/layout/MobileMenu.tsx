import React from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { MobileNavigationGroup } from './MobileNavigationGroup';
import { CompanySelector } from '../ui/CompanySelector';
import { useAuth } from '../../contexts/AuthContext';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navigation: NavigationItem[];
  userRole: string | null;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, navigation, userRole }) => {
  if (!isOpen) return null;

  const isEmployee = userRole === 'employee';

  // ✅ AANGEPAST: Groepeer navigation items voor loonmaatschappij structuur
  const mainNav = navigation.slice(0, 5).filter(item => item && item.roles.includes(userRole || ''));
  const timeNav = navigation.slice(5, 9).filter(item => item && item.roles.includes(userRole || ''));
  const financialNav = navigation.slice(9, 13).filter(item => item && item.roles.includes(userRole || ''));
  const systemNav = navigation.slice(13).filter(item => item && item.roles.includes(userRole || ''));

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden backdrop-blur-sm"
        onClick={onClose}
      />

      <div className={`fixed inset-y-0 left-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-full flex-col">
          {/* ✅ Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100">
            <img src="/Logo-groot.png" alt="AlloonApp Logo" className="h-10 w-auto object-contain" />
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* ✅ AANGEPAST: Company Selector - Alleen voor Admin/Manager */}
            {(userRole === 'admin' || userRole === 'manager') && (
              <div className="p-4 border-b border-gray-100">
                <CompanySelector />
              </div>
            )}

            {/* ✅ Navigation */}
            <nav className="flex-1 space-y-6 px-4 py-6">
              
              {/* Hoofdmenu */}
              {mainNav.length > 0 && (
                isEmployee ? (
                  <div className="space-y-2">
                    <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Hoofdmenu
                    </h3>
                    {mainNav.map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center px-4 py-3 text-base font-medium rounded-xl transition-colors ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`
                        }
                      >
                        <item.icon className="mr-4 h-6 w-6" />
                        {item.name}
                      </NavLink>
                    ))}
                  </div>
                ) : (
                  <MobileNavigationGroup
                    title="Hoofdmenu"
                    items={mainNav}
                    onItemClick={onClose}
                    storageKey="mobile-nav-main"
                    defaultOpen={true}
                  />
                )
              )}

              {/* Tijd & Aanwezigheid */}
              {timeNav.length > 0 && (
                isEmployee ? (
                  <div className="space-y-2">
                    <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Tijd & Aanwezigheid
                    </h3>
                    {timeNav.map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center px-4 py-3 text-base font-medium rounded-xl transition-colors ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`
                        }
                      >
                        <item.icon className="mr-4 h-6 w-6" />
                        {item.name}
                      </NavLink>
                    ))}
                  </div>
                ) : (
                  <MobileNavigationGroup
                    title="Tijd & Aanwezigheid"
                    items={timeNav}
                    onItemClick={onClose}
                    storageKey="mobile-nav-time-attendance"
                    defaultOpen={false}
                  />
                )
              )}

              {/* Financieel */}
              {financialNav.length > 0 && (
                isEmployee ? (
                  <div className="space-y-2">
                    <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Financieel
                    </h3>
                    {financialNav.map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center px-4 py-3 text-base font-medium rounded-xl transition-colors ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`
                        }
                      >
                        <item.icon className="mr-4 h-6 w-6" />
                        {item.name}
                      </NavLink>
                    ))}
                  </div>
                ) : (
                  <MobileNavigationGroup
                    title="Financieel"
                    items={financialNav}
                    onItemClick={onClose}
                    storageKey="mobile-nav-financial"
                    defaultOpen={false}
                  />
                )
              )}

              {/* Systeem */}
              {systemNav.length > 0 && (
                isEmployee ? (
                  <div className="space-y-2">
                    <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Systeem
                    </h3>
                    {systemNav.map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center px-4 py-3 text-base font-medium rounded-xl transition-colors ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`
                        }
                      >
                        <item.icon className="mr-4 h-6 w-6" />
                        {item.name}
                      </NavLink>
                    ))}
                  </div>
                ) : (
                  <MobileNavigationGroup
                    title="Systeem"
                    items={systemNav}
                    onItemClick={onClose}
                    storageKey="mobile-nav-system"
                    defaultOpen={false}
                  />
                )
              )}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};