import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// User role functions
export const getUserRole = async (userId: string): Promise<string> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().role || 'employee';
    }
    return 'employee';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'employee';
  }
};

// Company functions
export const getCompanies = async (adminUserId: string): Promise<any[]> => {
  try {
    const companiesRef = collection(db, 'companies');
    const q = query(companiesRef, where('adminUserId', '==', adminUserId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting companies:', error);
    return [];
  }
};

// Employee functions
export const getEmployees = async (adminUserId: string, companyId?: string): Promise<any[]> => {
  try {
    const employeesRef = collection(db, 'employees');
    let q = query(employeesRef, where('adminUserId', '==', adminUserId));
    
    if (companyId) {
      q = query(q, where('companyId', '==', companyId));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting employees:', error);
    return [];
  }
};

// Expense functions
export const getPendingExpenses = async (adminUserId: string): Promise<any[]> => {
  try {
    const expensesRef = collection(db, 'expenses');
    const q = query(
      expensesRef, 
      where('adminUserId', '==', adminUserId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting pending expenses:', error);
    return [];
  }
};

// Leave approval functions
export const getPendingLeaveApprovals = async (adminUserId: string): Promise<any[]> => {
  try {
    const leaveRequestsRef = collection(db, 'leaveRequests');
    const q = query(
      leaveRequestsRef,
      where('adminUserId', '==', adminUserId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting pending leave approvals:', error);
    return [];
  }
};

// Sick leave functions
export const createSickLeave = async (adminUserId: string, sickLeaveData: any): Promise<string> => {
  try {
    const sickLeaveRef = collection(db, 'sickLeave');
    const docRef = await addDoc(sickLeaveRef, {
      ...sickLeaveData,
      adminUserId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating sick leave:', error);
    throw error;
  }
};

export const updateSickLeave = async (adminUserId: string, sickLeaveId: string, sickLeaveData: any): Promise<void> => {
  try {
    const sickLeaveRef = doc(db, 'sickLeave', sickLeaveId);
    await updateDoc(sickLeaveRef, {
      ...sickLeaveData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating sick leave:', error);
    throw error;
  }
};

export const getSickLeaveRecords = async (adminUserId: string, employeeId?: string): Promise<any[]> => {
  try {
    const sickLeaveRef = collection(db, 'sickLeave');
    let q = query(sickLeaveRef, where('adminUserId', '==', adminUserId));
    
    if (employeeId) {
      q = query(q, where('employeeId', '==', employeeId));
    }
    
    q = query(q, orderBy('startDate', 'desc'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting sick leave records:', error);
    return [];
  }
};

// Absence statistics
export const getAbsenceStatistics = async (adminUserId: string, companyId?: string): Promise<any> => {
  try {
    const sickLeaveRef = collection(db, 'sickLeave');
    let q = query(sickLeaveRef, where('adminUserId', '==', adminUserId));
    
    if (companyId) {
      q = query(q, where('companyId', '==', companyId));
    }
    
    const snapshot = await getDocs(q);
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Calculate statistics
    const totalAbsences = records.length;
    const activeAbsences = records.filter(record => record.status === 'active').length;
    const longTermAbsences = records.filter(record => {
      const startDate = new Date(record.startDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 42; // 6 weeks
    }).length;
    
    return {
      totalAbsences,
      activeAbsences,
      longTermAbsences,
      records
    };
  } catch (error) {
    console.error('Error getting absence statistics:', error);
    return {
      totalAbsences: 0,
      activeAbsences: 0,
      longTermAbsences: 0,
      records: []
    };
  }
};