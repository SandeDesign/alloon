import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Clock, 
  FileText, 
  Settings,
  Users,
  Building2,
  Menu
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface MobileBottomNavProps {
  onMenuClick: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onMenuClick }) => {
  const { userRole } = useAuth();
  
  if (!userRole) return null;

  // Define core navigation items based on role (4 items max)
  const getCoreNavItems = () => {
    if (userRole === 'employee') {
      return [
        { href: '/', icon: Home, label: 'Dashboard' },
        { href: '/timesheets', icon: Clock, label: 'Uren' },
        { href: '/payslips', icon: FileText, label: 'Loonstrook' },
        { href: '/settings', icon: Settings, label: 'Profiel' },
      ];
    }
    
    if (userRole === 'manager') {
      return [
        { href: '/', icon: Home, label: 'Dashboard' },
        { href: '/employees', icon: Users, label: 'Team' },
        { href: '/timesheets', icon: Clock, label: 'Uren' },
        { href: '/settings', icon: Settings, label: 'Instellingen' },
      ];
    }
    
    // Admin
    return [
      { href: '/', icon: Home, label: 'Dashboard' },
      { href: '/companies', icon: Building2, label: 'Bedrijven' },
      { href: '/employees', icon: Users, label: 'Werknemers' },
      { href: '/timesheets', icon: Clock, label: 'Uren' },
    ];
  };

  const coreNavItems = getCoreNavItems();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-1 py-2 z-30 shadow-lg">
      <div className="flex justify-around items-center">
        {/* Core navigation items */}
        {coreNavItems.map(({ href, icon: Icon, label }) => (
          <NavLink
            key={href}
            to={href}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center px-2 py-2 min-w-0 flex-1 text-xs font-medium transition-all duration-200 relative ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-lg mb-1 transition-all duration-200 ${
                  isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}>
                  <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                </div>
                <span className="truncate text-xs">{label}</span>
                {isActive && (
                  <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
        
        {/* Menu button - 5th item - NU WERKT IE */}
        <button
          onClick={() => {
            console.log('Menu button clicked!'); // Debug log
            onMenuClick();
          }}
          className="flex flex-col items-center justify-center px-2 py-2 min-w-0 flex-1 text-xs font-medium text-gray-500 hover:text-gray-700 transition-all duration-200 hover:bg-gray-50 rounded-lg active:bg-gray-100"
        >
          <div className="p-1.5 rounded-lg mb-1 hover:bg-gray-100 transition-colors">
            <Menu className="h-5 w-5" />
          </div>
          <span className="truncate text-xs">Menu</span>
        </button>
      </div>
    </nav>
  );
};