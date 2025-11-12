import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import {
  BarChart3, Calendar, MapPin, Users, Zap, TrendingUp, TrendingDown,
  AlertCircle, CheckCircle2, Activity, DollarSign, Briefcase, Clock, Award,
  ArrowUp, ArrowDown, AlertTriangle, Eye, Target, Percent
} from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import { projectStatisticsService } from '../services/projectStatisticsService';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart, ComposedChart, ScatterChart, Scatter
} from 'recharts';

const ProjectStatistics: React.FC = () => {
  const { user } = useAuth();
  const { selectedCompany } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [branchData, setBranchData] = useState<any[]>([]);
  const [branchDetailedData, setBranchDetailedData] = useState<any[]>([]);
  const [employeeData, setEmployeeData] = useState<any[]>([]);
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

        const [weeks, days, monthly, branches, branchDetailed, employees, matrix, addresses, advInsights] = await Promise.all([
          projectStatisticsService.getWeeklyBreakdown(selectedCompany.id, user.uid, now.getFullYear()),
          projectStatisticsService.getDailyBreakdown(selectedCompany.id, user.uid, startDate, now),
          projectStatisticsService.getMonthlyBreakdown(selectedCompany.id, user.uid, now.getFullYear()),
          projectStatisticsService.getBranchPerformance(selectedCompany.id, user.uid),
          projectStatisticsService.getBranchDetailedStats(selectedCompany.id, user.uid),
          projectStatisticsService.getEmployeeDetailedStats(selectedCompany.id, user.uid),
          projectStatisticsService.getEmployeeLocationMatrix(selectedCompany.id, user.uid),
          projectStatisticsService.getAverageEurPerAddress(selectedCompany.id, user.uid),
          projectStatisticsService.getAdvancedInsights(selectedCompany.id, user.uid),
        ]);

        setWeeklyData(weeks || []);
        setDailyData(days || []);
        setMonthlyData(monthly || []);
        setBranchData(branches || []);
        setBranchDetailedData(branchDetailed || []);
        setEmployeeData(employees || []);
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

  // BEREKENDE METREKEN
  const computedStats = useMemo(() => {
    if (!insights?.summary || !weeklyData.length || !branchData.length) return null;

    const summary = insights.summary;
    const avgHoursPerEmployee = summary.totalEmployees > 0 ? summary.totalHours / summary.totalEmployees : 0;
    const overtimePercentage = summary.totalHours > 0 ? (summary.totalOvertime / summary.totalHours) * 100 : 0;
    const costPerHour = summary.totalHours > 0 ? summary.totalGrossPay / summary.totalHours : 0;
    const revenuePerHour = summary.totalHours > 0 ? summary.totalRevenue / summary.totalHours : 0;
    const profitPerHour = revenuePerHour - costPerHour;
    const costRatio = summary.totalRevenue > 0 ? (summary.totalGrossPay / summary.totalRevenue) * 100 : 0;
    const expenseRatio = summary.totalRevenue > 0 ? (summary.totalExpenses / summary.totalRevenue) * 100 : 0;
    const inactivePercentage = summary.totalEmployees > 0 ? (summary.inactiveEmployees / summary.totalEmployees) * 100 : 0;

    const totalSubmitted = weeklyData.reduce((sum, w) => sum + w.submittedCount, 0);
    const totalDraft = weeklyData.reduce((sum, w) => sum + w.draftCount, 0);
    const submissionRate = (totalSubmitted + totalDraft) > 0 ? (totalSubmitted / (totalSubmitted + totalDraft)) * 100 : 0;

    return {
      avgHoursPerEmployee,
      overtimePercentage,
      costPerHour,
      revenuePerHour,
      profitPerHour,
      costRatio,
      expenseRatio,
      inactivePercentage,
      totalSubmitted,
      totalDraft,
      submissionRate,
      topBranch: branchData[0],
      averageEmployeeCost: summary.totalEmployees > 0 ? summary.totalGrossPay / summary.totalEmployees : 0,
      averageEmployeeRevenue: summary.activeEmployees > 0 ? summary.totalRevenue / summary.activeEmployees : 0,
    };
  }, [insights, weeklyData, branchData]);

  if (!selectedCompany) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Geen bedrijf geselecteerd"
        description="Selecteer een bedrijf om statistieken te bekijken."
      />
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Fout bij laden"
        description={error}
      />
    );
  }

  return (
    <div className="space-y-8 pb-12 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-6 rounded-lg">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white">Volledige Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">Gedetailleerde analyse voor {selectedCompany.name}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Bijgewerkt: {new Date().toLocaleDateString('nl-NL')}</p>
        </div>
      </div>

      {/* HOOFD KPI KAARTEN */}
      {insights?.summary && computedStats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-l-4 border-l-blue-600 shadow-lg hover:shadow-xl transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold">Totaal Medewerkers</p>
                  <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{insights.summary.totalEmployees}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-green-700 font-medium">{insights.summary.activeEmployees} actief</p>
                  </div>
                  {insights.summary.inactiveEmployees > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <p className="text-sm text-orange-700">{insights.summary.inactiveEmployees} inactief ({computedStats.inactivePercentage.toFixed(1)}%)</p>
                    </div>
                  )}
                </div>
                <Users className="w-16 h-16 text-blue-200 dark:text-blue-700" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-l-4 border-l-purple-600 shadow-lg hover:shadow-xl transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold">Totale Uren</p>
                  <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{insights.summary.totalHours.toFixed(0)}</p>
                  <div className="mt-3 space-y-1">
                    <p className="text-sm text-purple-700">Regulier: {(insights.summary.totalHours - insights.summary.totalOvertime).toFixed(0)}h</p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-red-600" />
                      <p className="text-sm text-red-700">Overwerk: {insights.summary.totalOvertime.toFixed(0)}h ({computedStats.overtimePercentage.toFixed(1)}%)</p>
                    </div>
                  </div>
                </div>
                <Clock className="w-16 h-16 text-purple-200 dark:text-purple-700" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-l-4 border-l-green-600 shadow-lg hover:shadow-xl transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold">Opbrengsten</p>
                  <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">€{(insights.summary.totalRevenue / 1000).toFixed(1)}k</p>
                  <div className="mt-3 space-y-1">
                    <p className="text-sm text-green-700">€{computedStats.revenuePerHour.toFixed(2)}/uur</p>
                    <p className="text-sm text-green-700">€{computedStats.averageEmployeeRevenue.toFixed(0)}/medewerker</p>
                  </div>
                </div>
                <DollarSign className="w-16 h-16 text-green-200 dark:text-green-700" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-l-4 border-l-orange-600 shadow-lg hover:shadow-xl transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold">Winstmarge</p>
                  <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{insights.summary.profitMargin.toFixed(1)}%</p>
                  <div className="mt-3 space-y-1">
                    <p className="text-sm text-orange-700">Winst: €{(insights.summary.totalProfit / 1000).toFixed(1)}k</p>
                    <p className="text-sm text-orange-700">€{computedStats.profitPerHour.toFixed(2)}/uur</p>
                  </div>
                </div>
                <TrendingUp className="w-16 h-16 text-orange-200 dark:text-orange-700" />
              </div>
            </Card>
          </div>

          {/* GEDETAILLEERDE METRIEKEN RASTER */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Gem. Uren/Medew.</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{computedStats.avgHoursPerEmployee.toFixed(0)}h</p>
            </Card>

            <Card className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Kosten/Uur</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">€{computedStats.costPerHour.toFixed(2)}</p>
            </Card>

            <Card className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Kosten Ratio</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{computedStats.costRatio.toFixed(1)}%</p>
            </Card>

            <Card className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Uitgaven Ratio</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{computedStats.expenseRatio.toFixed(1)}%</p>
            </Card>

            <Card className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Reisafstand</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{insights.summary.totalTravelKm.toFixed(0)}</p>
              <p className="text-xs text-gray-500 mt-1">km</p>
            </Card>

            <Card className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Gem. Medew. Kosten</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">€{(computedStats.averageEmployeeCost / 1000).toFixed(1)}k</p>
            </Card>
          </div>

          {/* INZENDINGSSTATUS */}
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-t-4 border-t-blue-600">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Eye className="w-6 h-6 text-blue-600" />
              Urenstaten Inzendingsstatus
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Totale Inzendingen</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{computedStats.totalSubmitted}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Concept Inzendingen</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{computedStats.totalDraft}</p>
                <p className="text-xs text-gray-500 mt-1">{computedStats.totalSubmitted > 0 ? ((computedStats.totalDraft / (computedStats.totalSubmitted + computedStats.totalDraft)) * 100).toFixed(1) : 0}% in behandeling</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Inzendingspercentage</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{computedStats.submissionRate.toFixed(0)}%</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Top Vestiging</p>
                {computedStats.topBranch && (
                  <>
                    <p className="text-lg font-bold text-indigo-600 mt-2">{computedStats.topBranch.branchName}</p>
                    <p className="text-xs text-gray-500 mt-1">€{(computedStats.topBranch.totalInvoiced / 1000).toFixed(0)}k omzet</p>
                  </>
                )}
              </div>
            </div>
          </Card>
        </>
      )}

      {/* WEEKANALYSE */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Weekanalyse (52 Weken)
        </h2>
        {weeklyData.length > 0 && (
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={weeklyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRegular" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="week" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Legend />
                <Area type="monotone" dataKey="totalHours" stackId="1" stroke="#3b82f6" fill="url(#colorRegular)" name="Reguliere Uren" />
                <Area type="monotone" dataKey="totalOvertime" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Overwerk" />
                <Area type="monotone" dataKey="totalEveningHours" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.4} name="Avonduren" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* MAANDANALYSE */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Maandelijkse Prestatievergelijking
        </h2>
        {monthlyData.length > 0 && (
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg">
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="monthName" stroke="#9ca3af" />
                <YAxis yAxisId="left" stroke="#9ca3af" />
                <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Legend />
                <Bar yAxisId="left" dataKey="totalHours" fill="#3b82f6" name="Uren" radius={[8, 8, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="totalInvoiced" stroke="#10b981" name="Opbrengsten (€)" strokeWidth={3} dot={{ fill: '#10b981', r: 5 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* DAGOVERZICHT */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Activity className="w-6 h-6" />
          Dagelijks Overzicht (Laatste 30 Dagen)
        </h2>
        {dailyData.length > 0 && (
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData.slice(-31)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Legend />
                <Bar dataKey="totalHours" fill="#3b82f6" name="Uren" radius={[8, 8, 0, 0]} />
                <Bar dataKey="employeeCount" fill="#10b981" name="Medewerkers" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* VESTIGINGSPRESTATIES */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MapPin className="w-6 h-6" />
          Vestigingsprestaties & Winstgevendheid
        </h2>
        {branchData.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branchData.slice(0, 6).map((b, i) => (
                <Card key={i} className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 hover:shadow-lg transition border-l-4 border-l-blue-600">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-lg text-gray-900 dark:text-white">{b.branchName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{b.location}</p>
                    </div>
                    <Briefcase className="w-6 h-6 text-blue-600 opacity-50" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Opbrengsten:</span>
                      <span className="font-bold text-blue-600">€{(b.totalInvoiced / 1000).toFixed(1)}k</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Uren:</span>
                      <span className="font-bold">{b.totalHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Medewerkers:</span>
                      <span className="font-bold">{b.employeeCount} ({b.activeEmployees} actief)</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-blue-200 dark:border-blue-700">
                      <span className="text-gray-600 dark:text-gray-400">Marge:</span>
                      <span className={`font-bold ${b.profitMargin >= 20 ? 'text-green-600' : b.profitMargin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {b.profitMargin.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg">
              <h3 className="font-bold text-lg mb-4">Vestigingseffectiviteit & Opbrengsten Correlatie</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" dataKey="efficiency" name="Effectiviteit %" stroke="#9ca3af" />
                  <YAxis type="number" dataKey="averageRevenue" name="Opbrengsten/Uur (€)" stroke="#9ca3af" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Scatter name="Vestigingen" data={branchData} fill="#3b82f6" />
                </ScatterChart>
              </ResponsiveContainer>
            </Card>
          </>
        )}
      </div>

      {/* VESTIGING FINANCIEEL DETAIL */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Vestiging Financiële Analyse</h2>
        {branchDetailedData.length > 0 && (
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700">
                  <th className="text-left py-3 px-4 font-bold">Vestiging</th>
                  <th className="text-right py-3 px-4 font-bold">Uren</th>
                  <th className="text-right py-3 px-4 font-bold">Medewerkers</th>
                  <th className="text-right py-3 px-4 font-bold">Opbrengsten</th>
                  <th className="text-right py-3 px-4 font-bold">Uitgaven</th>
                  <th className="text-right py-3 px-4 font-bold">Bruto Loon</th>
                  <th className="text-right py-3 px-4 font-bold">Winst</th>
                  <th className="text-right py-3 px-4 font-bold">Marge %</th>
                </tr>
              </thead>
              <tbody>
                {branchDetailedData.map((b, i) => (
                  <tr key={i} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{b.branchName}</td>
                    <td className="text-right py-3 px-4">{b.totalHours}</td>
                    <td className="text-right py-3 px-4">{b.activeEmployees}/{b.employeeCount}</td>
                    <td className="text-right py-3 px-4 font-bold">€{(b.totalInvoiced/1000).toFixed(1)}k</td>
                    <td className="text-right py-3 px-4">€{(b.totalExpenses/1000).toFixed(1)}k</td>
                    <td className="text-right py-3 px-4">€{(b.totalGross/1000).toFixed(1)}k</td>
                    <td className="text-right py-3 px-4 font-bold text-green-600">€{(b.profit/1000).toFixed(1)}k</td>
                    <td className="text-right py-3 px-4"><span className={`font-bold px-3 py-1 rounded text-xs ${b.profitMargin >= 20 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : b.profitMargin >= 10 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>{b.profitMargin.toFixed(1)}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {/* MEDEWERKER × LOCATIE MATRIX */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="w-6 h-6" />
          Medewerker × Locatie Matrix (Top 25)
        </h2>
        {employeeLocationMatrix.length > 0 && (
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700">
                  <th className="text-left py-3 px-4 font-bold">Medewerker</th>
                  <th className="text-left py-3 px-4 font-bold">Locatie</th>
                  <th className="text-right py-3 px-4 font-bold">Uren</th>
                  <th className="text-right py-3 px-4 font-bold">€/Uur</th>
                  <th className="text-right py-3 px-4 font-bold">Overwerk</th>
                  <th className="text-right py-3 px-4 font-bold">Totale Kosten</th>
                  <th className="text-right py-3 px-4 font-bold">Effectiviteit</th>
                </tr>
              </thead>
              <tbody>
                {employeeLocationMatrix.slice(0, 25).map((e, i) => (
                  <tr key={i} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{e.employeeName}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{e.location}</td>
                    <td className="text-right py-3 px-4 font-bold">{e.totalHours}h</td>
                    <td className="text-right py-3 px-4 font-bold text-blue-600">€{e.averagePerHour.toFixed(2)}</td>
                    <td className="text-right py-3 px-4">{e.totalOvertime}h</td>
                    <td className="text-right py-3 px-4">€{(e.totalCost/1000).toFixed(1)}k</td>
                    <td className="text-right py-3 px-4"><span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded font-bold text-xs">{e.efficiency.toFixed(0)}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {/* MEDEWERKER ANALYSE */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Award className="w-6 h-6" />
          Medewerker Gedetailleerde Analyse
        </h2>
        {employeeData.length > 0 && (
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700">
                  <th className="text-left py-3 px-4 font-bold">Medewerker</th>
                  <th className="text-left py-3 px-4 font-bold">Status</th>
                  <th className="text-right py-3 px-4 font-bold">Uren</th>
                  <th className="text-right py-3 px-4 font-bold">Overwerk</th>
                  <th className="text-right py-3 px-4 font-bold">Bruto</th>
                  <th className="text-right py-3 px-4 font-bold">Netto</th>
                  <th className="text-right py-3 px-4 font-bold">Belasting</th>
                  <th className="text-right py-3 px-4 font-bold">Verlof</th>
                </tr>
              </thead>
              <tbody>
                {employeeData.slice(0, 20).map((e, i) => (
                  <tr key={i} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{e.name}</td>
                    <td className="py-3 px-4"><span className={`px-3 py-1 rounded text-xs font-bold ${e.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>{e.status}</span></td>
                    <td className="text-right py-3 px-4 font-bold">{e.totalHours}</td>
                    <td className="text-right py-3 px-4">{e.totalOvertime}</td>
                    <td className="text-right py-3 px-4 font-bold">€{(e.totalGross/1000).toFixed(1)}k</td>
                    <td className="text-right py-3 px-4">€{(e.totalNet/1000).toFixed(1)}k</td>
                    <td className="text-right py-3 px-4">€{(e.totalTax/1000).toFixed(1)}k</td>
                    <td className="text-right py-3 px-4"><span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded text-xs">{e.totalLeave}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {/* GEMIDDELDE EUR PER LOCATIE */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <DollarSign className="w-6 h-6" />
          Gemiddelde € per Locatie & Kostenanalyse
        </h2>
        {averagePerAddress.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {averagePerAddress.map((a, i) => (
                <Card key={i} className="p-5 border-l-4 border-l-blue-600 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent shadow-lg">
                  <p className="font-bold text-lg text-gray-900 dark:text-white">{a.location}</p>
                  <p className="text-3xl font-bold text-blue-600 mt-3">€{a.averageEuroPerHour.toFixed(2)}/h</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">Totale Uren</p>
                      <p className="font-bold text-lg">{a.totalHours}h</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">Medewerkers</p>
                      <p className="font-bold text-lg">{a.employeeCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">Gem. Kosten/Medew.</p>
                      <p className="font-bold">€{(a.averageCostPerEmployee/1000).toFixed(1)}k</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">Overwerk</p>
                      <p className="font-bold">{a.totalOvertime}h</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg">
              <h3 className="font-bold text-lg mb-4">Locatie Kostenvergelijking</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={averagePerAddress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="location" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip formatter={(v) => `€${v.toFixed(2)}`} contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Legend />
                  <Bar dataKey="averageEuroPerHour" fill="#3b82f6" name="Kosten/Uur" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </>
        )}
      </div>

      {/* GEAVANCEERDE INZICHTEN */}
      {insights && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-6 h-6" />
            Geavanceerde Inzichten & KPIs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.topPerformers?.length > 0 && (
              <Card className="p-5 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 shadow-lg border-l-4 border-l-green-600">
                <p className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-600" />
                  Top Presteerders
                </p>
                <div className="space-y-3">
                  {insights.topPerformers.slice(0, 5).map((e: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition">
                      <span className="text-sm font-semibold truncate">{i + 1}. {e.name}</span>
                      <span className="font-bold text-green-600 ml-2 text-sm">€{e.efficiency.toFixed(0)}/h</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {insights.leaveCompliance && (
              <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 shadow-lg border-l-4 border-l-blue-600">
                <p className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  Verlofnaleving
                </p>
                <p className="text-4xl font-bold text-blue-600">{insights.leaveCompliance.complianceRate.toFixed(0)}%</p>
                <div className="mt-4 space-y-2 text-sm">
                  <p className="text-gray-600 dark:text-gray-400">✓ Goedgekeurd: <span className="font-bold">{insights.leaveCompliance.approved}</span></p>
                  <p className="text-gray-600 dark:text-gray-400">⏳ In Behandeling: <span className="font-bold">{insights.leaveCompliance.pending}</span></p>
                  <p className="text-gray-600 dark:text-gray-400">✗ Afgewezen: <span className="font-bold">{insights.leaveCompliance.rejected}</span></p>
                </div>
              </Card>
            )}

            {insights.overtimeAnalysis && (
              <Card className="p-5 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 shadow-lg border-l-4 border-l-orange-600">
                <p className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  Overwerk Analyse
                </p>
                <p className="text-4xl font-bold text-orange-600">{insights.overtimeAnalysis.totalOvertimeHours.toFixed(0)}h</p>
                <div className="mt-4 space-y-1 text-sm">
                  <p className="text-gray-600 dark:text-gray-400">Medewerkers: <span className="font-bold">{insights.overtimeAnalysis.employeesWithOvertime}</span></p>
                  <p className="text-gray-600 dark:text-gray-400">Gem./Medew.: <span className="font-bold">{insights.overtimeAnalysis.averageOvertimePerEmployee.toFixed(1)}h</span></p>
                </div>
              </Card>
            )}

            {insights.profitAnalysis && (
              <Card className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 shadow-lg border-l-4 border-l-purple-600">
                <p className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  Winst Analyse
                </p>
                <p className="text-4xl font-bold text-purple-600">{insights.profitAnalysis.margin.toFixed(1)}%</p>
                <div className="mt-4 space-y-1 text-sm">
                  <p className="text-gray-600 dark:text-gray-400">Winst: <span className="font-bold">€{(insights.profitAnalysis.profit/1000).toFixed(1)}k</span></p>
                  <p className="text-gray-600 dark:text-gray-400">Opbrengst/h: <span className="font-bold">€{insights.profitAnalysis.revenuePerHour.toFixed(2)}</span></p>
                </div>
              </Card>
            )}

            {insights.travelAnalysis && (
              <Card className="p-5 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/30 shadow-lg border-l-4 border-l-pink-600">
                <p className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-pink-600" />
                  Reis Analyse
                </p>
                <p className="text-4xl font-bold text-pink-600">{insights.travelAnalysis.totalKilometers.toFixed(0)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Gem./Medew.: <span className="font-bold">{insights.travelAnalysis.averageKmPerEmployee.toFixed(0)}km</span></p>
              </Card>
            )}

            {insights.timesheetStats && (
              <Card className="p-5 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-800/30 shadow-lg border-l-4 border-l-cyan-600">
                <p className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Percent className="w-5 h-5 text-cyan-600" />
                  Urenstaten Stats
                </p>
                <p className="text-4xl font-bold text-cyan-600">{insights.timesheetStats.submissionRate.toFixed(0)}%</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{insights.timesheetStats.submitted}/{insights.timesheetStats.total} ingediend</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* PIEKPATRONEN */}
      {insights?.peakDaysOfWeek && (
        <Card className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 shadow-lg border-t-4 border-t-indigo-600">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-600" />
            Piekwerkdagen per Week
          </h3>
          <div className="grid grid-cols-7 gap-3">
            {insights.peakDaysOfWeek.map((d: any, i: number) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg text-center border-t-4 border-t-indigo-500 hover:shadow-md transition">
                <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">{d.day}</p>
                <p className="text-2xl font-bold text-indigo-600 mt-2">{d.hours.toFixed(0)}h</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* LAAD INDICATOR */}
      {loading && (
        <div className="text-center py-16">
          <div className="inline-block">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500 animate-spin"></div>
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Alle analytics laden...</p>
        </div>
      )}
    </div>
  );
};

export default ProjectStatistics;