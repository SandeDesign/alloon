import { supabase } from '../lib/supabase';
import { LeaveRequest, LeaveBalance, SickLeave, AbsenceStatistics, Expense } from '../types';
import { generatePoortwachterMilestones, shouldActivatePoortwachter } from '../utils/poortwachterTracking';

export const leaveService = {
  async getLeaveRequests(userId: string, employeeId?: string): Promise<LeaveRequest[]> {
    let query = supabase
      .from('leave_requests')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (employeeId) {
      query = query.eq('employeeId', employeeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createLeaveRequest(request: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<LeaveRequest> {
    const { data, error } = await supabase
      .from('leave_requests')
      .insert({
        ...request,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateLeaveRequest(id: string, updates: Partial<LeaveRequest>): Promise<void> {
    const { error } = await supabase
      .from('leave_requests')
      .update({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  },

  async approveLeaveRequest(id: string, approvedBy: string): Promise<void> {
    const { error } = await supabase
      .from('leave_requests')
      .update({
        status: 'approved',
        approvedBy,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  },

  async rejectLeaveRequest(id: string, approvedBy: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('leave_requests')
      .update({
        status: 'rejected',
        approvedBy,
        rejectedReason: reason,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  },

  async getLeaveBalance(employeeId: string, year: number): Promise<LeaveBalance | null> {
    const { data, error } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('employeeId', employeeId)
      .eq('year', year)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateLeaveBalance(employeeId: string, year: number, balance: Partial<LeaveBalance>): Promise<void> {
    const { error } = await supabase
      .from('leave_balances')
      .upsert({
        employeeId,
        year,
        ...balance,
        updatedAt: new Date().toISOString(),
      });

    if (error) throw error;
  },

  async getPendingApprovals(companyId: string): Promise<LeaveRequest[]> {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('companyId', companyId)
      .eq('status', 'pending')
      .order('createdAt', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};

export const absenceService = {
  async getSickLeaveRecords(userId: string, employeeId?: string): Promise<SickLeave[]> {
    let query = supabase
      .from('sick_leave')
      .select('*')
      .eq('userId', userId)
      .order('startDate', { ascending: false });

    if (employeeId) {
      query = query.eq('employeeId', employeeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createSickLeave(sickLeave: Omit<SickLeave, 'id' | 'createdAt' | 'updatedAt'>): Promise<SickLeave> {
    const shouldActivate = shouldActivatePoortwachter(new Date(sickLeave.startDate));
    const milestones = shouldActivate ? generatePoortwachterMilestones(new Date(sickLeave.startDate)) : undefined;

    const { data, error } = await supabase
      .from('sick_leave')
      .insert({
        ...sickLeave,
        poortwachterActive: shouldActivate,
        poortwachterMilestones: milestones,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSickLeave(id: string, updates: Partial<SickLeave>): Promise<void> {
    const { error } = await supabase
      .from('sick_leave')
      .update({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  },

  async getActiveSickLeave(companyId: string): Promise<SickLeave[]> {
    const { data, error } = await supabase
      .from('sick_leave')
      .select('*')
      .eq('companyId', companyId)
      .in('status', ['active', 'partially_recovered'])
      .order('startDate', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAbsenceStatistics(employeeId: string, year: number): Promise<AbsenceStatistics | null> {
    const { data, error } = await supabase
      .from('absence_statistics')
      .select('*')
      .eq('employeeId', employeeId)
      .eq('period', 'year')
      .gte('periodStart', `${year}-01-01`)
      .lte('periodEnd', `${year}-12-31`)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async calculateAbsenceStats(employeeId: string, companyId: string, year: number): Promise<void> {
    const periodStart = new Date(year, 0, 1);
    const periodEnd = new Date(year, 11, 31);

    const { data: sickLeaves, error } = await supabase
      .from('sick_leave')
      .select('*')
      .eq('employeeId', employeeId)
      .gte('startDate', periodStart.toISOString())
      .lte('startDate', periodEnd.toISOString());

    if (error) throw error;

    const totalSickDays = sickLeaves?.reduce((sum, leave) => {
      const start = new Date(leave.startDate);
      const end = leave.endDate ? new Date(leave.endDate) : new Date();
      const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0) || 0;

    const absenceFrequency = sickLeaves?.length || 0;
    const averageDuration = absenceFrequency > 0 ? totalSickDays / absenceFrequency : 0;

    const workingDays = 260;
    const absencePercentage = (totalSickDays / workingDays) * 100;

    const longTermAbsence = sickLeaves?.some(leave => {
      const start = new Date(leave.startDate);
      const end = leave.endDate ? new Date(leave.endDate) : new Date();
      const weeks = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
      return weeks > 6;
    }) || false;

    const chronicAbsence = absenceFrequency >= 3;

    await supabase.from('absence_statistics').upsert({
      employeeId,
      companyId,
      period: 'year',
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      totalSickDays,
      totalSickHours: totalSickDays * 8,
      absenceFrequency,
      averageDuration,
      absencePercentage,
      longTermAbsence,
      chronicAbsence,
      calculatedAt: new Date().toISOString(),
    });
  },
};

export const expenseService = {
  async getExpenses(userId: string, employeeId?: string): Promise<Expense[]> {
    let query = supabase
      .from('expenses')
      .select('*')
      .eq('userId', userId)
      .order('date', { ascending: false });

    if (employeeId) {
      query = query.eq('employeeId', employeeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        ...expense,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateExpense(id: string, updates: Partial<Expense>): Promise<void> {
    const { error } = await supabase
      .from('expenses')
      .update({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  },

  async approveExpense(id: string, approverName: string, approverId: string, comment?: string): Promise<void> {
    const { data: expense, error: fetchError } = await supabase
      .from('expenses')
      .select('approvals')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const approvals = expense?.approvals || [];
    approvals.push({
      level: approvals.length + 1,
      approverName,
      approverId,
      approvedAt: new Date().toISOString(),
      comment,
    });

    const { error } = await supabase
      .from('expenses')
      .update({
        status: 'approved',
        approvals,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  },

  async rejectExpense(id: string, approverName: string, approverId: string, comment: string): Promise<void> {
    const { data: expense, error: fetchError } = await supabase
      .from('expenses')
      .select('approvals')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const approvals = expense?.approvals || [];
    approvals.push({
      level: approvals.length + 1,
      approverName,
      approverId,
      rejectedAt: new Date().toISOString(),
      comment,
    });

    const { error } = await supabase
      .from('expenses')
      .update({
        status: 'rejected',
        approvals,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  },

  async getPendingExpenses(companyId: string): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('companyId', companyId)
      .eq('status', 'submitted')
      .order('submittedAt', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  calculateTravelExpense(kilometers: number, ratePerKm: number = 0.23): number {
    return kilometers * ratePerKm;
  },
};
