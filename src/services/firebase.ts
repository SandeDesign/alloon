import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Types
export type UserRole = 'system_admin' | 'company_admin' | 'manager' | 'employee';
export type CompanyType = 'werkmaatschappij' | 'houdmaatschappij';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  
  // Employee info
  employeeNumber?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  
  // Company relations
  primaryCompanyId: string;
  managedCompanyIds: string[];
  
  // Metadata
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  name: string;
  type: CompanyType;
  kvkNumber?: string;
  vatNumber?: string;
  address?: string;
  
  // Hierarchy
  parentCompanyId?: string;
  isDefault: boolean;
  
  // Management
  adminUserIds: string[];
  managerUserIds: string[];
  
  // Metadata
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Utility functions
const convertTimestamps = (data: any): any => {
  const result = { ...data };
  
  for (const [key, value] of Object.entries(result)) {
    if (value instanceof Timestamp) {
      result[key] = value.toDate();
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => 
        item instanceof Timestamp ? item.toDate() : item
      );
    }
  }
  
  return result;
};

const convertToTimestamps = (data: any): any => {
  const result = { ...data };
  
  for (const [key, value] of Object.entries(result)) {
    if (value instanceof Date) {
      result[key] = Timestamp.fromDate(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => 
        item instanceof Date ? Timestamp.fromDate(item) : item
      );
    }
  }
  
  return result;
};

const removeUndefinedValues = (obj: any): any => {
  const result = { ...obj };
  
  Object.keys(result).forEach(key => {
    if (result[key] === undefined) {
      delete result[key];
    }
  });
  
  return result;
};

// ==========================================
// USER PROFILE FUNCTIONS
// ==========================================

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'userProfiles', userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...convertTimestamps(docSnap.data())
    } as UserProfile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const createUserProfile = async (profile: UserProfile): Promise<UserProfile> => {
  try {
    const profileData = convertToTimestamps(profile);
    const cleanedData = removeUndefinedValues(profileData);
    
    const docRef = doc(db, 'userProfiles', profile.id);
    await setDoc(docRef, cleanedData);
    
    return profile;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (
  userId: string, 
  updates: Partial<UserProfile>
): Promise<UserProfile> => {
  try {
    const updateData = convertToTimestamps({
      ...updates,
      updatedAt: new Date()
    });
    
    const cleanedData = removeUndefinedValues(updateData);
    const docRef = doc(db, 'userProfiles', userId);
    
    await updateDoc(docRef, cleanedData);
    
    // Return updated profile
    const updatedProfile = await getUserProfile(userId);
    if (!updatedProfile) {
      throw new Error('Profile not found after update');
    }
    
    return updatedProfile;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const getAllUserProfiles = async (): Promise<UserProfile[]> => {
  try {
    const q = query(
      collection(db, 'userProfiles'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as UserProfile));
  } catch (error) {
    console.error('Error getting all user profiles:', error);
    throw error;
  }
};

export const getUsersByRole = async (role: UserRole): Promise<UserProfile[]> => {
  try {
    const q = query(
      collection(db, 'userProfiles'),
      where('role', '==', role),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as UserProfile));
  } catch (error) {
    console.error('Error getting users by role:', error);
    throw error;
  }
};

export const getUsersByCompany = async (companyId: string): Promise<UserProfile[]> => {
  try {
    const q = query(
      collection(db, 'userProfiles'),
      where('primaryCompanyId', '==', companyId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as UserProfile));
  } catch (error) {
    console.error('Error getting users by company:', error);
    throw error;
  }
};

export const getSystemAdminCount = async (): Promise<number> => {
  try {
    const q = query(
      collection(db, 'userProfiles'),
      where('role', '==', 'system_admin'),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting system admin count:', error);
    return 0;
  }
};

// ==========================================
// COMPANY FUNCTIONS
// ==========================================

export const getCompany = async (companyId: string): Promise<Company | null> => {
  try {
    const docRef = doc(db, 'companies', companyId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...convertTimestamps(docSnap.data())
    } as Company;
  } catch (error) {
    console.error('Error getting company:', error);
    throw error;
  }
};

export const getDefaultCompany = async (): Promise<Company> => {
  try {
    // Zoek eerst naar bestaande default company
    const q = query(
      collection(db, 'companies'),
      where('isDefault', '==', true),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...convertTimestamps(doc.data())
      } as Company;
    }
    
    // Maak default company aan als deze niet bestaat
    return await createDefaultCompany();
  } catch (error) {
    console.error('Error getting default company:', error);
    throw error;
  }
};

export const createDefaultCompany = async (): Promise<Company> => {
  try {
    const defaultCompany: Omit<Company, 'id'> = {
      name: 'Buddy BV',
      type: 'houdmaatschappij',
      kvkNumber: '12345678',
      vatNumber: 'NL123456789B01',
      address: 'Hoofdstraat 1, 1000 AA Amsterdam',
      isDefault: true,
      adminUserIds: [],
      managerUserIds: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const companyData = convertToTimestamps(defaultCompany);
    const cleanedData = removeUndefinedValues(companyData);
    
    const docRef = await addDoc(collection(db, 'companies'), cleanedData);
    
    return {
      id: docRef.id,
      ...defaultCompany
    };
  } catch (error) {
    console.error('Error creating default company:', error);
    throw error;
  }
};

export const createCompany = async (company: Omit<Company, 'id'>): Promise<Company> => {
  try {
    const companyData = convertToTimestamps({
      ...company,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const cleanedData = removeUndefinedValues(companyData);
    const docRef = await addDoc(collection(db, 'companies'), cleanedData);
    
    return {
      id: docRef.id,
      ...company,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
};

export const updateCompany = async (
  companyId: string, 
  updates: Partial<Company>
): Promise<Company> => {
  try {
    const updateData = convertToTimestamps({
      ...updates,
      updatedAt: new Date()
    });
    
    const cleanedData = removeUndefinedValues(updateData);
    const docRef = doc(db, 'companies', companyId);
    
    await updateDoc(docRef, cleanedData);
    
    // Return updated company
    const updatedCompany = await getCompany(companyId);
    if (!updatedCompany) {
      throw new Error('Company not found after update');
    }
    
    return updatedCompany;
  } catch (error) {
    console.error('Error updating company:', error);
    throw error;
  }
};

export const getAllCompanies = async (): Promise<Company[]> => {
  try {
    const q = query(
      collection(db, 'companies'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as Company));
  } catch (error) {
    console.error('Error getting all companies:', error);
    throw error;
  }
};

export const getCompaniesByAdminUser = async (userId: string): Promise<Company[]> => {
  try {
    const q = query(
      collection(db, 'companies'),
      where('adminUserIds', 'array-contains', userId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as Company));
  } catch (error) {
    console.error('Error getting companies by admin user:', error);
    throw error;
  }
};

export const getWorkCompanies = async (): Promise<Company[]> => {
  try {
    const q = query(
      collection(db, 'companies'),
      where('type', '==', 'werkmaatschappij'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as Company));
  } catch (error) {
    console.error('Error getting work companies:', error);
    throw error;
  }
};

export const getHoldingCompanies = async (): Promise<Company[]> => {
  try {
    const q = query(
      collection(db, 'companies'),
      where('type', '==', 'houdmaatschappij'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as Company));
  } catch (error) {
    console.error('Error getting holding companies:', error);
    throw error;
  }
};

// ==========================================
// ADMIN FUNCTIONS
// ==========================================

export const promoteUserToAdmin = async (
  userId: string, 
  companyId: string,
  role: 'company_admin' | 'manager' = 'company_admin'
): Promise<void> => {
  try {
    // Update user profile
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      throw new Error('User not found');
    }

    const updatedManagedCompanies = userProfile.managedCompanyIds.includes(companyId)
      ? userProfile.managedCompanyIds
      : [...userProfile.managedCompanyIds, companyId];

    await updateUserProfile(userId, {
      role,
      managedCompanyIds: updatedManagedCompanies
    });

    // Update company
    const company = await getCompany(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    const updatedAdminIds = role === 'company_admin' && !company.adminUserIds.includes(userId)
      ? [...company.adminUserIds, userId]
      : company.adminUserIds;

    const updatedManagerIds = role === 'manager' && !company.managerUserIds.includes(userId)
      ? [...company.managerUserIds, userId]
      : company.managerUserIds;

    await updateCompany(companyId, {
      adminUserIds: updatedAdminIds,
      managerUserIds: updatedManagerIds
    });
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    throw error;
  }
};

export const removeUserFromCompanyManagement = async (
  userId: string, 
  companyId: string
): Promise<void> => {
  try {
    // Update user profile
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      throw new Error('User not found');
    }

    const updatedManagedCompanies = userProfile.managedCompanyIds.filter(id => id !== companyId);
    
    // Als user geen bedrijven meer beheert, maak dan employee
    const newRole = updatedManagedCompanies.length === 0 && userProfile.role !== 'system_admin' 
      ? 'employee' 
      : userProfile.role;

    await updateUserProfile(userId, {
      role: newRole,
      managedCompanyIds: updatedManagedCompanies
    });

    // Update company
    const company = await getCompany(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    const updatedAdminIds = company.adminUserIds.filter(id => id !== userId);
    const updatedManagerIds = company.managerUserIds.filter(id => id !== userId);

    await updateCompany(companyId, {
      adminUserIds: updatedAdminIds,
      managerUserIds: updatedManagerIds
    });
  } catch (error) {
    console.error('Error removing user from company management:', error);
    throw error;
  }
};

export const transferUserToCompany = async (
  userId: string, 
  newCompanyId: string
): Promise<void> => {
  try {
    const company = await getCompany(newCompanyId);
    if (!company) {
      throw new Error('Company not found');
    }

    await updateUserProfile(userId, {
      primaryCompanyId: newCompanyId
    });
  } catch (error) {
    console.error('Error transferring user to company:', error);
    throw error;
  }
};

// ==========================================
// BRANCHES (backwards compatibility)
// ==========================================

export interface Branch {
  id: string;
  name: string;
  address?: string;
  companyId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const getBranches = async (companyId?: string): Promise<Branch[]> => {
  try {
    let q;
    if (companyId) {
      q = query(
        collection(db, 'branches'),
        where('companyId', '==', companyId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'branches'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as Branch));
  } catch (error) {
    console.error('Error getting branches:', error);
    throw error;
  }
};

export const createBranch = async (branch: Omit<Branch, 'id'>): Promise<string> => {
  try {
    const branchData = convertToTimestamps({
      ...branch,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const cleanedData = removeUndefinedValues(branchData);
    const docRef = await addDoc(collection(db, 'branches'), cleanedData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating branch:', error);
    throw error;
  }
};

// ==========================================
// EMPLOYEES (backwards compatibility with new structure)
// ==========================================

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeNumber?: string;
  phone?: string;
  address?: string;
  companyId: string;
  branchId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // New fields for compatibility
  userProfileId?: string; // Link to UserProfile
}

export const getEmployees = async (companyId?: string): Promise<Employee[]> => {
  try {
    // Get UserProfiles and convert to Employee format for backwards compatibility
    let q;
    if (companyId) {
      q = query(
        collection(db, 'userProfiles'),
        where('primaryCompanyId', '==', companyId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'userProfiles'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const userProfile = { id: doc.id, ...convertTimestamps(doc.data()) } as UserProfile;
      
      // Convert UserProfile to Employee format
      return {
        id: userProfile.id,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        email: userProfile.email,
        employeeNumber: userProfile.employeeNumber,
        phone: userProfile.phone,
        address: userProfile.address,
        companyId: userProfile.primaryCompanyId,
        isActive: userProfile.isActive,
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt,
        userProfileId: userProfile.id
      } as Employee;
    });
  } catch (error) {
    console.error('Error getting employees:', error);
    throw error;
  }
};

export const getEmployee = async (id: string): Promise<Employee | null> => {
  try {
    const userProfile = await getUserProfile(id);
    if (!userProfile) return null;
    
    return {
      id: userProfile.id,
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      email: userProfile.email,
      employeeNumber: userProfile.employeeNumber,
      phone: userProfile.phone,
      address: userProfile.address,
      companyId: userProfile.primaryCompanyId,
      isActive: userProfile.isActive,
      createdAt: userProfile.createdAt,
      updatedAt: userProfile.updatedAt,
      userProfileId: userProfile.id
    } as Employee;
  } catch (error) {
    console.error('Error getting employee:', error);
    throw error;
  }
};

export const createEmployee = async (employee: Omit<Employee, 'id'>): Promise<string> => {
  try {
    // Create as UserProfile instead of separate employee
    const userProfile: UserProfile = {
      id: `emp_${Date.now()}`, // Generate temp ID
      email: employee.email,
      displayName: `${employee.firstName} ${employee.lastName}`,
      role: 'employee',
      firstName: employee.firstName,
      lastName: employee.lastName,
      employeeNumber: employee.employeeNumber,
      phone: employee.phone,
      address: employee.address,
      primaryCompanyId: employee.companyId,
      managedCompanyIds: [],
      isActive: employee.isActive,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const profileData = convertToTimestamps(userProfile);
    const cleanedData = removeUndefinedValues(profileData);
    
    const docRef = await addDoc(collection(db, 'userProfiles'), cleanedData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating employee:', error);
    throw error;
  }
};

export const updateEmployee = async (id: string, updates: Partial<Employee>): Promise<void> => {
  try {
    // Update UserProfile instead
    const userProfileUpdates: Partial<UserProfile> = {
      firstName: updates.firstName,
      lastName: updates.lastName,
      email: updates.email,
      employeeNumber: updates.employeeNumber,
      phone: updates.phone,
      address: updates.address,
      primaryCompanyId: updates.companyId,
      isActive: updates.isActive,
      updatedAt: new Date()
    };
    
    await updateUserProfile(id, userProfileUpdates);
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
};

export const deleteEmployee = async (id: string): Promise<void> => {
  try {
    // Soft delete by setting isActive to false
    await updateUserProfile(id, { isActive: false });
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
};

// ==========================================
// BACKWARDS COMPATIBILITY FUNCTIONS
// ==========================================

// Get companies in old format
export const getCompanies = async (userId?: string): Promise<any[]> => {
  try {
    if (userId) {
      // If userId provided, get companies managed by that user
      const userProfile = await getUserProfile(userId);
      if (!userProfile) return [];
      
      if (userProfile.role === 'system_admin') {
        return await getAllCompanies();
      } else {
        const companies = await Promise.all(
          userProfile.managedCompanyIds.map(id => getCompany(id))
        );
        return companies.filter(Boolean);
      }
    } else {
      return await getAllCompanies();
    }
  } catch (error) {
    console.error('Error getting companies:', error);
    throw error;
  }
};

// User role functions for backwards compatibility
export const getUserRole = async (userId: string) => {
  try {
    const userProfile = await getUserProfile(userId);
    if (!userProfile) return null;
    
    return {
      role: userProfile.role,
      employeeId: userProfile.id // For backwards compatibility
    };
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

export const createUserRole = async (userId: string, role: string) => {
  try {
    // This will be handled by createUserProfile in the new system
    console.log('createUserRole called - handled by createUserProfile');
  } catch (error) {
    console.error('Error creating user role:', error);
    throw error;
  }
};

export const getEmployeeById = async (employeeId: string): Promise<Employee | null> => {
  return await getEmployee(employeeId);
};

// Time entries and other functions
export interface TimeEntry {
  id: string;
  employeeId: string;
  companyId: string;
  date: Date;
  hoursWorked: number;
  description?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export const getTimeEntries = async (employeeId?: string, dateRange?: { start: Date; end: Date }): Promise<TimeEntry[]> => {
  try {
    let q;
    const baseQuery = collection(db, 'timeEntries');
    
    if (employeeId && dateRange) {
      q = query(
        baseQuery,
        where('employeeId', '==', employeeId),
        where('date', '>=', Timestamp.fromDate(dateRange.start)),
        where('date', '<=', Timestamp.fromDate(dateRange.end)),
        orderBy('date', 'desc')
      );
    } else if (employeeId) {
      q = query(
        baseQuery,
        where('employeeId', '==', employeeId),
        orderBy('date', 'desc')
      );
    } else {
      q = query(baseQuery, orderBy('date', 'desc'));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as TimeEntry));
  } catch (error) {
    console.error('Error getting time entries:', error);
    throw error;
  }
};

export const createTimeEntry = async (timeEntry: Omit<TimeEntry, 'id'>): Promise<string> => {
  try {
    const timeEntryData = convertToTimestamps({
      ...timeEntry,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const cleanedData = removeUndefinedValues(timeEntryData);
    const docRef = await addDoc(collection(db, 'timeEntries'), cleanedData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating time entry:', error);
    throw error;
  }
};