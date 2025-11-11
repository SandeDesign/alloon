import React, { useState, useEffect, useCallback } from 'react';
import { Check, X, Clock, Building2, ChevronRight, AlertCircle, CheckCircle, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import { WeeklyTimesheet } from '../types/timesheet';
import {
  getPendingTimesheets,
  approveWeeklyTimesheet,
  rejectWeeklyTimesheet
} from '../services/timesheetService';
import { getEmployees } from '../services/firebase';
import { useToast } from '../hooks/useToast';
import { EmptyState } from '../components/ui/EmptyState';

interface EmployeeTimesheetSummary {
  employeeId: string;
  firstName: string;
  lastName: string;
  contractHoursPerWeek: number;
  pendingTimesheets: WeeklyTimesheet[];
  hasPending: boolean;
}

export default function TimesheetApprovals() {
  const { user } = useAuth();
  const { selectedCompany, employees } = useApp();
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [timesheets, setTimesheets] = useState<WeeklyTimesheet[]>([]);
  const [selectedTimesheet, setSelectedTimesheet] = useState<WeeklyTimesheet | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [employeeSummaries, setEmployeeSummaries] = useState<EmployeeTimesheetSummary[]>([]);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user || !selectedCompany) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const pendingTimesheets = await getPendingTimesheets(user.uid, selectedCompany.id);
      setTimesheets(pendingTimesheets);

      const summaries: EmployeeTimesheetSummary[] = [];

      employees.forEach(employee => {
        const employeePendingTimesheets = pendingTimesheets.filter(t => t.employeeId === employee.id);

        summaries.push({
          employeeId: employee.id,
          firstName: employee.personalInfo.firstName,
          lastName: employee.personalInfo.lastName,
          contractHoursPerWeek: employee.contractInfo?.hoursPerWeek || 40,
          pendingTimesheets: employeePendingTimesheets,
          hasPending: employeePendingTimesheets.length > 0
        });
      });

      setEmployeeSummaries(summaries.sort((a, b) => {
        if (a.hasPending && !b.hasPending) return -1;
        if (!a.hasPending && b.hasPending) return 1;
        return a.firstName.localeCompare(b.firstName);
      }));
    } catch (error) {
      console.error('Error loading timesheet approvals:', error);
      showError('Fout bij laden', 'Kon urenregistratie goedkeuringen niet laden');
    } finally {
      setLoading(false);
    }
  }, [user, selectedCompany, employees, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (timesheet: WeeklyTimesheet) => {
    if (!user) return;

    try {
      await approveWeeklyTimesheet(timesheet.id!, timesheet.userId, user.uid);
      success('Uren goedgekeurd', `Week ${timesheet.weekNumber} goedgekeurd`);
      setShowDetailsModal(false);
      setSelectedTimesheet(null);
      await loadData();
    } catch (error) {
      console.error('Error approving timesheet:', error);
      showError('Fout bij goedkeuren', 'Kon urenregistratie niet goedkeuren');
    }
  };

  const handleRejectClick = () => {
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedTimesheet || !user || !rejectionReason.trim()) {
      showError('Fout', 'Reden voor afwijzing is verplicht.');
      return;
    }

    try {
      await rejectWeeklyTimesheet(
        selectedTimesheet.id!,
        selectedTimesheet.userId,
        user.uid,
        rejectionReason
      );
      success('Uren afgekeurd', `Week ${selectedTimesheet.weekNumber} afgekeurd`);
      setShowRejectModal(false);
      setRejectionReason('');
      setShowDetailsModal(false);
      setSelectedTimesheet(null);
      await loadData();
    } catch (error) {
      console.error('Error rejecting timesheet:', error);
      showError('Fout bij afwijzen', 'Kon urenregistratie niet afwijzen');
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedTimesheet(null);
    setRejectionReason('');
    setShowRejectModal(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!selectedCompany) {
    return (
      <div className="space-y-6 px-3 sm:px-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Uren goedkeuren</h1>
        </div>
        <EmptyState
          icon={Building2}
          title="Geen bedrijf geselecteerd"
          description="Selecteer een bedrijf uit de dropdown in de zijbalk om urenregistraties goed te keuren."
        />
      </div>
    );
  }

  const pendingCount = employeeSummaries.reduce((sum, e) => sum + e.pendingTimesheets.length, 0);
  const employeesWithPending = employeeSummaries.filter(e => e.hasPending).length;

  return (
    <div className="space-y-2 sm:space-y-4 px-3 sm:px-0 pb-24 sm:pb-6">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Uren goedkeuren</h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
          {pendingCount} aanvraag{pendingCount !== 1 ? 'en' : ''} • {employeesWithPending} medewerker{employeesWithPending !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Stats Cards - Mobiel: 2 kolommen, Desktop: 4 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <Card className="p-2 sm:p-4">
          <p className="text-xs text-gray-600">Totaal</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{employees.length}</p>
        </Card>

        <Card className="p-2 sm:p-4 border border-orange-200 bg-orange-50">
          <p className="text-xs text-orange-700">Wachten</p>
          <p className="text-lg sm:text-2xl font-bold text-orange-700 mt-1">{pendingCount}</p>
        </Card>

        <Card className="p-2 sm:p-4 border border-blue-200 bg-blue-50">
          <p className="text-xs text-blue-700">Medewerkers</p>
          <p className="text-lg sm:text-2xl font-bold text-blue-700 mt-1">{employeesWithPending}</p>
        </Card>

        <Card className="p-2 sm:p-4 border border-green-200 bg-green-50">
          <p className="text-xs text-green-700">Klaar</p>
          <p className="text-lg sm:text-2xl font-bold text-green-700 mt-1">{employees.length - employeesWithPending}</p>
        </Card>
      </div>

      {/* Employee List */}
      {employeeSummaries.length === 0 ? (
        <Card>
          <EmptyState
            icon={Clock}
            title="Geen medewerkers"
            description="Er zijn geen medewerkers in uw bedrijf."
          />
        </Card>
      ) : (
        <div className="space-y-1.5 sm:space-y-3">
          {employeeSummaries.map((summary) => {
            const isExpanded = expandedEmployee === summary.employeeId;

            return (
              <div key={summary.employeeId} className="space-y-1.5">
                {/* Employee Card */}
                <button
                  onClick={() => {
                    if (summary.hasPending) {
                      setExpandedEmployee(isExpanded ? null : summary.employeeId);
                    }
                  }}
                  disabled={!summary.hasPending}
                  className={`w-full p-2.5 sm:p-4 rounded-lg border-l-4 transition-all text-left text-sm sm:text-base ${
                    summary.hasPending 
                      ? 'border-l-orange-500 bg-white border border-gray-200 hover:bg-orange-50 active:bg-orange-100 cursor-pointer' 
                      : 'border-l-gray-200 bg-white border border-gray-200 cursor-default'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate">
                          {summary.firstName} {summary.lastName}
                        </p>
                        {summary.hasPending && (
                          <p className="text-xs text-orange-600 truncate">
                            {summary.pendingTimesheets.length} wachtend
                          </p>
                        )}
                        {!summary.hasPending && (
                          <p className="text-xs text-green-600">Klaar</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {summary.hasPending ? (
                        <>
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-700">
                            {summary.pendingTimesheets.length}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-gray-600 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </>
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded Pending Timesheets */}
                {isExpanded && summary.hasPending && (
                  <div className="space-y-1.5 pl-2 sm:pl-4 border-l-2 border-orange-200">
                    {summary.pendingTimesheets.map((timesheet) => {
                      const hoursPercentage = (timesheet.totalRegularHours / summary.contractHoursPerWeek) * 100;
                      const isUnder = hoursPercentage < 85;
                      const workDays = timesheet.entries.filter(e => e.regularHours > 0).length;
                      const avgPerDay = workDays > 0 ? (timesheet.totalRegularHours / workDays).toFixed(1) : '0';

                      return (
                        <button
                          key={timesheet.id}
                          onClick={() => {
                            setSelectedTimesheet(timesheet);
                            setShowDetailsModal(true);
                          }}
                          className="w-full p-2.5 sm:p-4 bg-orange-50 border border-orange-200 rounded-lg hover:shadow-md active:shadow-sm transition-all text-left text-xs sm:text-sm"
                        >
                          <div className="space-y-1.5 sm:space-y-2">
                            {/* Week Info */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900">
                                  Week {timesheet.weekNumber}
                                </p>
                                {timesheet.submittedAt && (
                                  <p className="text-xs text-gray-600">
                                    {timesheet.submittedAt.toLocaleDateString('nl-NL')}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs font-bold px-1.5 py-0.5 bg-white text-orange-700 rounded border border-orange-200 flex-shrink-0">
                                Wachten
                              </span>
                            </div>

                            {/* Hours Info - Compact */}
                            <div className="bg-white rounded p-1.5">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-600">Uren</span>
                                <span className={`font-bold ${isUnder ? 'text-red-600' : 'text-gray-900'}`}>
                                  {timesheet.totalRegularHours}u / {summary.contractHoursPerWeek}u
                                </span>
                              </div>

                              {/* Progress Bar */}
                              <div className="w-full bg-gray-200 rounded-full h-1">
                                <div
                                  className={`h-1 rounded-full transition-all ${isUnder ? 'bg-red-500' : 'bg-green-500'}`}
                                  style={{ width: `${Math.min(hoursPercentage, 100)}%` }}
                                />
                              </div>

                              <div className="flex items-center justify-between mt-1 text-xs text-gray-600">
                                <span>{hoursPercentage.toFixed(0)}%</span>
                                {isUnder && <AlertCircle className="h-3 w-3 text-red-500" />}
                              </div>
                            </div>

                            {/* Quick Stats - Inline */}
                            <div className="flex items-center justify-between gap-2 text-xs bg-white rounded p-1.5">
                              <div className="text-center flex-1">
                                <p className="text-gray-600">Dagen</p>
                                <p className="font-bold text-gray-900">{workDays}</p>
                              </div>
                              <div className="w-px bg-gray-200" />
                              <div className="text-center flex-1">
                                <p className="text-gray-600">Gem.</p>
                                <p className="font-bold text-gray-900">{avgPerDay}u</p>
                              </div>
                              <div className="w-px bg-gray-200" />
                              <div className="text-center flex-1">
                                <p className="text-gray-600">Km</p>
                                <p className="font-bold text-gray-900">{timesheet.totalTravelKilometers}</p>
                              </div>
                            </div>

                            {/* Action Hint */}
                            <div className="flex items-center gap-1 text-blue-600 pt-1 border-t border-orange-100">
                              <Clock className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">Klik voor details</span>
                              <ChevronRight className="h-3 w-3 ml-auto flex-shrink-0" />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* Modal Component - Mobiel optimized */
<Modal
  isOpen={showDetailsModal}
  onClose={closeDetailsModal}
  title={selectedTimesheet ? `Week ${selectedTimesheet.weekNumber}` : 'Details'}
>
  {selectedTimesheet && (
    <div className="space-y-3 sm:space-y-4 max-h-[80vh] overflow-y-auto">
      {/* Summary Stats - Compact on mobile */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg text-xs sm:text-sm">
        <div>
          <p className="text-gray-600">Totaal uren</p>
          <p className="text-lg sm:text-xl font-bold text-gray-900">{selectedTimesheet.totalRegularHours}u</p>
        </div>
        <div>
          <p className="text-gray-600">Reiskilometers</p>
          <p className="text-lg sm:text-xl font-bold text-gray-900">{selectedTimesheet.totalTravelKilometers}km</p>
        </div>
        <div>
          <p className="text-gray-600">Werkdagen</p>
          <p className="text-lg sm:text-xl font-bold text-gray-900">
            {selectedTimesheet.entries.filter(e => e.regularHours > 0).length}
          </p>
        </div>
        <div>
          <p className="text-gray-600">Gem./dag</p>
          <p className="text-lg sm:text-xl font-bold text-gray-900">
            {(() => {
              const workDays = selectedTimesheet.entries.filter(e => e.regularHours > 0).length;
              return workDays > 0 ? (selectedTimesheet.totalRegularHours / workDays).toFixed(1) : '0';
            })()} u
          </p>
        </div>
      </div>

      {/* Low Hours Warning */}
      {(() => {
        const employee = employees.find(emp => emp.id === selectedTimesheet.employeeId);
        const contractHours = employee?.contractInfo?.hoursPerWeek || 40;
        const actual = selectedTimesheet.totalRegularHours;
        const threshold = contractHours * 0.85;

        if (actual < threshold) {
          return (
            <div className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-red-700">
                  <strong>⚠️ Onder contract</strong>
                  <p className="mt-1">
                    {actual}u van {contractHours}u ({(actual / contractHours * 100).toFixed(0)}%)
                  </p>
                  {selectedTimesheet.lowHoursExplanation && (
                    <p className="mt-1 text-red-600 text-xs">
                      <strong>Verklaring:</strong> {selectedTimesheet.lowHoursExplanation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Daily Details */}
      <div>
        <h4 className="font-semibold text-xs sm:text-sm mb-1.5">Dagelijkse details</h4>
        <div className="space-y-1 text-xs">
          {selectedTimesheet.entries.map((entry, idx) => (
            <div key={idx} className="p-1.5 sm:p-2 bg-gray-50 rounded">
              <div className="flex justify-between mb-1">
                <span className="font-medium">{entry.date.toLocaleDateString('nl-NL')}</span>
                <span className="font-bold">{entry.regularHours}u</span>
              </div>
              {entry.workActivities && entry.workActivities.length > 0 && (
                <div className="space-y-0.5 mt-1 pl-2 border-l border-gray-300">
                  {entry.workActivities.map((activity, actIdx) => (
                    <div key={actIdx} className="flex justify-between text-gray-600">
                      <span className="truncate">{activity.description}</span>
                      <span className="font-semibold ml-1 flex-shrink-0">{activity.hours}u</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      {!showRejectModal && (
        <div className="flex gap-2 pt-3 sm:pt-4 border-t">
          <Button
            onClick={() => handleApprove(selectedTimesheet)}
            variant="primary"
            className="flex-1 text-xs sm:text-base py-2"
          >
            <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            Goedkeuren
          </Button>
          <Button
            onClick={handleRejectClick}
            variant="secondary"
            className="flex-1 text-xs sm:text-base py-2"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            Afkeuren
          </Button>
        </div>
      )}

      {/* Rejection Form */}
      {showRejectModal && (
        <div className="space-y-2 sm:space-y-3 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs sm:text-sm font-semibold text-red-900">Reden voor afkeuring:</p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full px-2 py-1.5 text-xs sm:text-sm border border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            rows={3}
            placeholder="Bijvoorbeeld: Ongeldige uren..."
          />
          <div className="flex gap-2">
            <Button
              onClick={() => setShowRejectModal(false)}
              variant="secondary"
              className="flex-1 text-xs sm:text-base py-2"
            >
              Annuleren
            </Button>
            <Button
              onClick={handleRejectConfirm}
              disabled={!rejectionReason.trim()}
              className="flex-1 text-xs sm:text-base py-2"
            >
              Bevestigen
            </Button>
          </div>
        </div>
      )}
    </div>
  )}
</Modal>