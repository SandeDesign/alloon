export interface LeaveRequest {
  id: string;
  userId: string;
  employeeId: string;
  companyId: string;

  type: 'holiday' | 'sick' | 'special' | 'unpaid' | 'parental' | 'care' | 'short_leave' | 'adv';

  startDate: Date;
  endDate: Date;
  totalDays: number;
  totalHours: number;

  partialDay?: {
    date: Date;
    startTime: string;
    endTime: string;
    hours: number;
  };

  reason?: string;
  notes?: string;

  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';

  approvedBy?: string;
  approvedAt?: Date;
  rejectedReason?: string;

  sickLeaveDetails?: {
    reportedAt: Date;
    reportedBy: string;
    expectedReturn?: Date;
    actualReturn?: Date;
    doctorNote?: string;
    percentage: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveBalance {
  id?: string;
  employeeId: string;
  companyId: string;
  year: number;

  holidayDays: {
    statutory: number;
    extraStatutory: number;
    carried: number;
    accumulated: number;
    taken: number;
    pending: number;
    remaining: number;
    expires: Date;
  };

  advDays?: {
    entitled: number;
    accumulated: number;
    taken: number;
    remaining: number;
  };

  seniorDays: number;
  snipperDays: number;

  updatedAt: Date;
}

export type LeaveType = LeaveRequest['type'];
export type LeaveStatus = LeaveRequest['status'];
