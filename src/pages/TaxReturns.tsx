import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Eye,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { TaxReturn, Company } from '../types';
import { getCompanies } from '../services/firebase';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useToast } from '../hooks/useToast';

const TaxReturns: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [taxReturns, setTaxReturns] = useState<TaxReturn[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const companiesData = await getCompanies(user.uid);
      setCompanies(companiesData);
      if (companiesData.length > 0) {
        setSelectedCompany(companiesData[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Fout bij laden gegevens', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: TaxReturn['status']) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'submitted':
        return <Send className="h-5 w-5 text-blue-500" />;
      case 'validated':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'draft':
        return <FileText className="h-5 w-5 text-gray-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusLabel = (status: TaxReturn['status']) => {
    const labels: Record<TaxReturn['status'], string> = {
      draft: 'Concept',
      validated: 'Gevalideerd',
      submitted: 'Ingediend',
      accepted: 'Geaccepteerd',
      rejected: 'Afgewezen',
      corrected: 'Gecorrigeerd',
    };
    return labels[status];
  };

  const getStatusColor = (status: TaxReturn['status']) => {
    const colors: Record<TaxReturn['status'], string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      validated: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      accepted: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      corrected: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    };
    return colors[status];
  };

  const getPeriodLabel = (period: TaxReturn['period']) => {
    if (period.type === 'monthly') {
      return `${period.month}/${period.year}`;
    } else if (period.type === 'quarterly') {
      return `Q${period.quarter} ${period.year}`;
    } else {
      return period.year.toString();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Loonaangiftes</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Beheer uw loonaangiftes naar de Belastingdienst
          </p>
        </div>
        <Button variant="primary">
          <Plus className="h-5 w-5 mr-2" />
          Nieuwe aangifte
        </Button>
      </div>

      {companies.length > 0 && (
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Bedrijf:
          </label>
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Concepten</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">0</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ingediend</p>
                <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">0</p>
              </div>
              <Send className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Geaccepteerd
                </p>
                <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">0</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Afgewezen</p>
                <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">0</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Komende deadlines
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Zorg ervoor dat u uw loonaangiftes op tijd indient
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center space-x-4">
                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Loonaangifte December 2025
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Deadline: 31 januari 2026
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400 rounded-full">
                  15 dagen resterend
                </span>
                <Button variant="primary" size="sm">
                  Indienen
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Ingediende aangiftes
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : taxReturns.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Nog geen loonaangiftes ingediend
              </p>
              <Button variant="primary" className="mt-4">
                <Plus className="h-5 w-5 mr-2" />
                Eerste aangifte maken
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Periode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Werknemers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Totaal loon
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ingediend op
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acties
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {taxReturns.map((taxReturn) => (
                    <tr key={taxReturn.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {getPeriodLabel(taxReturn.period)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(taxReturn.status)}
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              taxReturn.status
                            )}`}
                          >
                            {getStatusLabel(taxReturn.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {taxReturn.totals.numberOfEmployees}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        €{taxReturn.totals.totalGrossWages.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {taxReturn.submissionData.submittedAt?.toLocaleDateString('nl-NL') || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Bekijk"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                            title="Download XML"
                          >
                            <Download className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TaxReturns;
