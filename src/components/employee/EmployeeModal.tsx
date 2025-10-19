import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, User, Building, Briefcase, DollarSign, Calendar, Plus, Target } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { Company, Branch, Employee } from '../../types';
import { getBranches } from '../../services/firebase';
import { getBuddyEcosystemService } from '../../services/BuddyEcosystemService';

/**
 * ENHANCED EMPLOYEE MODAL
 * 
 * Volledig geïntegreerd met Buddy Ecosystem Service voor
 * automatische assignment naar Buddy BV en optionele
 * project company assignments.
 */

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  onEmployeeCreated: () => void;
  editEmployee?: Employee | null;
}

interface EmployeeFormData {
  // Personal Info
  firstName: string;
  lastName: string;
  initials: string;
  bsn: string;
  dateOfBirth: string;
  placeOfBirth: string;
  nationality: string;
  
  // Address
  street: string;
  houseNumber: string;
  houseNumberAddition?: string;
  postalCode: string;
  city: string;
  country: string;
  
  // Contact
  email: string;
  phone: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  
  // Financial
  bankAccount: string;
  maritalStatus: 'single' | 'married' | 'registered_partnership' | 'divorced' | 'widowed';
  
  // Contract
  contractType: 'permanent' | 'temporary' | 'zero_hours' | 'on_call' | 'intern' | 'dga' | 'payroll' | 'freelance';
  startDate: string;
  endDate?: string;
  probationPeriod?: number;
  hoursPerWeek: string;
  position: string;
  department?: string;
  costCenter?: string;
  cao: string;
  caoCode?: string;
  
  // Branch
  branchId: string;
  
  // Salary
  salaryScale: string;
  paymentType: 'hourly' | 'monthly' | 'annual';
  paymentFrequency: 'monthly' | 'four_weekly' | 'weekly';
  hourlyRate?: string;
  monthlySalary?: string;
  annualSalary?: string;
  
  // Allowances (percentages)
  overtimeRate: string;
  irregularRate: string;
  shiftRate: string;
  eveningRate: string;
  nightRate: string;
  weekendRate: string;
  sundayRate: string;
  
  // Other allowances
  travelAllowancePerKm: string;
  phoneAllowance?: string;
  internetAllowance?: string;
  
  // Tax
  taxTable: 'white' | 'green';
  taxCredit: boolean;
  socialSecurityNumber?: string;
  
  // Leave
  vacationEntitlement: string;
  advDays?: string;
  seniorDays?: string;
  snipperDays?: string;
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  companies,
  onEmployeeCreated,
  editEmployee
}) => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [availableProjectCompanies, setAvailableProjectCompanies] = useState<Company[]>([]);
  const [selectedProjectCompanies, setSelectedProjectCompanies] = useState<string[]>([]);
  const [autoAssignToBuddy, setAutoAssignToBuddy] = useState(true);
  const [buddyCompany, setBuddyCompany] = useState<Company | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<EmployeeFormData>();

  const watchContractType = watch('contractType');
  const watchPaymentType = watch('paymentType');

  const ecosystemService = user ? getBuddyEcosystemService(user.uid) : null;

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      loadFormData();
      
      if (editEmployee) {
        populateFormForEdit();
      } else {
        resetFormForNew();
      }
    }
  }, [isOpen, editEmployee]);

  const loadFormData = async () => {
    if (!user) return;

    try {
      // Load branches
      const branchesData = await getBranches(user.uid);
      setBranches(branchesData);

      // Identify Buddy company and project companies
      const employerCompanies = companies.filter(c => c.companyType === 'employer');
      const projectCompanies = companies.filter(c => c.companyType === 'project');
      
      // Find Buddy company (primary employer)
      const buddy = employerCompanies.find(c => 
        c.name.toLowerCase().includes('buddy') || employerCompanies.length === 1
      ) || employerCompanies[0];
      
      setBuddyCompany(buddy);
      setAvailableProjectCompanies(projectCompanies);
      
    } catch (error) {
      console.error('Error loading form data:', error);
      showError('Fout', 'Kon formuliergegevens niet laden');
    }
  };

  const populateFormForEdit = () => {
    if (!editEmployee) return;

    const emp = editEmployee;
    
    // Set all form values from existing employee
    setValue('firstName', emp.personalInfo.firstName);
    setValue('lastName', emp.personalInfo.lastName);
    setValue('initials', emp.personalInfo.initials);
    setValue('bsn', emp.personalInfo.bsn);
    setValue('dateOfBirth', emp.personalInfo.dateOfBirth.toISOString().split('T')[0]);
    setValue('placeOfBirth', emp.personalInfo.placeOfBirth);
    setValue('nationality', emp.personalInfo.nationality);
    
    // Address
    setValue('street', emp.personalInfo.address.street);
    setValue('houseNumber', emp.personalInfo.address.houseNumber);
    setValue('houseNumberAddition', emp.personalInfo.address.houseNumberAddition);
    setValue('postalCode', emp.personalInfo.address.postalCode);
    setValue('city', emp.personalInfo.address.city);
    setValue('country', emp.personalInfo.address.country);
    
    // Contact
    setValue('email', emp.personalInfo.contactInfo.email);
    setValue('phone', emp.personalInfo.contactInfo.phone);
    if (emp.personalInfo.contactInfo.emergencyContact) {
      setValue('emergencyContactName', emp.personalInfo.contactInfo.emergencyContact.name);
      setValue('emergencyContactPhone', emp.personalInfo.contactInfo.emergencyContact.phone);
      setValue('emergencyContactRelation', emp.personalInfo.contactInfo.emergencyContact.relation);
    }
    
    setValue('bankAccount', emp.personalInfo.bankAccount);
    setValue('maritalStatus', emp.personalInfo.maritalStatus);
    
    // Contract
    setValue('contractType', emp.contractInfo.type);
    setValue('startDate', emp.contractInfo.startDate.toISOString().split('T')[0]);
    if (emp.contractInfo.endDate) {
      setValue('endDate', emp.contractInfo.endDate.toISOString().split('T')[0]);
    }
    setValue('probationPeriod', emp.contractInfo.probationPeriod);
    setValue('hoursPerWeek', emp.contractInfo.hoursPerWeek.toString());
    setValue('position', emp.contractInfo.position);
    setValue('department', emp.contractInfo.department);
    setValue('costCenter', emp.contractInfo.costCenter);
    setValue('cao', emp.contractInfo.cao);
    setValue('caoCode', emp.contractInfo.caoCode);
    setValue('branchId', emp.branchId);
    
    // Salary
    setValue('salaryScale', emp.salaryInfo.salaryScale);
    setValue('paymentType', emp.salaryInfo.paymentType);
    setValue('paymentFrequency', emp.salaryInfo.paymentFrequency);
    
    if (emp.salaryInfo.hourlyRate) setValue('hourlyRate', emp.salaryInfo.hourlyRate.toString());
    if (emp.salaryInfo.monthlySalary) setValue('monthlySalary', emp.salaryInfo.monthlySalary.toString());
    if (emp.salaryInfo.annualSalary) setValue('annualSalary', emp.salaryInfo.annualSalary.toString());
    
    // Allowances
    setValue('overtimeRate', emp.salaryInfo.allowances.overtime.toString());
    setValue('irregularRate', emp.salaryInfo.allowances.irregular.toString());
    setValue('shiftRate', emp.salaryInfo.allowances.shift.toString());
    setValue('eveningRate', emp.salaryInfo.allowances.evening.toString());
    setValue('nightRate', emp.salaryInfo.allowances.night.toString());
    setValue('weekendRate', emp.salaryInfo.allowances.weekend.toString());
    setValue('sundayRate', emp.salaryInfo.allowances.sunday.toString());
    
    setValue('travelAllowancePerKm', emp.salaryInfo.travelAllowancePerKm.toString());
    if (emp.salaryInfo.phoneAllowance) setValue('phoneAllowance', emp.salaryInfo.phoneAllowance.toString());
    if (emp.salaryInfo.internetAllowance) setValue('internetAllowance', emp.salaryInfo.internetAllowance.toString());
    
    setValue('taxTable', emp.salaryInfo.taxTable);
    setValue('taxCredit', emp.salaryInfo.taxCredit);
    setValue('socialSecurityNumber', emp.salaryInfo.socialSecurityNumber);
    
    // Leave
    setValue('vacationEntitlement', emp.leaveInfo.vacation.entitlement.toString());
    if (emp.leaveInfo.adv) setValue('advDays', emp.leaveInfo.adv.accumulated.toString());
    setValue('seniorDays', emp.leaveInfo.seniorDays?.toString());
    setValue('snipperDays', emp.leaveInfo.snipperDays?.toString());
    
    // Project companies
    setSelectedProjectCompanies(emp.projectCompanies || []);
    setAutoAssignToBuddy(emp.companyId === buddyCompany?.id);
  };

  const resetFormForNew = () => {
    reset();
    setSelectedProjectCompanies([]);
    setAutoAssignToBuddy(true);
    
    // Set defaults
    setValue('nationality', 'Nederlandse');
    setValue('country', 'Nederland');
    setValue('maritalStatus', 'single');
    setValue('contractType', 'permanent');
    setValue('paymentType', 'monthly');
    setValue('paymentFrequency', 'monthly');
    setValue('cao', 'Algemeen');
    setValue('salaryScale', 'A');
    setValue('taxTable', 'white');
    setValue('taxCredit', true);
    
    // Default allowances
    setValue('overtimeRate', '125');
    setValue('irregularRate', '100');
    setValue('shiftRate', '100');
    setValue('eveningRate', '100');
    setValue('nightRate', '100');
    setValue('weekendRate', '100');
    setValue('sundayRate', '100');
    setValue('travelAllowancePerKm', '0.23');
    setValue('vacationEntitlement', '25');
  };

  const onSubmit = async (data: EmployeeFormData) => {
    if (!user || !ecosystemService || !buddyCompany) {
      showError('Fout', 'Gebruiker of service niet beschikbaar');
      return;
    }

    try {
      setLoading(true);

      // Build employee data
      const employeeData: Omit<Employee, 'id' | 'userId' | 'companyId' | 'projectCompanies'> = {
        branchId: data.branchId,
        
        personalInfo: {
          firstName: data.firstName,
          lastName: data.lastName,
          initials: data.initials,
          bsn: data.bsn,
          dateOfBirth: new Date(data.dateOfBirth),
          placeOfBirth: data.placeOfBirth,
          nationality: data.nationality,
          
          address: {
            street: data.street,
            houseNumber: data.houseNumber,
            houseNumberAddition: data.houseNumberAddition || '',
            postalCode: data.postalCode,
            city: data.city,
            country: data.country
          },
          
          contactInfo: {
            email: data.email,
            phone: data.phone,
            emergencyContact: data.emergencyContactName ? {
              name: data.emergencyContactName,
              phone: data.emergencyContactPhone!,
              relation: data.emergencyContactRelation!
            } : undefined
          },
          
          bankAccount: data.bankAccount,
          maritalStatus: data.maritalStatus
        },
        
        contractInfo: {
          type: data.contractType,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : undefined,
          probationPeriod: data.probationPeriod,
          hoursPerWeek: parseFloat(data.hoursPerWeek),
          position: data.position,
          department: data.department,
          costCenter: data.costCenter,
          cao: data.cao,
          caoCode: data.caoCode,
          contractStatus: 'active'
        },
        
        salaryInfo: {
          salaryScale: data.salaryScale,
          hourlyRate: data.paymentType === 'hourly' ? parseFloat(data.hourlyRate || '0') : undefined,
          monthlySalary: data.paymentType === 'monthly' ? parseFloat(data.monthlySalary || '0') : undefined,
          annualSalary: data.paymentType === 'annual' ? parseFloat(data.annualSalary || '0') : undefined,
          paymentType: data.paymentType,
          paymentFrequency: data.paymentFrequency,
          
          allowances: {
            overtime: parseFloat(data.overtimeRate),
            irregular: parseFloat(data.irregularRate),
            shift: parseFloat(data.shiftRate),
            evening: parseFloat(data.eveningRate),
            night: parseFloat(data.nightRate),
            weekend: parseFloat(data.weekendRate),
            sunday: parseFloat(data.sundayRate)
          },
          
          travelAllowancePerKm: parseFloat(data.travelAllowancePerKm),
          phoneAllowance: data.phoneAllowance ? parseFloat(data.phoneAllowance) : undefined,
          internetAllowance: data.internetAllowance ? parseFloat(data.internetAllowance) : undefined,
          
          taxTable: data.taxTable,
          taxCredit: data.taxCredit,
          socialSecurityNumber: data.socialSecurityNumber
        },
        
        leaveInfo: {
          vacation: {
            entitlement: parseFloat(data.vacationEntitlement),
            accrued: 0,
            taken: 0,
            remaining: parseFloat(data.vacationEntitlement)
          },
          adv: data.advDays ? {
            accumulated: parseFloat(data.advDays),
            taken: 0,
            remaining: parseFloat(data.advDays)
          } : undefined,
          seniorDays: data.seniorDays ? parseFloat(data.seniorDays) : 0,
          snipperDays: data.snipperDays ? parseFloat(data.snipperDays) : 0
        },
        
        status: 'active',
        hasAccount: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (editEmployee) {
        // Update existing employee
        // TODO: Implement update functionality
        showError('Fout', 'Update functionaliteit nog niet geïmplementeerd');
        return;
      } else {
        // Create new employee with smart Buddy assignment
        const employee = await ecosystemService.createEmployeeWithBuddyDefaults(employeeData);
        
        // Assign to project companies if selected
        if (selectedProjectCompanies.length > 0) {
          await ecosystemService.assignEmployeeToProjects(employee.id, selectedProjectCompanies);
        }
        
        success(
          'Werknemer toegevoegd', 
          `${data.firstName} ${data.lastName} is succesvol toegevoegd aan ${buddyCompany.name}${
            selectedProjectCompanies.length > 0 ? ` en ${selectedProjectCompanies.length} projectbedrijven` : ''
          }.`
        );
      }

      onEmployeeCreated();
      onClose();
      reset();
      setSelectedProjectCompanies([]);

    } catch (error) {
      console.error('Error creating employee:', error);
      showError('Fout bij aanmaken', 'Er is een fout opgetreden bij het aanmaken van de werknemer.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {editEmployee ? 'Werknemer bewerken' : 'Nieuwe werknemer toevoegen'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
          {/* Buddy Assignment Section */}
          {!editEmployee && buddyCompany && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Target className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  Bedrijfstoewijzing
                </h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoAssignToBuddy"
                    checked={autoAssignToBuddy}
                    onChange={(e) => setAutoAssignToBuddy(e.target.checked)}
                    className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="autoAssignToBuddy" className="ml-2 text-sm font-medium text-gray-700">
                    Automatisch toewijzen aan {buddyCompany.name} (primaire werkgever)
                  </label>
                </div>
                
                <p className="text-xs text-gray-600">
                  Werknemers worden standaard toegewezen aan je hoofdwerkgever voor salarisbeheer.
                  Projectbedrijven kunnen later worden toegewezen voor urenregistratie.
                </p>

                {/* Project Companies Assignment */}
                {availableProjectCompanies.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Projectbedrijven (optioneel)
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
                      {availableProjectCompanies.map((company) => (
                        <label key={company.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedProjectCompanies.includes(company.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProjectCompanies([...selectedProjectCompanies, company.id]);
                              } else {
                                setSelectedProjectCompanies(selectedProjectCompanies.filter(id => id !== company.id));
                              }
                            }}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {company.name}
                          </span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Selecteer projectbedrijven waar deze werknemer uren voor kan registreren.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Personal Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Persoonlijke gegevens
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Voornaam *
                </label>
                <Input
                  {...register('firstName', { required: 'Voornaam is verplicht' })}
                  error={errors.firstName?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Achternaam *
                </label>
                <Input
                  {...register('lastName', { required: 'Achternaam is verplicht' })}
                  error={errors.lastName?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Initialen *
                </label>
                <Input
                  {...register('initials', { required: 'Initialen zijn verplicht' })}
                  error={errors.initials?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  BSN *
                </label>
                <Input
                  {...register('bsn', { 
                    required: 'BSN is verplicht',
                    pattern: {
                      value: /^\d{9}$/,
                      message: 'BSN moet 9 cijfers bevatten'
                    }
                  })}
                  error={errors.bsn?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Geboortedatum *
                </label>
                <Input
                  type="date"
                  {...register('dateOfBirth', { required: 'Geboortedatum is verplicht' })}
                  error={errors.dateOfBirth?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Geboorteplaats *
                </label>
                <Input
                  {...register('placeOfBirth', { required: 'Geboorteplaats is verplicht' })}
                  error={errors.placeOfBirth?.message}
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">Adresgegevens</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Straat *
                </label>
                <Input
                  {...register('street', { required: 'Straat is verplicht' })}
                  error={errors.street?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Huisnummer *
                </label>
                <Input
                  {...register('houseNumber', { required: 'Huisnummer is verplicht' })}
                  error={errors.houseNumber?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Toevoeging
                </label>
                <Input
                  {...register('houseNumberAddition')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Postcode *
                </label>
                <Input
                  {...register('postalCode', { 
                    required: 'Postcode is verplicht',
                    pattern: {
                      value: /^\d{4}\s?[A-Za-z]{2}$/,
                      message: 'Ongeldige postcode format'
                    }
                  })}
                  error={errors.postalCode?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Plaats *
                </label>
                <Input
                  {...register('city', { required: 'Plaats is verplicht' })}
                  error={errors.city?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Land *
                </label>
                <Input
                  {...register('country', { required: 'Land is verplicht' })}
                  error={errors.country?.message}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">Contactgegevens</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  E-mailadres *
                </label>
                <Input
                  type="email"
                  {...register('email', { 
                    required: 'E-mailadres is verplicht',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Ongeldig e-mailadres'
                    }
                  })}
                  error={errors.email?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefoonnummer *
                </label>
                <Input
                  {...register('phone', { required: 'Telefoonnummer is verplicht' })}
                  error={errors.phone?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rekeningnummer (IBAN) *
                </label>
                <Input
                  {...register('bankAccount', { required: 'Rekeningnummer is verplicht' })}
                  error={errors.bankAccount?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Burgerlijke staat
                </label>
                <select
                  {...register('maritalStatus')}
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="single">Ongehuwd</option>
                  <option value="married">Gehuwd</option>
                  <option value="registered_partnership">Geregistreerd partnerschap</option>
                  <option value="divorced">Gescheiden</option>
                  <option value="widowed">Weduwe/weduwnaar</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contract Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Contractgegevens
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contracttype *
                </label>
                <select
                  {...register('contractType', { required: 'Contracttype is verplicht' })}
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="permanent">Vast</option>
                  <option value="temporary">Tijdelijk</option>
                  <option value="zero_hours">Nul-urencontract</option>
                  <option value="on_call">Oproepcontract</option>
                  <option value="intern">Stage</option>
                  <option value="dga">DGA</option>
                  <option value="payroll">Payroll</option>
                  <option value="freelance">Freelance</option>
                </select>
                {errors.contractType && (
                  <p className="text-red-500 text-sm mt-1">{errors.contractType.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Startdatum *
                </label>
                <Input
                  type="date"
                  {...register('startDate', { required: 'Startdatum is verplicht' })}
                  error={errors.startDate?.message}
                />
              </div>

              {watchContractType === 'temporary' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Einddatum *
                  </label>
                  <Input
                    type="date"
                    {...register('endDate', { 
                      required: watchContractType === 'temporary' ? 'Einddatum is verplicht voor tijdelijk contract' : false 
                    })}
                    error={errors.endDate?.message}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Functie *
                </label>
                <Input
                  {...register('position', { required: 'Functie is verplicht' })}
                  error={errors.position?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Uren per week *
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="80"
                  {...register('hoursPerWeek', { required: 'Uren per week is verplicht' })}
                  error={errors.hoursPerWeek?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vestiging *
                </label>
                <select
                  {...register('branchId', { required: 'Vestiging is verplicht' })}
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Selecteer vestiging...</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} - {branch.location}
                    </option>
                  ))}
                </select>
                {errors.branchId && (
                  <p className="text-red-500 text-sm mt-1">{errors.branchId.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Salary Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Salarisinformatie
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Salarisschaal *
                </label>
                <Input
                  {...register('salaryScale', { required: 'Salarisschaal is verplicht' })}
                  error={errors.salaryScale?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Betalingstype *
                </label>
                <select
                  {...register('paymentType', { required: 'Betalingstype is verplicht' })}
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="hourly">Per uur</option>
                  <option value="monthly">Per maand</option>
                  <option value="annual">Per jaar</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Betalingsfrequentie *
                </label>
                <select
                  {...register('paymentFrequency', { required: 'Betalingsfrequentie is verplicht' })}
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="monthly">Maandelijks</option>
                  <option value="four_weekly">4-wekelijks</option>
                  <option value="weekly">Wekelijks</option>
                </select>
              </div>

              {watchPaymentType === 'hourly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Uurloon (€) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('hourlyRate', { 
                      required: watchPaymentType === 'hourly' ? 'Uurloon is verplicht' : false 
                    })}
                    error={errors.hourlyRate?.message}
                  />
                </div>
              )}

              {watchPaymentType === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Maandsalaris (€) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('monthlySalary', { 
                      required: watchPaymentType === 'monthly' ? 'Maandsalaris is verplicht' : false 
                    })}
                    error={errors.monthlySalary?.message}
                  />
                </div>
              )}

              {watchPaymentType === 'annual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Jaarsalaris (€) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('annualSalary', { 
                      required: watchPaymentType === 'annual' ? 'Jaarsalaris is verplicht' : false 
                    })}
                    error={errors.annualSalary?.message}
                  />
                </div>
              )}
            </div>

            {/* Allowances */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">Toeslagen (%)</h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Overwerk
                  </label>
                  <Input
                    type="number"
                    step="1"
                    min="100"
                    {...register('overtimeRate')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Onregelmatig
                  </label>
                  <Input
                    type="number"
                    step="1"
                    min="100"
                    {...register('irregularRate')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Avond
                  </label>
                  <Input
                    type="number"
                    step="1"
                    min="100"
                    {...register('eveningRate')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Weekend
                  </label>
                  <Input
                    type="number"
                    step="1"
                    min="100"
                    {...register('weekendRate')}
                  />
                </div>
              </div>
            </div>

            {/* Other allowances */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">Vergoedingen</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reisvergoeding per km (€)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('travelAllowancePerKm')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Telefoonvergoeding (€/maand)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('phoneAllowance')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Internetvergoeding (€/maand)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('internetAllowance')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Leave Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Verlofgegevens
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vakantiedagen per jaar *
                </label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  {...register('vacationEntitlement', { required: 'Vakantiedagen is verplicht' })}
                  error={errors.vacationEntitlement?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ADV dagen
                </label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  {...register('advDays')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Senior dagen
                </label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  {...register('seniorDays')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Snipperdagen
                </label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  {...register('snipperDays')}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                  {editEmployee ? 'Bijwerken...' : 'Toevoegen...'}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {editEmployee ? 'Bijwerken' : 'Toevoegen'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModal;