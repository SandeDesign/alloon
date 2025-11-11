// src/pages/ProjectProduction.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { Factory, Building2 } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import Card from '../components/ui/Card';

const ProjectProduction: React.FC = () => {
  const { user } = useAuth();
  const { selectedCompany } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load production data
    setLoading(false);
  }, [selectedCompany]);

  if (!selectedCompany) {
    return (
      <EmptyState
        icon={Building2}
        title="Geen bedrijf geselecteerd"
        description="Selecteer een projectbedrijf om productie te verwerken."
      />
    );
  }

  if (selectedCompany.companyType !== 'project') {
    return (
      <EmptyState
        icon={Factory}
        title="Dit is geen projectbedrijf"
        description="Productie verwerking is alleen beschikbaar voor projectbedrijven."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Productie Verwerking</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Beheer productie voor {selectedCompany.name}
        </p>
      </div>

      <Card className="p-8">
        <div className="text-center">
          <Factory className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Productie verwerking inhoud wordt hier ingevuld</p>
        </div>
      </Card>
    </div>
  );
};

export default ProjectProduction;