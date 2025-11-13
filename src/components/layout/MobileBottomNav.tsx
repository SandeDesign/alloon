import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Clock, 
  Settings,
  Users,
  Menu,
  CheckCircle2,
  Factory,
  TrendingUp,
  Send,
  ArrowDownLeft,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

interface MobileBottomNavProps {
  onMenuClick: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onMenuClick }) => {
  const { userRole } = useAuth();
  const { selectedCompany } = useApp();
  
  if (!userRole) return null;

  const companyType = selectedCompany?.companyType as 'employer' | 'project' | undefined;

  const getCoreNavItems = () => {
    // ✅ PROJECT COMPANY
    if (companyType === 'project') {
      return [
        { href: '/', icon: Home, label: 'Dashboard' },
        { href: '/project-production', icon: Factory, label: 'Productie' },
        { href: '/outgoing-invoices', icon: Send, label: 'Uitgaand' },
        { href: '/incoming-invoices', icon: ArrowDownLeft, label: 'Inkomend' },
      ];
    }

    // ✅ EMPLOYER COMPANY
    const navItems: Record<string, Array<{ href: string; icon: any; label: string }>> = {
      employee: [
        { href: '/', icon: Home, label: 'Dashboard' },
        { href: '/timesheets', icon: Clock, label: 'Uren' },
        { href: '/payslips', icon: CheckCircle2, label: 'Loonstrook' },
        { href: '/settings', icon: Settings, label: 'Profiel' },
      ],
      manager: [
        { href: '/', icon: Home, label: 'Dashboard' },
        { href: '/employees', icon: Users, label: 'Team' },
        { href: '/timesheets', icon: Clock, label: 'Uren' },
        { href: '/timesheet-approvals', icon: CheckCircle2, label: 'Beheren' },
      ],
      admin: [
        { href: '/', icon: Home, label: 'Dashboard' },
        { href: '/timesheet-approvals', icon: CheckCircle2, label: 'Uren' },
        { href: '/outgoing-invoices', icon: Send, label: 'Facturen' },
        { href: '/employees', icon: Users, label: 'Team' },
      ],
    };
    
    return navItems[userRole] || navItems.employee;
  };

  const coreNavItems = getCoreNavItems();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-lg" style={{ position: 'fixed', bottom: 0, width: '100%' }}>
      <div className="flex justify-around items-center px-1 py-4">
        {coreNavItems.map(({ href, icon: Icon, label }) => (
          <NavLink
            key={href}
            to={href}
            title={label}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center px-3 py-2 flex-1 transition-all duration-200 relative group ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-2 rounded-lg transition-all duration-200 ${
                  isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}>
                  <Icon size={24} strokeWidth={1.5} className={isActive ? 'text-blue-600' : 'text-gray-500'} />
                </div>
                {isActive && (
                  <div className="absolute bottom-0 w-8 h-0.5 bg-blue-600 rounded-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
        
        <button
          onClick={onMenuClick}
          title="Menu"
          className="flex flex-col items-center justify-center px-3 py-2 flex-1 text-gray-500 hover:text-gray-700 transition-all duration-200"
        >
          <div className="p-2 rounded-lg hover:bg-gray-50 transition-all duration-200">
            <Menu size={24} strokeWidth={1.5} />
          </div>
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomNav;