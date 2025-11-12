import React, { useEffect, useState, useCallback } from 'react';
import {
  Factory,
  Building2,
  Download,
  Save,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Calendar,
  Users,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { EmptyState } from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useToast } from '../hooks/useToast';
import { collection, addDoc, Timestamp, getDocs, query, where, orderBy, updateDoc, doc } from 'firebase/firestore';
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

const ProjectProduction: React.FC = () => {
  const { user, adminUserId } = useAuth();
  const { selectedCompany, employees } = useApp();
  const { success, error: showError } = useToast();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<number>(getWeekNumber(new Date()));
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [linkedEmployees, setLinkedEmployees] = useState<any[]>([]);
  const [allFirebaseWeeks, setAllFirebaseWeeks] = useState<ProductionWeek[]>([]);

  // Load all Firebase weeks for this company
  const loadAllWeeks = useCallback(async () => {
    if (!user || !adminUserId || !selectedCompany) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get linked employees
      const linked = employees.filter(emp =>
        emp.workCompanies?.includes(selectedCompany.id) ||
        emp.projectCompanies?.includes(selectedCompany.id)
      );
      setLinkedEmployees(linked);

      // Auto-select first employee
      if (!selectedEmployeeId && linked.length > 0) {
        setSelectedEmployeeId(linked[0].id);
      }

      // Get ALL weeks from Firebase for this company
      const q = query(
        collection(db, 'productionWeeks'),
        where('userId', '==', adminUserId),
        where('companyId', '==', selectedCompany.id),
        orderBy('week', 'desc')
      );

      const snap = await getDocs(q);
      const weeks: ProductionWeek[] = snap.docs.map((doc) => {
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

      setAllFirebaseWeeks(weeks);
    } catch (error) {
      console.error('Error loading weeks:', error);
      showError('Fout', 'Kon weken niet laden');
    } finally {
      setLoading(false);
    }
  }, [user, adminUserId, selectedCompany, employees, selectedEmployeeId, showError]);

  // Load current week entries
  const loadCurrentWeek = useCallback(async () => {
    if (!selectedEmployeeId || !user || !adminUserId || !selectedCompany) return;

    try {
      const q = query(
        collection(db, 'productionWeeks'),
        where('userId', '==', adminUserId),
        where('week', '==', selectedWeek),
        where('year', '==', selectedYear),
        where('companyId', '==', selectedCompany.id),
        where('employeeId', '==', selectedEmployeeId)
      );

      const snap = await getDocs(q);
      if (snap.docs.length > 0) {
        const data = snap.docs[0].data();
        setEntries(data.entries || []);
      } else {
        setEntries([]);
      }
    } catch (error) {
      console.error('Error loading current week:', error);
    }
  }, [user, adminUserId, selectedCompany, selectedEmployeeId, selectedWeek, selectedYear]);

  useEffect(() => {
    loadAllWeeks();
  }, [loadAllWeeks]);

  useEffect(() => {
    loadCurrentWeek();
  }, [loadCurrentWeek]);

  const handleSave = async () => {
    if (!user || !adminUserId || !selectedCompany || !selectedEmployeeId || entries.length === 0) {
      showError('Fout', 'Voeg minstens 1 entry toe');
      return;
    }

    setSaving(true);
    try {
      const totalHours = entries.reduce((sum, e) => sum + e.uren, 0);

      const dataToSave = {
        week: selectedWeek,
        year: selectedYear,
        companyId: selectedCompany.id,
        employeeId: selectedEmployeeId,
        userId: adminUserId,
        entries,
        status: 'draft',
        totalHours,
        totalEntries: entries.length,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      };

      // Check if exists
      const q = query(
        collection(db, 'productionWeeks'),
        where('userId', '==', adminUserId),
        where('week', '==', selectedWeek),
        where('year', '==', selectedYear),
        where('companyId', '==', selectedCompany.id),
        where('employeeId', '==', selectedEmployeeId)
      );

      const snap = await getDocs(q);

      if (snap.docs.length > 0) {
        await updateDoc(doc(db, 'productionWeeks', snap.docs[0].id), dataToSave);
        success('Bijgewerkt', `Week ${selectedWeek} bijgewerkt`);
      } else {
        await addDoc(collection(db, 'productionWeeks'), dataToSave);
        success('Opgeslagen', `Week ${selectedWeek} opgeslagen`);
      }

      await loadAllWeeks();
    } catch (error) {
      showError('Fout', 'Kon niet opslaan');
    } finally {
      setSaving(false);
    }
  };

  const updateEntry = (index: number, field: keyof ProductionEntry, value: any) => {
    const updated = [...entries];
    updated[index] = {
      ...updated[index],
      [field]: field === 'uren' ? parseFloat(value) || 0 : value,
    };
    setEntries(updated);
  };

  const addEntry = () => {
    setEntries([
      ...entries,
      {
        monteur: '',
        datum: new Date().toISOString().split('T')[0],
        uren: 0,
        opdrachtgever: '',
        locaties: '',
      },
    ]);
  };

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const changeWeek = (delta: number) => {
    let newWeek = selectedWeek + delta;
    let newYear = selectedYear;

    if (newWeek < 1) {
      newWeek = 52;
      newYear--;
    } else if (newWeek > 52) {
      newWeek = 1;
      newYear++;
    }

    setSelectedWeek(newWeek);
    setSelectedYear(newYear);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!selectedCompany || selectedCompany.companyType !== 'project' || linkedEmployees.length === 0) {
    return (
      <div className="space-y-6 px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Productie</h1>
        <EmptyState
          icon={Factory}
          title="Productie niet beschikbaar"
          description="Dit bedrijf heeft geen gekoppelde medewerkers."
        />
      </div>
    );
  }

  const currentEmployee = employees.find((e) => e.id === selectedEmployeeId);
  const totalHours = entries.reduce((sum, e) => sum + e.uren, 0);
  const currentWeekData = allFirebaseWeeks.find(
    (w) => w.week === selectedWeek && w.year === selectedYear && w.employeeId === selectedEmployeeId
  );

  return (
    <div className="space-y-4 pb-24 sm:pb-6 px-4 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Productie</h1>
        <p className="text-sm text-gray-600 mt-1">{selectedCompany.name}</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Week Navigator */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-300">
          <button onClick={() => changeWeek(-1)} className="p-1.5 hover:bg-gray-100 rounded">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center px-4 min-w-[100px]">
            <p className="font-semibold text-gray-900">Week {selectedWeek}</p>
            <p className="text-xs text-gray-500">{selectedYear}</p>
          </div>
          <button onClick={() => changeWeek(1)} className="p-1.5 hover:bg-gray-100 rounded">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Employee Selector */}
        {linkedEmployees.length > 1 && (
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {linkedEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.personalInfo.firstName} {emp.personalInfo.lastName}
              </option>
            ))}
          </select>
        )}

        <Button onClick={handleSave} disabled={saving || entries.length === 0} loading={saving} className="sm:ml-auto">
          <Save className="h-4 w-4 mr-2" />
          Opslaan
        </Button>
      </div>

      {/* Current Week Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 bg-blue-50 border-blue-200">
          <p className="text-xs text-blue-700 font-medium">Totaal Uren</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">{totalHours}u</p>
        </Card>
        <Card className="p-3 bg-green-50 border-green-200">
          <p className="text-xs text-green-700 font-medium">Entries</p>
          <p className="text-2xl font-bold text-green-900 mt-1">{entries.length}</p>
        </Card>
        <Card className="p-3 bg-purple-50 border-purple-200">
          <p className="text-xs text-purple-700 font-medium">Status</p>
          <p className="text-xs font-bold text-purple-900 mt-2 capitalize">{currentWeekData?.status || 'Nieuw'}</p>
        </Card>
      </div>

      {/* Current Week Entries */}
      <Card>
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Week {selectedWeek} Entries</h3>
          <Button onClick={addEntry} size="sm" variant="secondary">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {entries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-2 px-3">Monteur</th>
                  <th className="text-left py-2 px-3">Datum</th>
                  <th className="text-center py-2 px-3">Uren</th>
                  <th className="text-left py-2 px-3">Opdrachtgever</th>
                  <th className="text-left py-2 px-3 hidden sm:table-cell">Locaties</th>
                  <th className="text-center py-2 px-3">Verwijder</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-2 px-3">
                      <Input
                        type="text"
                        value={entry.monteur}
                        onChange={(e) => updateEntry(idx, 'monteur', e.target.value)}
                        className="text-xs"
                        placeholder="Monteur"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        type="date"
                        value={entry.datum}
                        onChange={(e) => updateEntry(idx, 'datum', e.target.value)}
                        className="text-xs"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.25"
                        value={entry.uren}
                        onChange={(e) => updateEntry(idx, 'uren', e.target.value)}
                        className="text-xs text-center"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        type="text"
                        value={entry.opdrachtgever}
                        onChange={(e) => updateEntry(idx, 'opdrachtgever', e.target.value)}
                        className="text-xs"
                        placeholder="Opdrachtgever"
                      />
                    </td>
                    <td className="py-2 px-3 hidden sm:table-cell">
                      <Input
                        type="text"
                        value={entry.locaties}
                        onChange={(e) => updateEntry(idx, 'locaties', e.target.value)}
                        className="text-xs"
                        placeholder="Locaties"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button onClick={() => removeEntry(idx)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            Geen entries. Klik "+" om een entry toe te voegen.
          </div>
        )}
      </Card>

      {/* All Firebase Weeks */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Alle Weken</h3>
        <div className="space-y-2">
          {allFirebaseWeeks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm bg-white rounded-lg border border-gray-200">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4">Medewerker</th>
                    <th className="text-center py-3 px-4">Week</th>
                    <th className="text-center py-3 px-4">Jaar</th>
                    <th className="text-center py-3 px-4">Uren</th>
                    <th className="text-center py-3 px-4">Entries</th>
                    <th className="text-left py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allFirebaseWeeks.map((week) => {
                    const emp = employees.find((e) => e.id === week.employeeId);
                    return (
                      <tr key={week.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4 text-xs">
                          {emp?.personalInfo.firstName} {emp?.personalInfo.lastName}
                        </td>
                        <td className="py-3 px-4 text-center font-medium">{week.week}</td>
                        <td className="py-3 px-4 text-center">{week.year}</td>
                        <td className="py-3 px-4 text-center font-bold text-blue-600">{week.totalHours}u</td>
                        <td className="py-3 px-4 text-center">{week.totalEntries}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            week.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                            week.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                            week.status === 'approved' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {week.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <Card className="p-8 text-center text-gray-500">
              Geen weken opgeslagen
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export default ProjectProduction;