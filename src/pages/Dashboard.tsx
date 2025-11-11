import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Calculator, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  Calendar, 
  HeartPulse,
  ChevronRight,
  CheckCircle
} from 'lucide-react';
import Card from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  action: () => void;
  bgColor: string;
  textColor: string;
}

interface ActivityItem {
  id: string;
  type: 'import' | 'payroll' | 'regulation';
  message: string;
  timestamp: Date;
}

const Dashboard: React.FC = () => {
  const { dashboardStats, refreshDashboardStats, companies, employees, loading, selectedCompany } = useApp();
  const { user, userRole } = useAuth();
  const { success, info } = useToast();
  const navigate = useNavigate();

  const [recentActivity] = useState<ActivityItem[]>([
    {
      id: '1',
      type: 'import',
      message: 'Welkom bij AlloonApp! Je kunt nu je loonadministratie beheren.',
      timestamp: new Date(),
    },
  ]);

  useEffect(() => {
    if (user && userRole === 'admin') {
      refreshDashboardStats();
    }
  }, [user, userRole, refreshDashboardStats]);

  const quickActions: QuickAction[] = [
    {
      title: 'Werknemers',
      description: 'Beheer je team',
      icon: Users,
      action: () => navigate('/employees'),
      bgColor: 'bg-blue-500',
      textColor: 'text-blue-600',
    },
    {
      title: 'Uren',
      description: 'Verwerk uren',
      icon: Clock,
      action: () => navigate('/timesheet-approvals'),
      bgColor: 'bg-purple-500',
      textColor: 'text-purple-600',
    },
    {
      title: 'Verlof',
      description: 'Goedkeuren',
      icon: Calendar,
      action: () => navigate('/admin/leave-approvals'),
      bgColor: 'bg-orange-500',
      textColor: 'text-orange-600',
    },
    {
      title: 'Loonstroken',
      description: 'Genereer PDF',
      icon: TrendingUp,
      action: () => navigate('/payslips'),
      bgColor: 'bg-green-500',
      textColor: 'text-green-600',
    },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  // Empty state for new admin users
  if (userRole === 'admin' && companies.length === 0) {
    return (
      <div className="space-y-6 pb-24 sm:pb-6">
        <div className="px-4 sm:px-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Welkom bij AlloonApp!
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Begin met het opzetten van je loonadministratie
          </p>
        </div>

        <div className="px-4 sm:px-0">
          <EmptyState
            icon={Building2}
            title="Geen bedrijven gevonden"
            description="Maak je eerste bedrijf aan om te beginnen"
            actionLabel="Bedrijf Toevoegen"
            onAction={() => navigate('/companies')}
          />
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('nl-NL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-4 pb-24 sm:pb-6 sm:space-y-6">
      {/* Header - Mobile Optimized */}
      <div className="px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          Overzicht van je loonadministratie
        </p>
      </div>

      {/* KPI Cards - Mobile First */}
      <div className="px-4 sm:px-0 space-y-3 sm:space-y-4">
        {/* Row 1 - Primary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Active Employees */}
          <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Werknemers
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                  {dashboardStats.activeEmployees}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-600 rounded-lg">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </Card>

          {/* Gross Salary */}
          <Card className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Bruto Deze Maand
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(dashboardStats.totalGrossThisMonth)}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-green-600 rounded-lg">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Row 2 - Secondary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Companies */}
          <Card className="p-4 sm:p-6 bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Bedrijven
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                  {dashboardStats.companiesCount}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-orange-600 rounded-lg">
                <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </Card>

          {/* Pending Approvals */}
          <Card 
            className="p-4 sm:p-6 bg-gradient-to-br from-red-50 to-red-100 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/admin/leave-approvals')}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Te Goedkeuren
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                  {dashboardStats.pendingApprovals}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-red-600 rounded-lg">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Actions - Mobile Optimized */}
      <div className="px-4 sm:px-0">
        <Card>
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Snelle Acties
            </h2>
          </div>

          {/* Mobile: Vertical list */}
          <div className="block sm:hidden divide-y divide-gray-100">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={action.title}
                  onClick={action.action}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`p-2 rounded-lg ${action.bgColor} flex-shrink-0`}>
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {action.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {action.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                </button>
              );
            })}
          </div>

          {/* Desktop: Grid */}
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4 p-6">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={action.title}
                  onClick={action.action}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left hover:bg-gray-50"
                >
                  <div className={`p-3 rounded-lg ${action.bgColor} inline-block mb-3`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    {action.title}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {action.description}
                  </p>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Status Section - Mobile First */}
      <div className="px-4 sm:px-0 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Recent Activity */}
        <Card>
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Recente Activiteit
            </h2>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {item.type === 'import' && <Clock className="h-4 w-4 text-blue-600" />}
                  {item.type === 'payroll' && <Calculator className="h-4 w-4 text-green-600" />}
                  {item.type === 'regulation' && <AlertCircle className="h-4 w-4 text-orange-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    {item.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(item.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Status Alert */}
        <Card>
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Status
            </h2>
          </div>
          <div className="p-4 sm:p-6">
            {employees.length === 0 ? (
              <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Users className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">
                    Voeg Werknemers Toe
                  </h4>
                  <p className="text-xs text-blue-700 mt-1">
                    Begin met werknemers toevoegen
                  </p>
                </div>
              </div>
            ) : dashboardStats.pendingApprovals > 0 ? (
              <div className="flex items-start space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-orange-900">
                    Goedkeuring Vereist
                  </h4>
                  <p className="text-xs text-orange-700 mt-1">
                    {dashboardStats.pendingApprovals} items wachten
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-green-900">
                    Alles Up-to-Date
                  </h4>
                  <p className="text-xs text-green-700 mt-1">
                    Je administratie is bijgewerkt
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;