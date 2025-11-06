import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Copy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { 
  createEmployee, 
  updateEmployee, 
  getCompanies, 
  getBranches,
  createEmployeeAuthAccount,
  generateSecurePassword,
  saveTemporaryCredentials
} from '../../services/firebase';
import { Employee, Company, Branch } from '../../types';

interface SimplifiedEmployeeFormData {
  firstName: string;
  lastName: string;
  email: string;
  startDate: string;
  contractType: 'permanent' | 'temporary' | 'zero_hours' | 'on_call' | 'intern' | 'dga' | 'payroll' | 'freelance';
  endDate?: string;
  position: string;
  hoursPerWeek: number;
  paymentType: 'hourly' | 'monthly' | 'annual';
  hourlyRate?: number;
  monthlySalary?: number;
  companyId: string;
  branchId: string;
  projectCompanies?: string[];
  createEmployeeAccount?: boolean;
}

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee?: Employee | null;
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({ isOpen, onClose, onSuccess, employee }) => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [projectCompanies, setProjectCompanies] = useState<Company[]>([]);
  const [selectedProjectCompanies, setSelectedProjectCompanies] = useState<string[]>([]);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [showCredentials, setShowCredentials] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<SimplifiedEmployeeFormData>({
    defaultValues: {
      contractType: 'permanent',
      paymentType: 'hourly',
      hoursPerWeek: 40,
      createEmployeeAccount: true,
    }
  });

  const contractType = watch('contractType');
  const paymentType = watch('paymentType');
  const selectedCompanyId = watch('companyId');
  const createEmployeeAccount = watch('createEmployeeAccount');
  const emailValue = watch('email');

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {
          const companiesData = await getCompanies(user.uid);
          const branchesData = await getBranches(user.uid);
          
          setCompanies(companiesData.filter(c => c.companyType === 'employer'));
          setProjectCompanies(companiesData.filter(c => c.companyType === 'project'));
          setBranches(branchesData);
        } catch (error) {
          console.error('Error loading data:', error);
        }
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (employee) {
      reset({
        firstName: employee.personalInfo.firstName,
        lastName: employee.personalInfo.lastName,
        email: employee.personalInfo.contactInfo.email,
        startDate: employee.contractInfo.startDate.toISOString().split('T')[0],
        endDate: employee.contractInfo.endDate?.toISOString().split('T')[0],
        contractType: employee.contractInfo.type,
        hoursPerWeek: employee.contractInfo.hoursPerWeek,
        position: employee.contractInfo.position,
        paymentType: employee.salaryInfo.paymentType,
        hourlyRate: employee.salaryInfo.hourlyRate,
        monthlySalary: employee.salaryInfo.monthlySalary,
        companyId: employee.companyId,
        branchId: employee.branchId,
        createEmployeeAccount: false,
      });
      
      setSelectedProjectCompanies(employee.projectCompanies || []);
    } else if (companies.length > 0) {
      const defaultCompanyId = companies[0].id;
      const defaultBranchId = branches.find(b => b.companyId === defaultCompanyId)?.id || '';
      reset({
        contractType: 'permanent',
        paymentType: 'hourly',
        companyId: defaultCompanyId,
        branchId: defaultBranchId,
        hoursPerWeek: 40,
        createEmployeeAccount: true,
      });
      setSelectedProjectCompanies([]);
    }
  }, [employee, companies, branches, reset, isOpen]);

  // ✅ Generate password when account creation is enabled
  useEffect(() => {
    if (createEmployeeAccount && !employee) {
      const password = generateSecurePassword();
      setGeneratedPassword(password);
      setShowCredentials(true);
    } else {
      setGeneratedPassword('');
      setShowCredentials(false);
    }
  }, [createEmployeeAccount, employee]);

  const handleProjectCompanyToggle = (companyId: string) => {
    setSelectedProjectCompanies(prev => 
      prev.includes(companyId) 
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    success('Gekopieerd', `${label} gekopieerd naar klembord`);
  };

  const onSubmit = async (data: SimplifiedEmployeeFormData) => {
    if (!user) {
      showError('Niet ingelogd', 'Je moet ingelogd zijn om een werknemer toe te voegen');
      return;
    }

    if (!data.companyId || !data.branchId) {
      showError('Incomplete data', 'Selecteer een bedrijf en vestiging');
      return;
    }

    if (contractType === 'temporary' && !data.endDate) {
      showError('Einddatum vereist', 'Einddatum is verplicht voor tijdelijk contract');
      return;
    }

    if (paymentType === 'hourly' && !data.hourlyRate) {
      showError('Uurtarief vereist', 'Uurtarief is verplicht voor uurloon');
      return;
    }

    if (paymentType === 'monthly' && !data.monthlySalary) {
      showError('Maandsalaris vereist', 'Maandsalaris is verplicht voor maandloon');
      return;
    }

    setSubmitting(true);
    try {
      const employeeData = {
        companyId: data.companyId,
        branchId: data.branchId,
        projectCompanies: selectedProjectCompanies,
        
        personalInfo: {
          firstName: data.firstName,
          lastName: data.lastName,
          initials: data.firstName.charAt(0) + data.lastName.charAt(0),
          bsn: '',
          dateOfBirth: new Date(),
          placeOfBirth: '',
          nationality: 'Nederlandse',
          address: {
            street: '',
            houseNumber: '',
            houseNumberAddition: '',
            postalCode: '',
            city: '',
            country: 'Nederland',
          },
          contactInfo: {
            email: data.email,
            phone: '',
          },
          bankAccount: '',
          maritalStatus: 'single' as const,
        },
        contractInfo: {
          type: data.contractType,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : undefined,
          hoursPerWeek: data.hoursPerWeek,
          position: data.position,
          department: '',
          cao: 'cao-algemeen',
          contractStatus: 'active' as const,
        },
        salaryInfo: {
          salaryScale: 'A',
          hourlyRate: data.paymentType === 'hourly' ? data.hourlyRate : undefined,
          monthlySalary: data.paymentType === 'monthly' ? data.monthlySalary : undefined,
          annualSalary: data.paymentType === 'annual' ? data.monthlySalary : undefined,
          paymentType: data.paymentType,
          paymentFrequency: 'monthly' as const,
          allowances: {
            overtime: 125,
            irregular: 115,
            shift: 112,
            evening: 107,
            night: 120,
            weekend: 145,
            sunday: 200,
          },
          travelAllowancePerKm: 0.23,
          taxTable: 'white' as const,
          taxCredit: true,
        },
        leaveInfo: {
          vacation: {
            entitlement: Math.floor(data.hoursPerWeek * 4),
            accrued: 0,
            taken: 0,
            remaining: Math.floor(data.hoursPerWeek * 4),
          },
        },
        status: 'active' as const,
        hasAccount: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      let employeeId: string;

      if (employee) {
        await updateEmployee(employee.id, user.uid, {
          ...employeeData,
          updatedAt: new Date(),
        });
        employeeId = employee.id;
        success('Werknemer bijgewerkt', `${data.firstName} ${data.lastName} is succesvol bijgewerkt`);
      } else {
        employeeId = await createEmployee(user.uid, employeeData);
        success('Werknemer aangemaakt', `${data.firstName} ${data.lastName} is succesvol aangemaakt`);
      }

      // ✅ Create employee account if requested
      if (data.createEmployeeAccount && !employee && generatedPassword) {
        try {
          console.log('Creating employee account for:', data.email);
          const newAuthUserId = await createEmployeeAuthAccount(
            employeeId,
            user.uid,
            data.email,
            generatedPassword
          );

          // ✅ NIEUW: Save credentials to Firestore for 24 hours
          await saveTemporaryCredentials(
            employeeId,
            user.uid,
            data.email,
            generatedPassword
          );

          success(
            'Account aangemaakt',
            `Email: ${data.email}\nWachtwoord opgeslagen voor 24 uur`
          );
        } catch (accountError) {
          console.error('Error creating employee account:', accountError);
          showError(
            'Account creatie fout',
            'Werknemer is aangemaakt maar account creatie is mislukt. Probeer handmatig een account aan te maken.'
          );
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving employee:', error);
      showError('Fout bij opslaan', 'Kon werknemer niet opslaan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedProjectCompanies([]);
    setGeneratedPassword('');
    setShowCredentials(false);
    onClose();
  };

  const availableBranches = branches.filter(branch => branch.companyId === selectedCompanyId);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={employee ? 'Werknemer bewerken' : 'Nieuwe werknemer'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Persoonlijke gegevens */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Persoonlijke gegevens</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Voornaam *"
              {...register('firstName', { required: 'Voornaam is verplicht' })}
              error={errors.firstName?.message}
            />
            <Input
              label="Achternaam *"
              {...register('lastName', { required: 'Achternaam is verplicht' })}
              error={errors.lastName?.message}
            />
          </div>
          <Input
            label="E-mailadres *"
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

        {/* Bedrijfstoewijzing */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Primaire werkgever</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bedrijf *
              </label>
              <select
                {...register('companyId', { required: 'Selecteer een bedrijf' })}
                className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Selecteer bedrijf...</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              {errors.companyId && (
                <p className="text-red-500 text-sm mt-1">{errors.companyId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Vestiging *
              </label>
              <select
                {...register('branchId', { required: 'Selecteer een vestiging' })}
                className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                disabled={!selectedCompanyId}
              >
                <option value="">Selecteer vestiging...</option>
                {availableBranches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              {errors.branchId && (
                <p className="text-red-500 text-sm mt-1">{errors.branchId.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Projectbedrijven */}
        {projectCompanies.length > 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Projectbedrijven</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Selecteer optioneel voor welke projectbedrijven deze werknemer kan werken
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {projectCompanies.map((projectCompany) => (
                <label 
                  key={projectCompany.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedProjectCompanies.includes(projectCompany.id)
                      ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-600'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedProjectCompanies.includes(projectCompany.id)}
                    onChange={() => handleProjectCompanyToggle(projectCompany.id)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {projectCompany.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Project bedrijf
                    </div>
                  </div>
                </label>
              ))}
            </div>
            
            {selectedProjectCompanies.length > 0 && (
              <div className="text-sm text-blue-600 dark:text-blue-400">
                ✓ {selectedProjectCompanies.length} projectbedri{selectedProjectCompanies.length === 1 ? 'jf' : 'jven'} geselecteerd
              </div>
            )}
          </div>
        )}

        {/* Contract informatie */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Contract informatie</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Startdatum *"
              type="date"
              {...register('startDate', { required: 'Startdatum is verplicht' })}
              error={errors.startDate?.message}
            />
            {contractType === 'temporary' && (
              <Input
                label="Einddatum *"
                type="date"
                {...register('endDate', { 
                  required: contractType === 'temporary' ? 'Einddatum is verplicht voor tijdelijk contract' : false 
                })}
                error={errors.endDate?.message}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contracttype *
              </label>
              <select
                {...register('contractType', { required: 'Selecteer een contracttype' })}
                className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="permanent">Vast contract</option>
                <option value="temporary">Tijdelijk contract</option>
                <option value="zero_hours">Nul-urencontract</option>
                <option value="on_call">Oproepcontract</option>
                <option value="intern">Stagiair</option>
                <option value="dga">DGA</option>
                <option value="payroll">Payroll</option>
                <option value="freelance">Freelancer</option>
              </select>
              {errors.contractType && (
                <p className="text-red-500 text-sm mt-1">{errors.contractType.message}</p>
              )}
            </div>

            <Input
              label="Uren per week *"
              type="number"
              {...register('hoursPerWeek', { 
                required: 'Uren per week is verplicht',
                min: { value: 1, message: 'Minimum 1 uur per week' },
                max: { value: 60, message: 'Maximum 60 uur per week' }
              })}
              error={errors.hoursPerWeek?.message}
            />
          </div>

          <Input
            label="Functie *"
            {...register('position', { required: 'Functie is verplicht' })}
            error={errors.position?.message}
          />
        </div>

        {/* Salaris informatie */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Salaris informatie</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Betalingstype *
            </label>
            <select
              {...register('paymentType', { required: 'Selecteer een betalingstype' })}
              className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="hourly">Uurloon</option>
              <option value="monthly">Maandloon</option>
              <option value="annual">Jaarloon</option>
            </select>
            {errors.paymentType && (
              <p className="text-red-500 text-sm mt-1">{errors.paymentType.message}</p>
            )}
          </div>

          {paymentType === 'hourly' && (
            <Input
              label="Uurtarief (€) *"
              type="number"
              step="0.01"
              {...register('hourlyRate', { 
                required: paymentType === 'hourly' ? 'Uurtarief is verplicht' : false,
                min: { value: 0, message: 'Uurtarief kan niet negatief zijn' }
              })}
              error={errors.hourlyRate?.message}
            />
          )}

          {paymentType === 'monthly' && (
            <Input
              label="Maandsalaris (€) *"
              type="number"
              step="0.01"
              {...register('monthlySalary', { 
                required: paymentType === 'monthly' ? 'Maandsalaris is verplicht' : false,
                min: { value: 0, message: 'Maandsalaris kan niet negatief zijn' }
              })}
              error={errors.monthlySalary?.message}
            />
          )}
        </div>

        {/* ✅ NIEUW: Employee Account Creation - Met Firestore opslag */}
        {!employee && (
          <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-600 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Account creatie</h3>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('createEmployeeAccount')}
                className="w-4 h-4 rounded border-gray-300"
              />
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Automatisch account aanmaken
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Werknemer krijgt automatisch inloggegevens (opgeslagen voor 24 uur)
                </p>
              </div>
            </label>

            {createEmployeeAccount && generatedPassword && showCredentials && (
              <div className="p-4 bg-white dark:bg-gray-800 rounded border border-blue-300 dark:border-blue-600 space-y-3">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  📧 E-mailadres:
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-900 rounded font-mono text-sm text-gray-900 dark:text-gray-100 break-all">
                    {emailValue}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(emailValue, 'E-mail')}
                    className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex-shrink-0"
                    title="Kopieëren"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-3">
                  🔐 Wachtwoord (gegenereerd):
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-900 rounded font-mono text-sm text-gray-900 dark:text-gray-100 break-all">
                    {generatedPassword}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedPassword, 'Wachtwoord')}
                    className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex-shrink-0"
                    title="Kopieëren"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                  ⏰ Dit wachtwoord wordt <strong>24 uur</strong> opgeslagen in de database. Je kan het daarna nog ophalen via de werknemerslijst.
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={handleClose} isFullWidth>
            Annuleren
          </Button>
          <Button type="submit" isLoading={submitting} isFullWidth>
            {employee ? 'Bijwerken' : 'Aanmaken'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EmployeeModal;