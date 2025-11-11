import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Clock, 
  FileText, 
  Settings,
  Users,
  Building2,
  Menu,
  Send,
  Calendar
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
        { href: '/timesheet-approvals', icon: Calendar, label: 'Goedkeuren' },
      ];
    }
    
    // Admin - Uren Verwerken ipv Uren
    return [
      { href: '/', icon: Home, label: 'Dashboard' },
      { href: '/timesheet-approvals', icon: Clock, label: 'Uren Verwerken' },
      { href: '/outgoing-invoices', icon: Send, label: 'Facturen' },
      { href: '/employees', icon: Users, label: 'Werknemers' },
    ];
  };

  const coreNavItems = getCoreNavItems();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-1 py-4 z-30 shadow-lg">
      <div className="flex justify-around items-center">
        {/* Core navigation items - ALLEEN ICOONTJES */}
        {coreNavItems.map(({ href, icon: Icon, label }) => (
          <NavLink
            key={href}
            to={href}
            title={label}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center px-3 py-2 min-w-0 flex-1 transition-all duration-200 relative ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-2 rounded-lg transition-all duration-200 ${
                  isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}>
                  <Icon className={`h-7 w-7 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                </div>
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full" />
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Menu button for accessing more options - ALLEEN ICOONTJE */}
        <button
          onClick={onMenuClick}
          title="Menu"
          className="flex flex-col items-center justify-center px-3 py-2 min-w-0 flex-1 text-gray-500 hover:text-gray-700 transition-all duration-200"
        >
          <div className="p-2 rounded-lg hover:bg-gray-50 transition-all duration-200">
            <Menu className="h-7 w-7" />
          </div>
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomNav;