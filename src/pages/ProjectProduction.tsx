import React, { useEffect, useState, useCallback } from 'react';
import {
  Factory,
  Building2,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { EmptyState } from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useToast } from '../hooks/useToast';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ProductionEntry {
  monteur: string;
  datum: string;
  uren: number;
  opdrachtgever: string;
  locaties: string;
}

interface ProductionWeek {
  id?: string;
  week: number;
  year: number;
  companyId: string;
  employeeId: string;
  userId: string;
  entries: ProductionEntry[];
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'processed';
  totalHours: number;
  totalEntries: number;
  createdAt: Date;
  updatedAt: Date;
}

interface EmployeeWeekData {
  employeeId: string;
  firstName: string;
  lastName: string;
  weeks: Map<string, ProductionWeek | null>;
  totalHours: number;
  importedWeeks: number;
}

const ProjectProduction: React.FC = () => {
  const { user, adminUserId } = useAuth();
  const { selectedCompany, employees } = useApp();
  const { showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState<EmployeeWeekData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

  const getDateOfWeek = (year: number, week: number): Date => {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    return ISOweekStart;
  };

  const loadAllData = useCallback(async () => {
    if (!user || !adminUserId || !selectedCompany) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const linked = employees.filter(emp =>
        emp.workCompanies?.includes(selectedCompany.id) ||
        emp.projectCompanies?.includes(selectedCompany.id)
      );

      const q = query(
        collection(db, 'productionWeeks'),
        where('userId', '==', adminUserId),
        where('companyId', '==', selectedCompany.id),
        orderBy('week', 'desc')
      );

      const snap = await getDocs(q);
      const firebaseWeeks: ProductionWeek[] = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          week: data.week,
          year: data.year,
          companyId: data.companyId,
          employeeId: data.employeeId,
          userId: data.userId,
          entries: data.entries || [],
          status: data.status,
          totalHours: data.totalHours || 0,
          totalEntries: data.totalEntries || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      });

      const employeeWeeksMap = new Map<string, EmployeeWeekData>();

      linked.forEach((emp) => {
        const weeksMap = new Map<string, ProductionWeek | null>();
        
        for (let year of [selectedYear - 1, selectedYear]) {
          for (let week = 1; week <= 52; week++) {
            const key = `${year}-W${week}`;
            const found = firebaseWeeks.find(
              (w) => w.employeeId === emp.id && w.week === week && w.year === year
            );
            weeksMap.set(key, found || null);
          }
        }

        const employeeWeeks = Array.from(weeksMap.values()).filter(
          (w) => w !== null
        ) as ProductionWeek[];
        const totalHours = employeeWeeks.reduce((sum, w) => sum + w.totalHours, 0);

        employeeWeeksMap.set(emp.id, {
          employeeId: emp.id,
          firstName: emp.personalInfo.firstName,
          lastName: emp.personalInfo.lastName,
          weeks: weeksMap,
          totalHours,
          importedWeeks: employeeWeeks.length,
        });
      });

      setEmployeeData(Array.from(employeeWeeksMap.values()));
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Fout', 'Kon data niet laden');
    } finally {
      setLoading(false);
    }
  }, [user, adminUserId, selectedCompany, employees, selectedYear, showError]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!selectedCompany || selectedCompany.companyType !== 'project') {
    return (
      <div className="space-y-6 px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Productie</h1>
        <EmptyState
          icon={Factory}
          title="Dit is geen projectbedrijf"
          description="Productie is alleen beschikbaar voor projectbedrijven."
        />
      </div>
    );
  }

  if (employeeData.length === 0) {
    return (
      <div className="space-y-6 px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Productie</h1>
        <EmptyState
          icon={Building2}
          title="Geen medewerkers gekoppeld"
          description="Koppel medewerkers aan dit projectbedrijf."
        />
      </div>
    );
  }

  const totalHours = employeeData.reduce((sum, emp) => sum + emp.totalHours, 0);
  const totalImportedWeeks = employeeData.reduce((sum, emp) => sum + emp.importedWeeks, 0);

  return (
    <div className="space-y-4 pb-24 sm:pb-6 px-4 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Productie Overzicht</h1>
        <p className="text-sm text-gray-600 mt-1">{selectedCompany.name}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <p className="text-xs font-medium text-blue-700">Medewerkers</p>
          <p className="text-2xl font-bold text-blue-900 mt-2">{employeeData.length}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <p className="text-xs font-medium text-green-700">Geïmporteerde Weken</p>
          <p className="text-2xl font-bold text-green-900 mt-2">{totalImportedWeeks}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <p className="text-xs font-medium text-purple-700">Totaal Uren</p>
          <p className="text-2xl font-bold text-purple-900 mt-2">{totalHours}u</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <p className="text-xs font-medium text-amber-700">Gemiddeld/Persoon</p>
          <p className="text-2xl font-bold text-amber-900 mt-2">
            {(totalHours / employeeData.length).toFixed(0)}u
          </p>
        </Card>
      </div>

      {/* Employee Sections */}
      <div className="space-y-4">
        {employeeData.map((emp) => {
          const importedWeeks = Array.from(emp.weeks.values()).filter((w) => w !== null) as ProductionWeek[];
          const displayWeeks: Array<{
            key: string;
            week: number;
            year: number;
            data: ProductionWeek | null;
          }> = [];

          for (let year of [selectedYear - 1, selectedYear]) {
            for (let week = 1; week <= 52; week++) {
              const key = `${year}-W${week}`;
              const data = emp.weeks.get(key) || null;
              displayWeeks.push({ key, week, year, data });
            }
          }

          const monthStart = new Date(selectedYear, selectedMonth, 1);
          const monthEnd = new Date(selectedYear, selectedMonth + 1, 0);
          
          const monthWeeks = displayWeeks.filter((w) => {
            const weekDate = getDateOfWeek(w.year, w.week);
            return weekDate >= monthStart && weekDate <= monthEnd;
          });

          return (
            <Card key={emp.employeeId} className="p-4">
              <div className="space-y-4">
                {/* Employee Header */}
                <div className="flex items-start justify-between border-b pb-3 border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {emp.importedWeeks} weken geïmporteerd • {emp.totalHours}u totaal
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-600">{emp.totalHours}u</p>
                  </div>
                </div>

                {/* Week Grid - Color coded */}
                {monthWeeks.length > 0 ? (
                  <div className="grid grid-cols-7 gap-1">
                    {monthWeeks.map((w) => (
                      <div
                        key={w.key}
                        className={`p-2 rounded text-center text-xs transition-all ${
                          w.data
                            ? 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                        title={`Week ${w.week} ${w.year}${w.data ? ` - ${w.data.totalHours}u` : ''}`}
                      >
                        <div className="font-semibold">W{w.week}</div>
                        {w.data && <div className="text-xs font-bold">{w.data.totalHours}u</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">Geen weken in deze maand</p>
                )}

                {/* Imported Weeks Details */}
                {importedWeeks.length > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-900 mb-2">Geïmporteerde Weken Details:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {importedWeeks.map((week) => (
                        <div key={week.id} className="p-2 bg-green-50 border border-green-200 rounded text-xs">
                          <p className="font-semibold text-green-900">Week {week.week} ({week.year})</p>
                          <div className="mt-1 space-y-0.5 text-green-700 text-xs">
                            <p>🕐 {week.totalHours}u</p>
                            <p>📝 {week.totalEntries} entries</p>
                            <p className="capitalize">📊 {week.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Full Data Table */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Alle Weken - Detail Tabel</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="text-left py-3 px-4 font-bold">Medewerker</th>
                <th className="text-center py-3 px-4 font-bold">Week</th>
                <th className="text-center py-3 px-4 font-bold">Jaar</th>
                <th className="text-center py-3 px-4 font-bold">Uren</th>
                <th className="text-center py-3 px-4 font-bold">Entries</th>
                <th className="text-left py-3 px-4 font-bold">Status</th>
                <th className="text-center py-3 px-4 font-bold">Updated</th>
              </tr>
            </thead>
            <tbody>
              {employeeData.flatMap((emp) =>
                Array.from(emp.weeks.values())
                  .filter((w) => w !== null)
                  .sort((a, b) => (b!.year - a!.year) || (b!.week - a!.week))
                  .map((week) => (
                    <tr key={week!.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{emp.firstName} {emp.lastName}</td>
                      <td className="py-3 px-4 text-center font-bold">{week!.week}</td>
                      <td className="py-3 px-4 text-center">{week!.year}</td>
                      <td className="py-3 px-4 text-center font-bold text-blue-600">{week!.totalHours}u</td>
                      <td className="py-3 px-4 text-center">{week!.totalEntries}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block text-xs px-2 py-1 rounded font-semibold ${
                          week!.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                          week!.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                          week!.status === 'approved' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {week!.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-gray-500">
                        {week!.updatedAt.toLocaleDateString('nl-NL')}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProjectProduction;