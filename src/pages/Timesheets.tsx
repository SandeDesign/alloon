import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Save, Send, Download, Target, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { WeeklyTimesheet, TimesheetEntry } from '../types/timesheet';
import { Employee } from '../types';
import {
  getWeeklyTimesheets,
  createWeeklyTimesheet,
  updateWeeklyTimesheet,
  submitWeeklyTimesheet,
  getWeekNumber,
  getWeekDates,
  calculateWeekTotals
} from '../services/timesheetService';
import { getEmployeeById } from '../services/firebase';
import { useToast } from '../hooks/useToast';
import { EmptyState } from '../components/ui/EmptyState';
import { 
  SmartCompanyProvider, 
  useSmartCompany,
  CompanyIndicator,
  QuickCompanySwitch,
  useTimesheetCompany 
} from '../contexts/SmartCompanyManager';
import { getBuddyEcosystemService } from '../services/BuddyEcosystemService';

/**
 * ENHANCED TIMESHEETS COMPONENT
 * 
 * Fully integrated met Buddy Ecosystem Service voor intelligente
 * company management en invisible user experience.
 */

interface TimesheetsContentProps {
  selectedEmployeeId: string;
}

const TimesheetsContent: React.FC<TimesheetsContentProps> = ({ selectedEmployeeId }) => {
  const { user, adminUserId, userRole } = useAuth();
  const { selectedCompany, employees } = useApp();
  const { success, error: showError } = useToast();
  
  // Smart Company Integration
  const {
    currentWorkCompany,
    setCurrentWorkCompany,
    shouldShowSelector,
    getTimesheetContext,
    autoDetect
  } = useTimesheetCompany();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [timesheets, setTimesheets] = useState<WeeklyTimesheet[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number>(getWeekNumber(new Date()));
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [currentTimesheet, setCurrentTimesheet] = useState<WeeklyTimesheet | null>(null);
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [timesheetContext, setTimesheetContext] = useState<any>(null);

  const ecosystemService = getBuddyEcosystemService(adminUserId!);

  // Load data with smart company context
  const loadData = useCallback(async () => {
    if (!user || !adminUserId || !selectedCompany || !selectedEmployeeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Load employee data
      const employee = await getEmployeeById(selectedEmployeeId);
      if (!employee) {
        showError('Fout', 'Werknemergegevens niet gevonden.');
        return;
      }
      setEmployeeData(employee);

      // Get timesheet context with company intelligence
      const context = await getTimesheetContext(selectedWeek, selectedYear);
      setTimesheetContext(context);

      // Auto-detect work company if none selected
      if (!currentWorkCompany && !shouldShowSelector) {
        const detected = await autoDetect();
        if (detected) {
          setCurrentWorkCompany(detected);
        }
      }

      // Load existing timesheets
      const existingTimesheets = await getWeeklyTimesheets(
        adminUserId,
        selectedEmployeeId,
        selectedYear,
        selectedWeek
      );
      setTimesheets(existingTimesheets);

      // Get or create current timesheet
      let timesheet = existingTimesheets.find(
        (ts) => ts.weekNumber === selectedWeek && ts.year === selectedYear
      );

      if (!timesheet) {
        // Create new timesheet
        const weekDates = getWeekDates(selectedYear, selectedWeek);
        const entries: TimesheetEntry[] = weekDates.map((date) => ({
          id: `temp-${date.getTime()}`,
          userId: adminUserId,
          employeeId: selectedEmployeeId,
          companyId: employee.companyId,
          branchId: employee.branchId,
          date,
          regularHours: 0,
          overtimeHours: 0,
          eveningHours: 0,
          nightHours: 0,
          weekendHours: 0,
          travelKilometers: 0,
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date()
        }));

        timesheet = {
          userId: adminUserId,
          employeeId: selectedEmployeeId,
          companyId: employee.companyId,
          branchId: employee.branchId,
          weekNumber: selectedWeek,
          year: selectedYear,
          entries,
          totalRegularHours: 0,
          totalOvertimeHours: 0,
          totalEveningHours: 0,
          totalNightHours: 0,
          totalWeekendHours: 0,
          totalTravelKilometers: 0,
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      setCurrentTimesheet(timesheet);
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Fout', 'Kon gegevens niet laden.');
    } finally {
      setLoading(false);
    }
  }, [user, adminUserId, selectedCompany, selectedEmployeeId, selectedWeek, selectedYear, currentWorkCompany, shouldShowSelector, getTimesheetContext, autoDetect]);

  // Enhanced ITKnecht import with smart company detection
  const handleImportFromITKnecht = async () => {
    if (!adminUserId || !selectedEmployeeId || !currentTimesheet) return;

    try {
      setImporting(true);
      
      // Use ecosystem service for smart import
      const result = await ecosystemService.importITKnechtData(
        selectedEmployeeId,
        selectedWeek,
        selectedYear,
        [] // TODO: Actual API call to get ITKnecht data
      );
      
      if (!result.success) {
        showError('Import fout', result.summary);
        return;
      }

      // Auto-select detected company
      if (result.detectedCompany && shouldShowSelector) {
        setCurrentWorkCompany(result.detectedCompany);
      }
      
      success('Import succesvol', result.summary);
      await loadData(); // Refresh data
      
    } catch (error) {
      console.error('Error importing from ITKnecht:', error);
      showError('Import fout', 'Kon data niet importeren van ITKnecht');
    } finally {
      setImporting(false);
    }
  };

  // Enhanced update entry with work company tracking
  const updateEntry = async (index: number, field: keyof TimesheetEntry, value: number | string) => {
    if (!currentTimesheet || !currentWorkCompany) return;

    const updatedEntries = [...currentTimesheet.entries];
    
    // Create smart time entry via ecosystem service
    if (field === 'regularHours' && typeof value === 'number' && value > 0) {
      try {
        // Validate and create time entry with company context
        const validation = await ecosystemService.validateCrossCompanyTimeEntry({
          id: updatedEntries[index].id || '',
          userId: adminUserId!,
          employeeId: selectedEmployeeId,
          workCompanyId: currentWorkCompany.id,
          date: updatedEntries[index].date,
          regularHours: value,
          overtimeHours: updatedEntries[index].overtimeHours,
          irregularHours: 0,
          travelKilometers: updatedEntries[index].travelKilometers,
          branchId: updatedEntries[index].branchId,
          status: 'draft',
          createdAt: updatedEntries[index].createdAt,
          updatedAt: new Date()
        });

        if (!validation.isValid) {
          showError('Validatie fout', validation.issues.join(', '));
          return;
        }

        if (validation.suggestions.length > 0) {
          console.log('Suggestions:', validation.suggestions);
        }
      } catch (error) {
        console.error('Validation error:', error);
      }
    }

    // Update entry with work company ID
    updatedEntries[index] = {
      ...updatedEntries[index],
      [field]: value,
      workCompanyId: currentWorkCompany.id, // Track work company
      updatedAt: new Date()
    };

    const totals = calculateWeekTotals(updatedEntries);

    setCurrentTimesheet({
      ...currentTimesheet,
      entries: updatedEntries,
      totalRegularHours: totals.regularHours,
      totalOvertimeHours: totals.overtimeHours,
      totalEveningHours: totals.eveningHours,
      totalNightHours: totals.nightHours,
      totalWeekendHours: totals.weekendHours,
      totalTravelKilometers: totals.travelKilometers,
      updatedAt: new Date()
    });
  };

  // Save timesheet
  const handleSave = async () => {
    if (!currentTimesheet || !adminUserId) return;

    try {
      setSaving(true);
      
      if (currentTimesheet.id) {
        await updateWeeklyTimesheet(currentTimesheet.id, adminUserId, currentTimesheet);
      } else {
        const id = await createWeeklyTimesheet(adminUserId, currentTimesheet);
        setCurrentTimesheet({ ...currentTimesheet, id });
      }
      
      success('Opgeslagen', 'Urenregistratie succesvol opgeslagen');
    } catch (error) {
      console.error('Error saving timesheet:', error);
      showError('Fout bij opslaan', 'Kon urenregistratie niet opslaan');
    } finally {
      setSaving(false);
    }
  };

  // Submit timesheet
  const handleSubmit = async () => {
    if (!currentTimesheet || !adminUserId || !user) return;

    try {
      setSaving(true);
      
      // Save first if needed
      if (!currentTimesheet.id) {
        await handleSave();
      }

      await submitWeeklyTimesheet(
        currentTimesheet.id!,
        adminUserId,
        user.displayName || user.email || 'Werknemer'
      );
      
      success('Uren ingediend', 'Urenregistratie succesvol ingediend voor goedkeuring');
      await loadData();
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      showError('Fout bij indienen', 'Kon urenregistratie niet indienen');
    } finally {
      setSaving(false);
    }
  };

  // Week navigation
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

  const getDayName = (date: Date): string => {
    const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
    return days[date.getDay()];
  };

  // Initialize data
  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!employeeData || !currentTimesheet) {
    return (
      <EmptyState
        icon={Clock}
        title="Geen urenregistratie gevonden"
        description="Er is een probleem opgetreden bij het laden van de urenregistratie."
      />
    );
  }

  const isReadOnly = currentTimesheet.status !== 'draft' && currentTimesheet.status !== 'rejected';
  const canImportITKnecht = currentWorkCompany?.name.toLowerCase().includes('itknecht');

  return (
    <div className="space-y-6">
      {/* Header with company context */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Urenregistratie</h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-gray-600 text-sm">
              Week {selectedWeek}, {selectedYear} - {employeeData.personalInfo.firstName} {employeeData.personalInfo.lastName}
            </p>
            <CompanyIndicator />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <QuickCompanySwitch />
          
          {canImportITKnecht && (
            <Button
              onClick={handleImportFromITKnecht}
              disabled={importing || saving || isReadOnly}
              variant="primary"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {importing ? (
                <>
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                  Importeren...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Importeer ITKnecht uren
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Smart company selector (only visible when needed) */}
      {shouldShowSelector && (
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-4">
              <Target className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Werkend voor bedrijf
                </label>
                <select
                  value={currentWorkCompany?.id || ''}
                  onChange={(e) => {
                    const company = timesheetContext?.employee.primaryEmployer || 
                                   timesheetContext?.employee.projectCompaniesData?.find(c => c.id === e.target.value);
                    if (company) setCurrentWorkCompany(company);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Selecteer bedrijf...</option>
                  {timesheetContext?.companySessions.map(session => (
                    <option key={session.companyId} value={session.companyId}>
                      {session.company.name}
                      {session.isMainEmployer ? '' : ' (Project)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Week navigation */}
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => changeWeek(-1)}
            >
              ← Vorige week
            </Button>
            
            <div className="text-center">
              <div className="text-lg font-semibold">Week {selectedWeek}, {selectedYear}</div>
              <div className="text-sm text-gray-500">
                {getWeekDates(selectedYear, selectedWeek)[0].toLocaleDateString('nl-NL')} - {' '}
                {getWeekDates(selectedYear, selectedWeek)[6].toLocaleDateString('nl-NL')}
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => changeWeek(1)}
            >
              Volgende week →
            </Button>
          </div>
        </div>
      </Card>

      {/* Company distribution summary */}
      {timesheetContext && timesheetContext.summary.totalHours > 0 && (
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Urenverdeling</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {timesheetContext.summary.totalHours.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">Totaal uren</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {timesheetContext.summary.primaryEmployerHours.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">Buddy uren</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {timesheetContext.summary.projectHours.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">Project uren</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Timesheet entries */}
      <Card>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Dag</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Datum</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Reguliere uren</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Overuren</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Avonduren</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Nachturen</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Weekenduren</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Reiskilometers</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Notities</th>
                </tr>
              </thead>
              <tbody>
                {currentTimesheet.entries.map((entry, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {getDayName(entry.date)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {entry.date.toLocaleDateString('nl-NL')}
                    </td>
                    <td className="py-3 px-4">
                      <Input
                        type="number"
                        value={entry.regularHours}
                        onChange={(e) => updateEntry(index, 'regularHours', parseFloat(e.target.value) || 0)}
                        min="0"
                        max="24"
                        step="0.5"
                        disabled={isReadOnly}
                        className="w-20"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Input
                        type="number"
                        value={entry.overtimeHours}
                        onChange={(e) => updateEntry(index, 'overtimeHours', parseFloat(e.target.value) || 0)}
                        min="0"
                        max="24"
                        step="0.5"
                        disabled={isReadOnly}
                        className="w-20"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Input
                        type="number"
                        value={entry.eveningHours}
                        onChange={(e) => updateEntry(index, 'eveningHours', parseFloat(e.target.value) || 0)}
                        min="0"
                        max="24"
                        step="0.5"
                        disabled={isReadOnly}
                        className="w-20"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Input
                        type="number"
                        value={entry.nightHours}
                        onChange={(e) => updateEntry(index, 'nightHours', parseFloat(e.target.value) || 0)}
                        min="0"
                        max="24"
                        step="0.5"
                        disabled={isReadOnly}
                        className="w-20"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Input
                        type="number"
                        value={entry.weekendHours}
                        onChange={(e) => updateEntry(index, 'weekendHours', parseFloat(e.target.value) || 0)}
                        min="0"
                        max="24"
                        step="0.5"
                        disabled={isReadOnly}
                        className="w-20"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Input
                        type="number"
                        value={entry.travelKilometers}
                        onChange={(e) => updateEntry(index, 'travelKilometers', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="1"
                        disabled={isReadOnly}
                        className="w-20"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Input
                        type="text"
                        value={entry.notes || ''}
                        onChange={(e) => updateEntry(index, 'notes', e.target.value)}
                        disabled={isReadOnly}
                        className="w-32"
                        placeholder="Notities..."
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-50">
                  <td colSpan={2} className="py-3 px-4 font-bold text-gray-900">Totaal</td>
                  <td className="py-3 px-4 font-bold text-gray-900">{currentTimesheet.totalRegularHours}</td>
                  <td className="py-3 px-4 font-bold text-gray-900">{currentTimesheet.totalOvertimeHours}</td>
                  <td className="py-3 px-4 font-bold text-gray-900">{currentTimesheet.totalEveningHours}</td>
                  <td className="py-3 px-4 font-bold text-gray-900">{currentTimesheet.totalNightHours}</td>
                  <td className="py-3 px-4 font-bold text-gray-900">{currentTimesheet.totalWeekendHours}</td>
                  <td className="py-3 px-4 font-bold text-gray-900">{currentTimesheet.totalTravelKilometers}</td>
                  <td className="py-3 px-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </Card>

      {/* Actions */}
      {!isReadOnly && (
        <div className="flex justify-end space-x-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            variant="outline"
          >
            {saving ? (
              <>
                <LoadingSpinner className="h-4 w-4 mr-2" />
                Opslaan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Opslaan
              </>
            )}
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={saving}
            variant="primary"
          >
            {saving ? (
              <>
                <LoadingSpinner className="h-4 w-4 mr-2" />
                Indienen...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Indienen voor goedkeuring
              </>
            )}
          </Button>
        </div>
      )}

      {/* Status indicator */}
      {currentTimesheet.status !== 'draft' && (
        <Card>
          <div className="p-4">
            <div className="flex items-center space-x-2">
              {currentTimesheet.status === 'submitted' && (
                <>
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <span className="text-yellow-700">Wacht op goedkeuring</span>
                </>
              )}
              {currentTimesheet.status === 'approved' && (
                <>
                  <Clock className="h-5 w-5 text-green-500" />
                  <span className="text-green-700">Goedgekeurd</span>
                </>
              )}
              {currentTimesheet.status === 'rejected' && (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span className="text-red-700">Afgekeurd</span>
                  {currentTimesheet.rejectionReason && (
                    <span className="text-gray-600">- {currentTimesheet.rejectionReason}</span>
                  )}
                </>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

/**
 * MAIN TIMESHEETS COMPONENT WITH SMART COMPANY PROVIDER
 */
const Timesheets: React.FC = () => {
  const { userRole, currentEmployeeId } = useAuth();
  const { selectedCompany, employees } = useApp();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  const effectiveEmployeeId = userRole === 'admin' ? selectedEmployeeId : currentEmployeeId;

  // Auto-select first employee for admin
  useEffect(() => {
    if (userRole === 'admin' && !selectedEmployeeId && selectedCompany) {
      const companyEmployees = employees.filter(emp => emp.companyId === selectedCompany.id);
      if (companyEmployees.length > 0) {
        setSelectedEmployeeId(companyEmployees[0].id);
      }
    }
  }, [userRole, selectedEmployeeId, selectedCompany, employees]);

  if (!selectedCompany) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Urenregistratie</h1>
        <EmptyState
          icon={Clock}
          title="Geen bedrijf geselecteerd"
          description="Selecteer een bedrijf uit de dropdown in de zijbalk om uren te registreren."
        />
      </div>
    );
  }

  if (!effectiveEmployeeId) {
    const companyEmployees = employees.filter(emp => emp.companyId === selectedCompany.id);
    
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Urenregistratie</h1>
        {userRole === 'admin' && companyEmployees.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="Geen werknemers gevonden"
            description="Er zijn geen werknemers voor dit bedrijf. Voeg eerst werknemers toe."
          />
        ) : userRole === 'admin' ? (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Selecteer een werknemer</h3>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Selecteer werknemer...</option>
                {companyEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.personalInfo.firstName} {emp.personalInfo.lastName}
                  </option>
                ))}
              </select>
            </div>
          </Card>
        ) : (
          <EmptyState
            icon={Clock}
            title="Geen werknemer geselecteerd"
            description="Selecteer een werknemer om uren te registreren."
          />
        )}
      </div>
    );
  }

  return (
    <SmartCompanyProvider employeeId={effectiveEmployeeId}>
      <TimesheetsContent selectedEmployeeId={effectiveEmployeeId} />
    </SmartCompanyProvider>
  );
};

export default Timesheets;