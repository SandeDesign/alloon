import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Mail, 
  Phone,
  Lock,
  AlertCircle,
  CheckCircle,
  Edit,
  Key,
  Copy
} from 'lucide-react';
import Card from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import EmployeeModal from '../components/employee/EmployeeModal';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../hooks/useToast';
import { 
  getEmployees, 
  deleteEmployee,
  generateSecurePassword,
  createEmployeeAuthAccount,
  saveTemporaryCredentials
} from '../services/firebase';
import { Employee } from '../types';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const EmployeesNew: React.FC = () => {
  const { user } = useAuth();
  const { selectedCompany } = useApp();
  const { success, error: showError } = useToast();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [creatingAccount, setCreatingAccount] = useState<string | null>(null);
  const [generatingPassword, setGeneratingPassword] = useState<string | null>(null);
  const [showCredentials, setShowCredentials] = useState<{ [key: string]: { email: string; password: string } }>({});
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  const loadEmployees = async () => {
    if (!user || !selectedCompany) return;

    try {
      setLoading(true);
      const employeesData = await getEmployees(user.uid, selectedCompany.id);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading employees:', error);
      showError('Fout bij laden', 'Kon werknemers niet laden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [user, selectedCompany]);

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleDeleteEmployee = async (employeeId: string, employeeName: string) => {
    if (!confirm(`Weet je zeker dat je ${employeeName} wilt verwijderen?`)) {
      return;
    }

    if (!user) return;

    try {
      await deleteEmployee(employeeId, user.uid);
      success('Werknemer verwijderd', `${employeeName} is verwijderd`);
      loadEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      showError('Fout bij verwijderen', 'Kon werknemer niet verwijderen');
    }
  };

  const handleCreateAccount = async (employee: Employee) => {
    if (!user) return;

    try {
      setCreatingAccount(employee.id);
      
      const password = generateSecurePassword();
      
      const newUserId = await createEmployeeAuthAccount(
        employee.id,
        user.uid,
        employee.personalInfo.contactInfo.email,
        password
      );

      await saveTemporaryCredentials(
        employee.id,
        employee.personalInfo.contactInfo.email,
        password
      );

      setShowCredentials({
        ...showCredentials,
        [employee.id]: {
          email: employee.personalInfo.contactInfo.email,
          password
        }
      });

      success(
        'Account aangemaakt',
        `Account voor ${employee.personalInfo.firstName} is aangemaakt. Wachtwoord: ${password}`
      );

      loadEmployees();
    } catch (error) {
      console.error('Error creating account:', error);
      showError('Fout bij aanmaken', 'Kon account niet aanmaken');
    } finally {
      setCreatingAccount(null);
    }
  };

  const generatePassword = (): string => {
    const length = 12;
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleGenerateAndSavePassword = async (employeeId: string, employeeName: string) => {
    try {
      setGeneratingPassword(employeeId);
      const newPassword = generatePassword();
      
      const employeeRef = doc(db, 'employees', employeeId);
      await updateDoc(employeeRef, {
        password: newPassword,
        updatedAt: Timestamp.fromDate(new Date())
      });
      
      setShowCredentials({
        ...showCredentials,
        [employeeId]: {
          email: employees.find(e => e.id === employeeId)?.personalInfo.contactInfo.email || '',
          password: newPassword
        }
      });

      success('Wachtwoord gegenereerd en opgeslagen', `Nieuw wachtwoord voor ${employeeName} is opgeslagen`);
    } catch (error) {
      console.error('Error updating password:', error);
      showError('Fout bij bijwerken', 'Kon wachtwoord niet opslaan');
    } finally {
      setGeneratingPassword(null);
    }
  };

  const handleCopyPassword = (employeeId: string) => {
    const password = showCredentials[employeeId]?.password;
    if (password) {
      navigator.clipboard.writeText(password);
      setCopiedUserId(employeeId);
      setTimeout(() => setCopiedUserId(null), 2000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actief';
      case 'inactive': return 'Inactief';
      case 'archived': return 'Gearchiveerd';
      default: return status;
    }
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
      <Card>
        <div className="p-6">
          <div className="flex items-center space-x-3 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            <p>Selecteer eerst een bedrijf om werknemers te beheren</p>
          </div>
          <button
            onClick={() => window.location.href = '/companies'}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Bedrijf Toevoegen
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Werknemers</h1>
          <p className="mt-1 text-sm text-gray-500">
            Beheer werknemers voor {selectedCompany.name}
          </p>
        </div>
        <button
          onClick={handleAddEmployee}
          className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <Plus className="h-5 w-5" />
          Werknemer Toevoegen
        </button>
      </div>

      {/* Employee Modal */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadEmployees}
        employee={selectedEmployee}
      />

      {/* Empty State */}
      {employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Geen werknemers gevonden"
          description={`Voeg je eerste werknemer toe voor ${selectedCompany.name}`}
          actionLabel="Eerste Werknemer Toevoegen"
          onAction={handleAddEmployee}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((employee) => (
            <div key={employee.id}>
              <Card className="p-6 hover:shadow-lg transition-shadow h-full flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {employee.personalInfo.firstName} {employee.personalInfo.lastName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {employee.contractInfo.position}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(employee.status)}`}>
                    {getStatusText(employee.status)}
                  </span>
                </div>

                {/* Info */}
                <div className="space-y-2 mb-4 flex-grow">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="h-4 w-4" />
                    <span>{employee.personalInfo.contactInfo.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="h-4 w-4" />
                    <span>{employee.personalInfo.contactInfo.phone || 'Niet ingevuld'}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Contract:</span> {employee.contractInfo.type}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Uren per week:</span> {employee.contractInfo.hoursPerWeek}
                  </div>
                </div>

                {/* Credentials Display */}
                {showCredentials[employee.id] && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded-lg mb-4 text-xs space-y-1">
                    <p className="font-medium text-green-800 dark:text-green-200">Wachtwoord:</p>
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded border border-green-100 dark:border-green-800">
                      <code className="text-green-600 dark:text-green-400 font-mono flex-1 break-all">{showCredentials[employee.id].password}</code>
                      <button
                        onClick={() => handleCopyPassword(employee.id)}
                        className={`flex-shrink-0 p-1 rounded transition-colors ${copiedUserId === employee.id ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                        title={copiedUserId === employee.id ? 'Gekopieerd!' : 'Kopieer wachtwoord'}
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {!employee.hasAccount ? (
                    <button
                      onClick={() => handleCreateAccount(employee)}
                      disabled={creatingAccount === employee.id}
                      className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/10 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                      title="Account aanmaken"
                    >
                      {creatingAccount === employee.id ? (
                        <div className="animate-spin">
                          <Lock className="h-5 w-5" />
                        </div>
                      ) : (
                        <Lock className="h-5 w-5" />
                      )}
                    </button>
                  ) : (
                    <button
                      className="p-2 text-green-600 rounded-lg cursor-default"
                      title="Account actief"
                    >
                      <CheckCircle className="h-5 w-5" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleGenerateAndSavePassword(employee.id, `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`)}
                    disabled={generatingPassword === employee.id}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                    title="Genereer en sla wachtwoord op"
                  >
                    {generatingPassword === employee.id ? (
                      <div className="animate-spin">
                        <Key className="h-5 w-5" />
                      </div>
                    ) : (
                      <Key className="h-5 w-5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleEditEmployee(employee)}
                    className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Bewerken"
                  >
                    <Edit className="h-5 w-5" />
                  </button>

                  <button
                    onClick={() => handleDeleteEmployee(employee.id, `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                    title="Verwijderen"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeesNew;