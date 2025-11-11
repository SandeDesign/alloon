import React, { useState, useEffect, useCallback } from 'react';
import { Check, X, Clock, Building2, ChevronRight, AlertCircle, CheckCircle, User, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
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
  totalPendingHours?: number;
  hoursLacking?: number;
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
        
        // Calculate totals
        const totalPendingHours = employeePendingTimesheets.reduce((sum, t) => sum + t.totalRegularHours, 0);
        const contractHours = employee.contractInfo?.hoursPerWeek || 40;
        const expectedHours = contractHours * employeePendingTimesheets.length;
        const hoursLacking = Math.max(0, expectedHours - totalPendingHours);

        summaries.push({
          employeeId: employee.id,
          firstName: employee.personalInfo.firstName,
          lastName: employee.personalInfo.lastName,
          contractHoursPerWeek: contractHours,
          pendingTimesheets: employeePendingTimesheets,
          hasPending: employeePendingTimesheets.length > 0,
          totalPendingHours,
          hoursLacking
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
      <div className="space-y-6 px-4 sm:px-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Uren goedkeuren</h1>
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
  const approvedCount = employees.length - employeesWithPending;

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0 pb-24 sm:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Uren goedkeuren</h1>
        <p className="text-sm text-gray-600 mt-2">
          {pendingCount} aanvraag{pendingCount !== 1 ? 'en' : ''} wachtend op goedkeuring
        </p>
      </div>

      {/* Stats Cards - Proper spacing */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Employees */}
        <Card className="p-4 sm:p-6 bg-white">
          <div className="space-y-2">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Totaal</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{employees.length}</p>
            <p className="text-xs text-gray-500">medewerkers</p>
          </div>
        </Card>

        {/* Pending */}
        <Card className="p-4 sm:p-6 bg-orange-50 border border-orange-200">
          <div className="space-y-2">
            <p className="text-xs sm:text-sm font-medium text-orange-700">Wachten</p>
            <p className="text-2xl sm:text-3xl font-bold text-orange-600">{pendingCount}</p>
            <p className="text-xs text-orange-600">aanvragen</p>
          </div>
        </Card>

        {/* With Pending */}
        <Card className="p-4 sm:p-6 bg-blue-50 border border-blue-200">
          <div className="space-y-2">
            <p className="text-xs sm:text-sm font-medium text-blue-700">Medewerkers</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">{employeesWithPending}</p>
            <p className="text-xs text-blue-600">met aanvragen</p>
          </div>
        </Card>

        {/* Approved */}
        <Card className="p-4 sm:p-6 bg-green-50 border border-green-200">
          <div className="space-y-2">
            <p className="text-xs sm:text-sm font-medium text-green-700">Klaar</p>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">{approvedCount}</p>
            <p className="text-xs text-green-600">deze week</p>
          </div>
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
        <div className="space-y-3">
          {employeeSummaries.map((summary) => {
            const isExpanded = expandedEmployee === summary.employeeId;

            return (
              <div key={summary.employeeId} className="space-y-2">
                {/* Employee Card */}
                <button
                  onClick={() => {
                    if (summary.hasPending) {
                      setExpandedEmployee(isExpanded ? null : summary.employeeId);
                    }
                  }}
                  disabled={!summary.hasPending}
                  className={`w-full p-4 sm:p-5 rounded-lg border-2 transition-all text-left ${
                    summary.hasPending 
                      ? 'border-orange-300 bg-white hover:bg-orange-50 active:bg-orange-100 cursor-pointer' 
                      : 'border-gray-200 bg-white cursor-default'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                          {summary.firstName} {summary.lastName}
                        </p>
                        {summary.hasPending ? (
                          <div className="flex flex-col gap-1 mt-2 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold whitespace-nowrap">
                                {summary.pendingTimesheets.length} week{summary.pendingTimesheets.length !== 1 ? 'en' : ''}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold whitespace-nowrap">
                                {summary.totalPendingHours}u uren
                              </span>
                              {summary.hoursLacking && summary.hoursLacking > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold whitespace-nowrap flex items-center gap-1">
                                  <TrendingDown className="h-3 w-3" />
                                  -{summary.hoursLacking.toFixed(1)}u
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs sm:text-sm text-green-600 font-medium mt-0.5 flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5" /> Alles goedgekeurd
                          </p>
                        )}
                      </div>
                    </div>

                    {summary.hasPending && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="inline-flex items-center justify-center h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-orange-100 text-orange-700 text-xs sm:text-sm font-bold">
                          {summary.pendingTimesheets.length}
                        </span>
                        <ChevronDown
                          className={`h-5 w-5 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </div>
                    )}

                    {!summary.hasPending && (
                      <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                </button>

                {/* Expanded Pending Timesheets */}
                {isExpanded && summary.hasPending && (
                  <div className="space-y-2 ml-4 sm:ml-6 border-l-3 border-orange-300 pl-4">
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
                          className="w-full p-4 bg-white border-2 border-orange-200 rounded-lg hover:shadow-md active:shadow-sm transition-all text-left"
                        >
                          <div className="space-y-3">
                            {/* Week Header */}
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-gray-900 text-sm sm:text-base">
                                  Week {timesheet.weekNumber}, {timesheet.year}
                                </p>
                                {timesheet.submittedAt && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Ingediend: {timesheet.submittedAt.toLocaleDateString('nl-NL')}
                                  </p>
                                )}
                              </div>
                              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 flex-shrink-0">
                                Wachten
                              </span>
                            </div>

                            {/* Hours Info */}
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 space-y-2">
                              <div className="flex items-baseline justify-between">
                                <span className="text-xs text-gray-600 font-medium">Uren geregistreerd</span>
                                <span className={`text-lg sm:text-xl font-bold ${isUnder ? 'text-red-600' : 'text-green-600'}`}>
                                  {timesheet.totalRegularHours}u
                                </span>
                              </div>
                              <div className="flex items-baseline justify-between text-xs text-gray-600">
                                <span>Contract: {summary.contractHoursPerWeek}u/week</span>
                                <span className="font-semibold">{hoursPercentage.toFixed(0)}%</span>
                              </div>

                              {/* Progress Bar */}
                              <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden mt-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${isUnder ? 'bg-red-500' : 'bg-green-500'}`}
                                  style={{ width: `${Math.min(hoursPercentage, 100)}%` }}
                                />
                              </div>

                              {isUnder && (
                                <div className="flex items-center gap-1 pt-1 text-xs text-red-600 font-medium">
                                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                                  Onder contract uren
                                </div>
                              )}
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="p-2 bg-gray-50 rounded">
                                <p className="text-xs text-gray-600">Werkdagen</p>
                                <p className="font-bold text-gray-900 text-sm">{workDays}</p>
                              </div>
                              <div className="p-2 bg-gray-50 rounded">
                                <p className="text-xs text-gray-600">Gem./dag</p>
                                <p className="font-bold text-gray-900 text-sm">{avgPerDay}u</p>
                              </div>
                              <div className="p-2 bg-gray-50 rounded">
                                <p className="text-xs text-gray-600">Kilometer</p>
                                <p className="font-bold text-gray-900 text-sm">{timesheet.totalTravelKilometers}</p>
                              </div>
                            </div>

                            {/* CTA */}
                            <div className="flex items-center justify-between pt-2 border-t border-orange-100 text-blue-600 text-xs font-medium">
                              <span>Klik voor volledige details</span>
                              <ChevronRight className="h-4 w-4" />
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

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={closeDetailsModal}
        title={selectedTimesheet ? `Week ${selectedTimesheet.weekNumber}, ${selectedTimesheet.year}` : 'Uren details'}
      >
        {selectedTimesheet && (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">Totaal uren</p>
                <p className="text-2xl font-bold text-gray-900">{selectedTimesheet.totalRegularHours}u</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">Reiskilometers</p>
                <p className="text-2xl font-bold text-gray-900">{selectedTimesheet.totalTravelKilometers}km</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">Werkdagen</p>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedTimesheet.entries.filter(e => e.regularHours > 0).length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">Gemiddeld/dag</p>
                <p className="text-2xl font-bold text-gray-900">
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
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg space-y-2">
                    <div className="flex gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-900">⚠️ Onder contract uren</h4>
                        <p className="text-sm text-red-700 mt-1">
                          {actual}u van {contractHours}u contract ({(actual / contractHours * 100).toFixed(0)}%)
                        </p>
                        {selectedTimesheet.lowHoursExplanation && (
                          <p className="text-xs text-red-600 mt-2">
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
              <h4 className="font-semibold text-sm mb-3">Dagelijkse details</h4>
              <div className="space-y-2">
                {selectedTimesheet.entries.map((entry, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="font-medium text-sm text-gray-900">
                        {entry.date.toLocaleDateString('nl-NL', { weekday: 'short', day: '2-digit', month: 'short' })}
                      </span>
                      <span className="text-lg font-bold text-gray-900">{entry.regularHours}u</span>
                    </div>
                    {entry.workActivities && entry.workActivities.length > 0 && (
                      <div className="space-y-1 mt-2 pl-3 border-l-2 border-gray-300">
                        {entry.workActivities.map((activity, actIdx) => (
                          <div key={actIdx} className="flex justify-between text-xs text-gray-600">
                            <span>{activity.description}</span>
                            <span className="font-semibold ml-2">{activity.hours}u</span>
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
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => handleApprove(selectedTimesheet)}
                  variant="primary"
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Goedkeuren
                </Button>
                <Button
                  onClick={handleRejectClick}
                  variant="secondary"
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Afkeuren
                </Button>
              </div>
            )}

            {/* Rejection Form */}
            {showRejectModal && (
              <div className="space-y-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-900">Reden voor afkeuring</h4>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={4}
                  placeholder="Bijvoorbeeld: Ongeldige uren op donderdag..."
                />
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowRejectModal(false)}
                    variant="secondary"
                    className="flex-1"
                  >
                    Annuleren
                  </Button>
                  <Button
                    onClick={handleRejectConfirm}
                    disabled={!rejectionReason.trim()}
                    className="flex-1"
                  >
                    Bevestigen
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}