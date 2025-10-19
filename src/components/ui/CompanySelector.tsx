import React, { useState } from 'react';
import { Building2, ChevronDown, DollarSign, Briefcase } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { Company } from '../../types';

export const CompanySelector: React.FC = () => {
  const { companies, selectedCompany, setSelectedCompany } = useApp();
  const { userRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Only show for admin and manager roles
  if (!userRole || (!['admin', 'manager'].includes(userRole)) || companies.length === 0) {
    return null;
  }

  // Group companies by type
  const payrollCompanies = companies.filter(c => c.companyType === 'payroll_company');
  const workCompanies = companies.filter(c => c.companyType === 'work_company');
  
  // Buddy should be the default payroll company
  const buddyCompany = payrollCompanies.find(c => c.name.toLowerCase().includes('buddy'));
  const otherPayrollCompanies = payrollCompanies.filter(c => !c.name.toLowerCase().includes('buddy'));

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    setIsOpen(false);
  };

  const getCompanyIcon = (company: Company) => {
    return company.companyType === 'payroll_company' ? DollarSign : Briefcase;
  };

  const getCompanyTypeLabel = (company: Company) => {
    return company.companyType === 'payroll_company' ? 'Loonmaatschappij' : 'Werkmaatschappij';
  };

  return (
    <div className="relative">
      {/* Selected Company Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          {selectedCompany ? (
            <>
              {React.createElement(getCompanyIcon(selectedCompany), { 
                className: `h-5 w-5 ${selectedCompany.companyType === 'payroll_company' ? 'text-green-600' : 'text-blue-600'}` 
              })}
              <div className="text-left">
                <div className="font-medium text-gray-900">{selectedCompany.name}</div>
                <div className="text-xs text-gray-500">{getCompanyTypeLabel(selectedCompany)}</div>
              </div>
            </>
          ) : (
            <>
              <Building2 className="h-5 w-5 text-gray-400" />
              <div className="text-left">
                <div className="font-medium text-gray-500">Selecteer bedrijf</div>
                <div className="text-xs text-gray-400">Kies een bedrijf</div>
              </div>
            </>
          )}
        </div>
        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          
          {/* Dropdown */}
          <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <div className="max-h-80 overflow-y-auto">
              
              {/* Buddy Company (Loonmaatschappij) - Always first */}
              {buddyCompany && (
                <div>
                  <div className="px-4 py-2 bg-green-50 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-semibold text-green-800 uppercase tracking-wider">
                        Loonmaatschappij
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCompanySelect(buddyCompany)}
                    className={`w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                      selectedCompany?.id === buddyCompany.id ? 'bg-green-50 border-r-2 border-green-500' : ''
                    }`}
                  >
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium text-gray-900">{buddyCompany.name}</div>
                      <div className="text-xs text-gray-500">Hoofdkantoor & Loonverwerking</div>
                    </div>
                  </button>
                </div>
              )}

              {/* Other Payroll Companies */}
              {otherPayrollCompanies.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-green-50 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-semibold text-green-800 uppercase tracking-wider">
                        Andere Loonmaatschappijen
                      </span>
                    </div>
                  </div>
                  {otherPayrollCompanies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => handleCompanySelect(company)}
                      className={`w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                        selectedCompany?.id === company.id ? 'bg-green-50 border-r-2 border-green-500' : ''
                      }`}
                    >
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium text-gray-900">{company.name}</div>
                        <div className="text-xs text-gray-500">Loonmaatschappij</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Work Companies */}
              {workCompanies.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-blue-50 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <Briefcase className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
                        Werkmaatschappijen
                      </span>
                    </div>
                  </div>
                  {workCompanies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => handleCompanySelect(company)}
                      className={`w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                        selectedCompany?.id === company.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <Briefcase className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">{company.name}</div>
                        <div className="text-xs text-gray-500">
                          {company.payrollCompanyId && buddyCompany?.id === company.payrollCompanyId 
                            ? 'Loonverwerking via Buddy BV' 
                            : 'Werkmaatschappij'
                          }
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No Companies State */}
              {companies.length === 0 && (
                <div className="px-4 py-6 text-center text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <div className="font-medium">Geen bedrijven gevonden</div>
                  <div className="text-sm">Voeg eerst een bedrijf toe</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};