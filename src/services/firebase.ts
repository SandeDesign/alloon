import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Employee, 
  Company, 
  Branch, 
  WeeklyTimesheet, 
  PayrollCalculation, 
  Payslip, 
  TaxReturn, 
  LeaveRequest, 
  SickLeave, 
  Expense, 
  ExportLog 
} from '../types';

// User Management
export const createUserProfile = async (userId: string, userData: {
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'employee';
  companyId?: string;
}) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...userData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserRole = async (userId: string): Promise<'admin' | 'employee' | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.role || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    throw error;
  }
};

// Company Management
export const createCompany = async (userId: string, companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'companies'), {
      ...companyData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
};

export const getCompanies = async (userId: string): Promise<Company[]> => {
  try {
    const q = query(
      collection(db, 'companies'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Company[];
  } catch (error) {
    console.error('Error getting companies:', error);
    throw error;
  }
};

export const updateCompany = async (companyId: string, updates: Partial<Company>): Promise<void> => {
  try {
    const companyRef = doc(db, 'companies', companyId);
    await updateDoc(companyRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating company:', error);
    throw error;
  }
};

export const deleteCompany = async (companyId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'companies', companyId));
  } catch (error) {
    console.error('Error deleting company:', error);
    throw error;
  }
};

// Branch Management
export const createBranch = async (userId: string, branchData: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'branches'), {
      ...branchData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating branch:', error);
    throw error;
  }
};

export const getBranches = async (userId: string, companyId?: string): Promise<Branch[]> => {
  try {
    let q;
    if (companyId) {
      q = query(
        collection(db, 'branches'),
        where('userId', '==', userId),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'branches'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Branch[];
  } catch (error) {
    console.error('Error getting branches:', error);
    throw error;
  }
};

export const updateBranch = async (branchId: string, updates: Partial<Branch>): Promise<void> => {
  try {
    const branchRef = doc(db, 'branches', branchId);
    await updateDoc(branchRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating branch:', error);
    throw error;
  }
};

export const deleteBranch = async (branchId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'branches', branchId));
  } catch (error) {
    console.error('Error deleting branch:', error);
    throw error;
  }
};

// Employee Management
export const createEmployee = async (userId: string, employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'employees'), {
      ...employeeData,
      userId,
      personalInfo: {
        ...employeeData.personalInfo,
        dateOfBirth: Timestamp.fromDate(employeeData.personalInfo.dateOfBirth)
      },
      contractInfo: {
        ...employeeData.contractInfo,
        startDate: Timestamp.fromDate(employeeData.contractInfo.startDate),
        endDate: employeeData.contractInfo.endDate ? Timestamp.fromDate(employeeData.contractInfo.endDate) : null
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating employee:', error);
    throw error;
  }
};

export const getEmployees = async (userId: string, companyId?: string): Promise<Employee[]> => {
  try {
    let q;
    if (companyId) {
      q = query(
        collection(db, 'employees'),
        where('userId', '==', userId),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'employees'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        personalInfo: {
          ...data.personalInfo,
          dateOfBirth: data.personalInfo.dateOfBirth?.toDate() || new Date()
        },
        contractInfo: {
          ...data.contractInfo,
          startDate: data.contractInfo.startDate?.toDate() || new Date(),
          endDate: data.contractInfo.endDate?.toDate() || null
        },
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    }) as Employee[];
  } catch (error) {
    console.error('Error getting employees:', error);
    throw error;
  }
};

export const getEmployeeById = async (employeeId: string): Promise<Employee | null> => {
  try {
    const employeeRef = doc(db, 'employees', employeeId);
    const employeeDoc = await getDoc(employeeRef);
    
    if (employeeDoc.exists()) {
      const data = employeeDoc.data();
      return {
        id: employeeDoc.id,
        ...data,
        personalInfo: {
          ...data.personalInfo,
          dateOfBirth: data.personalInfo.dateOfBirth?.toDate() || new Date()
        },
        contractInfo: {
          ...data.contractInfo,
          startDate: data.contractInfo.startDate?.toDate() || new Date(),
          endDate: data.contractInfo.endDate?.toDate() || null
        },
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Employee;
    }
    return null;
  } catch (error) {
    console.error('Error getting employee by ID:', error);
    throw error;
  }
};

export const updateEmployee = async (employeeId: string, updates: Partial<Employee>): Promise<void> => {
  try {
    const employeeRef = doc(db, 'employees', employeeId);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    if (updates.personalInfo?.dateOfBirth) {
      updateData.personalInfo = {
        ...updates.personalInfo,
        dateOfBirth: Timestamp.fromDate(updates.personalInfo.dateOfBirth)
      };
    }

    if (updates.contractInfo?.startDate) {
      updateData.contractInfo = {
        ...updates.contractInfo,
        startDate: Timestamp.fromDate(updates.contractInfo.startDate),
        endDate: updates.contractInfo.endDate ? Timestamp.fromDate(updates.contractInfo.endDate) : null
      };
    }

    await updateDoc(employeeRef, updateData);
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
};

export const deleteEmployee = async (employeeId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'employees', employeeId));
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
};

// Leave Request Management
export const createLeaveRequest = async (userId: string, leaveData: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'leaveRequests'), {
      ...leaveData,
      userId,
      startDate: Timestamp.fromDate(leaveData.startDate),
      endDate: Timestamp.fromDate(leaveData.endDate),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating leave request:', error);
    throw error;
  }
};

export const getLeaveRequests = async (userId: string, employeeId?: string): Promise<LeaveRequest[]> => {
  try {
    let q;
    if (employeeId) {
      q = query(
        collection(db, 'leaveRequests'),
        where('userId', '==', userId),
        where('employeeId', '==', employeeId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'leaveRequests'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    }) as LeaveRequest[];
  } catch (error) {
    console.error('Error getting leave requests:', error);
    throw error;
  }
};

export const updateLeaveRequest = async (leaveId: string, updates: Partial<LeaveRequest>): Promise<void> => {
  try {
    const leaveRef = doc(db, 'leaveRequests', leaveId);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    if (updates.startDate) {
      updateData.startDate = Timestamp.fromDate(updates.startDate);
    }
    if (updates.endDate) {
      updateData.endDate = Timestamp.fromDate(updates.endDate);
    }

    await updateDoc(leaveRef, updateData);
  } catch (error) {
    console.error('Error updating leave request:', error);
    throw error;
  }
};

// Sick Leave Management
export const createSickLeave = async (userId: string, sickLeaveData: Omit<SickLeave, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'sickLeaves'), {
      ...sickLeaveData,
      userId,
      startDate: Timestamp.fromDate(sickLeaveData.startDate),
      endDate: sickLeaveData.endDate ? Timestamp.fromDate(sickLeaveData.endDate) : null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating sick leave:', error);
    throw error;
  }
};

export const getSickLeaves = async (userId: string, employeeId?: string): Promise<SickLeave[]> => {
  try {
    let q;
    if (employeeId) {
      q = query(
        collection(db, 'sickLeaves'),
        where('userId', '==', userId),
        where('employeeId', '==', employeeId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'sickLeaves'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate() || null,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    }) as SickLeave[];
  } catch (error) {
    console.error('Error getting sick leaves:', error);
    throw error;
  }
};

export const updateSickLeave = async (sickLeaveId: string, updates: Partial<SickLeave>): Promise<void> => {
  try {
    const sickLeaveRef = doc(db, 'sickLeaves', sickLeaveId);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    if (updates.startDate) {
      updateData.startDate = Timestamp.fromDate(updates.startDate);
    }
    if (updates.endDate) {
      updateData.endDate = Timestamp.fromDate(updates.endDate);
    }

    await updateDoc(sickLeaveRef, updateData);
  } catch (error) {
    console.error('Error updating sick leave:', error);
    throw error;
  }
};

// Expense Management
export const createExpense = async (userId: string, expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'expenses'), {
      ...expenseData,
      userId,
      date: Timestamp.fromDate(expenseData.date),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating expense:', error);
    throw error;
  }
};

export const getExpenses = async (userId: string, employeeId?: string): Promise<Expense[]> => {
  try {
    let q;
    if (employeeId) {
      q = query(
        collection(db, 'expenses'),
        where('userId', '==', userId),
        where('employeeId', '==', employeeId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'expenses'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    }) as Expense[];
  } catch (error) {
    console.error('Error getting expenses:', error);
    throw error;
  }
};

export const updateExpense = async (expenseId: string, updates: Partial<Expense>): Promise<void> => {
  try {
    const expenseRef = doc(db, 'expenses', expenseId);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    if (updates.date) {
      updateData.date = Timestamp.fromDate(updates.date);
    }

    await updateDoc(expenseRef, updateData);
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

// Payroll Management
export const createPayrollCalculation = async (userId: string, payrollData: Omit<PayrollCalculation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'payrollCalculations'), {
      ...payrollData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating payroll calculation:', error);
    throw error;
  }
};

export const getPayrollCalculations = async (userId: string, companyId?: string): Promise<PayrollCalculation[]> => {
  try {
    let q;
    if (companyId) {
      q = query(
        collection(db, 'payrollCalculations'),
        where('userId', '==', userId),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'payrollCalculations'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as PayrollCalculation[];
  } catch (error) {
    console.error('Error getting payroll calculations:', error);
    throw error;
  }
};

// Payslip Management
export const createPayslip = async (userId: string, payslipData: Omit<Payslip, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'payslips'), {
      ...payslipData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating payslip:', error);
    throw error;
  }
};

export const getPayslips = async (userId: string, employeeId?: string): Promise<Payslip[]> => {
  try {
    let q;
    if (employeeId) {
      q = query(
        collection(db, 'payslips'),
        where('userId', '==', userId),
        where('employeeId', '==', employeeId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'payslips'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Payslip[];
  } catch (error) {
    console.error('Error getting payslips:', error);
    throw error;
  }
};

// Tax Return Management
export const createTaxReturn = async (userId: string, taxReturnData: Omit<TaxReturn, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'taxReturns'), {
      ...taxReturnData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating tax return:', error);
    throw error;
  }
};

export const getTaxReturns = async (userId: string, companyId?: string): Promise<TaxReturn[]> => {
  try {
    let q;
    if (companyId) {
      q = query(
        collection(db, 'taxReturns'),
        where('userId', '==', userId),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'taxReturns'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as TaxReturn[];
  } catch (error) {
    console.error('Error getting tax returns:', error);
    throw error;
  }
};

// Export Log Management
export const createExportLog = async (userId: string, exportData: Omit<ExportLog, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'exportLogs'), {
      ...exportData,
      userId,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating export log:', error);
    throw error;
  }
};

export const getExportLogs = async (userId: string, companyId?: string): Promise<ExportLog[]> => {
  try {
    let q;
    if (companyId) {
      q = query(
        collection(db, 'exportLogs'),
        where('userId', '==', userId),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    } else {
      q = query(
        collection(db, 'exportLogs'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as ExportLog[];
  } catch (error) {
    console.error('Error getting export logs:', error);
    throw error;
  }
};