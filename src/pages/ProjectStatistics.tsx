import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import {
  BarChart3, Calendar, MapPin, Users, Zap, TrendingUp,
  AlertCircle, CheckCircle2, Activity, DollarSign
} from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import { projectStatisticsService } from '../services/projectStatisticsService';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ComposedChart, Area, AreaChart
} from 'recharts';

const ProjectStatistics: React.FC = () => {
  const { user } = useAuth();
  const { selectedCompany } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [branchData, setBranchData] = useState<any[]>([]);
  const [employeeLocationMatrix, setEmployeeLocationMatrix] = useState<any[]>([]);
  const [averagePerAddress, setAveragePerAddress] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!selectedCompany?.id || !user?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);

        const [weeks, days, branches, matrix, addresses, advInsights] = await Promise.all([
          projectStatisticsService.getWeeklyBreakdown(selectedCompany.id, user.uid, now.getFullYear()),
          projectStatisticsService.getDailyBreakdown(selectedCompany.id, user.uid, startDate, now),
          projectStatisticsService.getBranchPerformance(selectedCompany.id, user.uid),
          projectStatisticsService.getEmployeeLocationMatrix(selectedCompany.id, user.uid),
          projectStatisticsService.getAverageEurPerAddress(selectedCompany.id, user.uid),
          projectStatisticsService.getAdvancedInsights(selectedCompany.id, user.uid),
        ]);

        setWeeklyData(weeks || []);
        setDailyData(days || []);
        setBranchData(branches || []);
        setEmployeeLocationMatrix(matrix || []);
        setAveragePerAddress(addresses || []);
        setInsights(advInsights || {});
      } catch (err) {
        console.error('Error loading statistics:', err);
        setError('Kon statistieken niet laden');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedCompany, user]);

  if (!selectedCompany) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No company selected"
        description="Select a company to view statistics."
      />
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Error loading"
        description={error}
      />
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Statistics</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Analytics for {selectedCompany.name}
        </p>
      </div>

      {/* WEEK ANALYSIS */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Weekly Analysis (52 weeks)
        </h2>
        
        {weeklyData.length > 0 && (
          <Card className="p-6">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="totalHours" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Regular hours" />
                <Area type="monotone" dataKey="totalOvertime" stackId="1" stroke="#ef4444" fill="#ef4444" name="Overtime" />
                <Area type="monotone" dataKey="totalEveningHours" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="Evening hours" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* DAY BREAKDOWN */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Activity className="w-6 h-6" />
          Daily Overview
        </h2>
        
        {dailyData.length > 0 && (
          <Card className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData.slice(-31)} >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalHours" fill="#3b82f6" name="Total hours" />
                <Bar dataKey="employeeCount" fill="#10b981" name="Employee count" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* LOCATION PERFORMANCE */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MapPin className="w-6 h-6" />
          Location Performance
        </h2>

        {branchData.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branchData.slice(0, 6).map((branch, idx) => (
                <Card key={idx} className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                  <p className="font-bold text-gray-900 dark:text-white">{branch.branchName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{branch.location}</p>
                  <div className="mt-3 space-y-1">
                    <p className="text-2xl font-bold text-blue-600">€{branch.totalInvoiced.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{branch.totalHours}h • {branch.employeeCount} employees</p>
                    <p className="text-xs text-gray-500">€{branch.averageRevenue.toFixed(2)}/hour</p>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-6">
              <h3 className="font-bold mb-4">Efficiency per Location</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={branchData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="branchName" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="efficiency" fill="#10b981" name="Efficiency %" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </>
        )}
      </div>

      {/* EMPLOYEE × LOCATION MATRIX */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="w-6 h-6" />
          Employee × Location Matrix
        </h2>

        {employeeLocationMatrix.length > 0 && (
          <Card className="p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-4 font-bold">Employee</th>
                  <th className="text-left py-2 px-4 font-bold">Location</th>
                  <th className="text-right py-2 px-4 font-bold">Hours</th>
                  <th className="text-right py-2 px-4 font-bold">€/hour</th>
                  <th className="text-right py-2 px-4 font-bold">Total €</th>
                  <th className="text-right py-2 px-4 font-bold">Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {employeeLocationMatrix.slice(0, 15).map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-2 px-4 font-medium">{item.employeeName}</td>
                    <td className="py-2 px-4">{item.location}</td>
                    <td className="text-right py-2 px-4">{item.totalHours}h</td>
                    <td className="text-right py-2 px-4 font-bold">€{item.averagePerHour.toFixed(2)}</td>
                    <td className="text-right py-2 px-4">€{item.totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                    <td className="text-right py-2 px-4">
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                        {item.efficiency.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {/* AVERAGE EURO PER ADDRESS */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <DollarSign className="w-6 h-6" />
          Average € per Location
        </h2>

        {averagePerAddress.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {averagePerAddress.map((address, idx) => (
                <Card key={idx} className="p-4 border-l-4 border-l-blue-500">
                  <p className="font-bold text-lg text-gray-900 dark:text-white">{address.location}</p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">€{address.averageEuroPerHour.toFixed(2)}/hour</p>
                  <div className="mt-3 space-y-1 text-sm">
                    <p className="text-gray-600 dark:text-gray-400">Total hours: <span className="font-bold">{address.totalHours}h</span></p>
                    <p className="text-gray-600 dark:text-gray-400">Employees: <span className="font-bold">{address.employeeCount}</span></p>
                    <p className="text-gray-600 dark:text-gray-400">Avg per employee: <span className="font-bold">€{address.averageCostPerEmployee.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span></p>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={averagePerAddress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="location" />
                  <YAxis />
                  <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
                  <Bar dataKey="averageEuroPerHour" fill="#10b981" name="€/hour" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </>
        )}
      </div>

      {/* ADVANCED INSIGHTS */}
      {insights && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-6 h-6" />
            Advanced Insights
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.topPerformers && insights.topPerformers.length > 0 && (
              <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                <p className="font-bold text-gray-900 dark:text-white mb-3">Top Performers</p>
                <div className="space-y-2">
                  {insights.topPerformers.slice(0, 3).map((emp: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span>{emp.name}</span>
                      <span className="font-bold text-green-600">€{emp.efficiency.toFixed(0)}/h</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {insights.leaveCompliance && (
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                <p className="font-bold text-gray-900 dark:text-white mb-3">Leave Compliance</p>
                <p className="text-2xl font-bold text-blue-600">{insights.leaveCompliance.complianceRate.toFixed(0)}%</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {insights.leaveCompliance.approved} approved • {insights.leaveCompliance.pending} pending
                </p>
              </Card>
            )}

            {insights.overtimeAnalysis && (
              <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                <p className="font-bold text-gray-900 dark:text-white mb-3">Overtime Analysis</p>
                <p className="text-2xl font-bold text-orange-600">{insights.overtimeAnalysis.totalOvertimeHours.toFixed(0)}h</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {insights.overtimeAnalysis.employeesWithOvertime} employees
                </p>
              </Card>
            )}

            {insights.profitMargin && (
              <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                <p className="font-bold text-gray-900 dark:text-white mb-3">Profit Margin</p>
                <p className="text-2xl font-bold text-purple-600">{insights.profitMargin.margin.toFixed(1)}%</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  € {insights.profitMargin.profit.toLocaleString('en-US', { maximumFractionDigits: 0 })} profit
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* PEAK PATTERNS */}
      {insights && insights.peakDaysOfWeek && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Peak Work Days</h3>
          <div className="grid grid-cols-7 gap-2">
            {insights.peakDaysOfWeek.map((day: any, idx: number) => (
              <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-center">
                <p className="text-xs font-bold text-gray-600 dark:text-gray-400">{day.day}</p>
                <p className="text-lg font-bold text-blue-600">{day.hours.toFixed(0)}h</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Loading analytics...</p>
        </div>
      )}
    </div>
  );
};

export default ProjectStatistics;