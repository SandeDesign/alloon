export interface SickLeave {
  id: string;
  userId: string;
  employeeId: string;
  companyId: string;

  startDate: Date;
  reportedAt: Date;
  reportedBy: string;
  reportedVia: 'phone' | 'email' | 'app' | 'in_person';

  endDate?: Date;
  actualReturnDate?: Date;

  status: 'active' | 'recovered' | 'partially_recovered' | 'long_term';

  workCapacityPercentage: number;

  reintegration?: {
    startDate: Date;
    plan: string;
    targetDate: Date;
    progress: string;
    meetingDates: Date[];
  };

  doctorVisits: {
    date: Date;
    doctor: string;
    notes?: string;
    certificate?: string;
  }[];

  arboServiceContacted: boolean;
  arboServiceDate?: Date;
  arboAdvice?: string;

  poortwachterActive: boolean;
  poortwachterMilestones?: {
    week: number;
    action: string;
    completedDate?: Date;
    status: 'pending' | 'completed' | 'overdue';
    dueDate: Date;
  }[];

  wiaApplication?: {
    appliedDate: Date;
    decision?: 'approved' | 'rejected' | 'pending';
    percentage?: number;
  };

  notes: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface AbsenceStatistics {
  id?: string;
  employeeId: string;
  companyId: string;
  period: 'month' | 'quarter' | 'year';
  periodStart: Date;
  periodEnd: Date;

  totalSickDays: number;
  totalSickHours: number;
  absenceFrequency: number;
  averageDuration: number;
  absencePercentage: number;

  longTermAbsence: boolean;
  chronicAbsence: boolean;

  calculatedAt: Date;
}

export type SickLeaveStatus = SickLeave['status'];
export type ReportedVia = SickLeave['reportedVia'];
