import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Shield,
  Mail,
  Ban,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../hooks/useToast';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SystemUser {
  id: string;
  uid?: string;
  email: string;
  displayName?: string;
  name?: string;
  role: 'admin' | 'manager' | 'employee';
  isActive?: boolean;
  companyIds?: string[];
  permissions?: string[];
  createdAt?: Date;
  lastLoginAt?: Date;
  createdBy?: string;
  updatedAt?: Date;
}

const AdminUsers: React.FC = () => {
  const { user } = useAuth();
  const { companies } = useApp();
  const { success, error: showError } = useToast();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadUsers = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get all users from Firebase - just query all without orderBy first
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      
      console.log('Firebase users found:', usersSnapshot.docs.length);
      
      const usersData: SystemUser[] = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('User data:', data); // Debug log
        
        return {
          id: doc.id,
          uid: data.uid,
          email: data.email || '',
          displayName: data.displayName || data.name || '',
          name: data.name,
          role: data.role || 'employee',
          isActive: data.isActive !== false, // Default to true if not set
          companyIds: data.companyIds || [],
          permissions: data.permissions || [],
          createdAt: data.createdAt?.toDate(),
          lastLoginAt: data.lastLoginAt?.toDate(),
          createdBy: data.createdBy,
          updatedAt: data.updatedAt?.toDate()
        };
      });

      console.log('Processed users:', usersData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      showError('Fout bij laden', 'Kon gebruikers niet laden');
    } finally {
      setLoading(false);
    }
  }, [user, showError]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = users.filter(user => {
    const name = user.displayName || user.name || '';
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActive !== false) ||
                         (statusFilter === 'inactive' && user.isActive === false);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUpdateUserRole = async (userId: string, newRole: SystemUser['role']) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date()
      });
      
      success('Rol bijgewerkt', 'Gebruikersrol is succesvol gewijzigd');
      loadUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      showError('Fout bij bijwerken', 'Kon gebruikersrol niet wijzigen');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isActive: !currentStatus,
        updatedAt: new Date()
      });
      
      const statusText = !currentStatus ? 'geactiveerd' : 'gedeactiveerd';
      success('Status bijgewerkt', `Gebruiker is ${statusText}`);
      loadUsers();
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Fout bij bijwerken', 'Kon gebruikersstatus niet wijzigen');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Weet je zeker dat je deze gebruiker wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
      success('Gebruiker verwijderd', 'Gebruiker is succesvol verwijderd');
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showError('Fout bij verwijderen', 'Kon gebruiker niet verwijderen');
    }
  };

  const getRoleColor = (role: SystemUser['role']) => {
    switch (role) {
      case 'admin': return 'text-red-600 bg-red-100';
      case 'manager': return 'text-blue-600 bg-blue-100';
      case 'employee': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'text-green-600 bg-green-100'
      : 'text-red-600 bg-red-100';
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Nooit';
    return new Intl.DateTimeFormat('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gebruikersbeheer</h1>
          <p className="mt-1 text-sm text-gray-500">
            Beheer systeemgebruikers en hun rollen ({users.length} gebruikers gevonden)
          </p>
        </div>
        <Button icon={Plus}>
          Nieuwe Gebruiker
        </Button>
      </div>

      {/* Debug Info */}
      {users.length === 0 && !loading && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <p className="text-yellow-800">
            <strong>Debug:</strong> Geen gebruikers gevonden in de 'users' collectie. 
            Controleer of de collectie bestaat en of je de juiste rechten hebt.
          </p>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Zoek op naam of email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle rollen</option>
                <option value="admin">Administrator</option>
                <option value="manager">Manager</option>
                <option value="employee">Werknemer</option>
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle statussen</option>
                <option value="active">Actief</option>
                <option value="inactive">Inactief</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Totaal</p>
              <p className="text-xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Actief</p>
              <p className="text-xl font-bold text-gray-900">
                {users.filter(u => u.isActive !== false).length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Admins</p>
              <p className="text-xl font-bold text-gray-900">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <Ban className="h-8 w-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Inactief</p>
              <p className="text-xl font-bold text-gray-900">
                {users.filter(u => u.isActive === false).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Geen gebruikers gevonden"
          description={users.length === 0 
            ? "Er zijn nog geen gebruikers in de database"
            : "Pas je filters aan om meer resultaten te zien"
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gebruiker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aangemaakt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((systemUser) => (
                  <tr key={systemUser.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <Users className="h-5 w-5 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {systemUser.displayName || systemUser.name || 'Geen naam'}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {systemUser.email}
                          </div>
                          {systemUser.uid && (
                            <div className="text-xs text-gray-400">
                              UID: {systemUser.uid.substring(0, 8)}...
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={systemUser.role}
                        onChange={(e) => handleUpdateUserRole(systemUser.id, e.target.value as SystemUser['role'])}
                        className={`text-sm px-2 py-1 rounded-full border-none ${getRoleColor(systemUser.role)}`}
                      >
                        <option value="admin">Administrator</option>
                        <option value="manager">Manager</option>
                        <option value="employee">Werknemer</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleUserStatus(systemUser.id, systemUser.isActive !== false)}
                        className={`text-sm px-2 py-1 rounded-full border-none cursor-pointer ${getStatusColor(systemUser.isActive !== false)}`}
                      >
                        {systemUser.isActive !== false ? 'Actief' : 'Inactief'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(systemUser.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Edit}
                        >
                          Bewerken
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleDeleteUser(systemUser.id)}
                        >
                          Verwijderen
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminUsers;