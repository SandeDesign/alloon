// src/pages/ProjectStatistics.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { BarChart3, Building2 } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import Card from '../components/ui/Card';

const ProjectStatistics: React.FC = () => {
  const { user } = useAuth();
  const { selectedCompany } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load statistics data
    setLoading(false);
  }, [selectedCompany]);

  if (!selectedCompany) {
    return (
      <EmptyState
        icon={Building2}
        title="Geen bedrijf geselecteerd"
        description="Selecteer een projectbedrijf om statistieken te bekijken."
      />
    );
  }

  if (selectedCompany.companyType !== 'project') {
    return (
      <EmptyState
        icon={BarChart3}
        title="Dit is geen projectbedrijf"
        description="Statistieken zijn alleen beschikbaar voor projectbedrijven."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Statistieken</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Facturatie statistieken voor {selectedCompany.name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Inkomende Facturen
          </h3>
          <div className="text-center py-8">
            <p className="text-gray-500">Statistieken worden hier ingevuld</p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Uitgaande Facturen
          </h3>
          <div className="text-center py-8">
            <p className="text-gray-500">Statistieken worden hier ingevuld</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProjectStatistics;