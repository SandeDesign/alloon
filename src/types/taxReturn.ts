export interface TaxReturn {
  id: string;
  userId: string;
  companyId: string;

  period: {
    year: number;
    month?: number;
    quarter?: number;
    type: 'monthly' | 'quarterly' | 'annual';
  };

  status: 'draft' | 'validated' | 'submitted' | 'accepted' | 'rejected' | 'corrected';

  submissionData: {
    submittedAt?: Date;
    submittedBy?: string;
    responseReceivedAt?: Date;
    acceptanceNumber?: string;
    rejectionReason?: string;
  };

  employeeData: EmployeeTaxData[];

  totals: {
    totalGrossWages: number;
    totalTaxWithheld: number;
    totalSocialContributions: number;
    totalNetWages: number;
    numberOfEmployees: number;
  };

  xmlData?: string;
  validationErrors: ValidationError[];

  corrections?: {
    originalReturnId: string;
    correctionReason: string;
    correctionDate: Date;
  };

  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeTaxData {
  employeeId: string;
  bsn: string;
  fullName: string;

  periodData: {
    startDate: Date;
    endDate: Date;
    daysWorked: number;
  };

  wages: {
    grossSalary: number;
    overtime: number;
    bonuses: number;
    holidayAllowance: number;
    otherAllowances: number;
    total: number;
  };

  deductions: {
    pensionEmployee: number;
    otherDeductions: number;
    total: number;
  };

  tax: {
    taxableWage: number;
    taxWithheld: number;
    taxCredit: boolean;
    taxTable: 'white' | 'green' | 'special';
  };

  socialSecurity: {
    aow: number;
    wlz: number;
    ww: number;
    total: number;
  };

  benefits?: {
    companyCar?: number;
    otherBenefits?: number;
  };

  netWage: number;
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning';
  employeeId?: string;
}

export interface LoonaangifteXML {
  header: {
    submitterKvK: string;
    submitterTaxNumber: string;
    contactPerson: string;
    contactEmail: string;
    contactPhone: string;
  };

  period: {
    year: number;
    periodNumber: number;
    periodType: 'maand' | 'kwartaal' | 'jaar';
  };

  employees: XMLEmployeeData[];

  totals: {
    totalLoon: number;
    totalIngehouden: number;
    totalPremies: number;
  };
}

export interface XMLEmployeeData {
  bsn: string;
  voorletters: string;
  voorvoegsel?: string;
  achternaam: string;
  geboortedatum: string;

  inkomstenverhouding: {
    datumAanvang: string;
    datumEinde?: string;
    codeAardArbeidsverhouding: string;
    codeSoortInkomstenverhouding: string;
  };

  loongegevens: {
    loonTijdvak: string;
    loonOverTijdvak: number;
    loonheffing: number;
    premieVolksverzekeringen: {
      aow: number;
      wlz: number;
    };
    premieWerknemersverzekeringen: {
      ww: number;
    };
  };
}

export interface TaxReturnSettings {
  companyId: string;

  returnFrequency: 'monthly' | 'quarterly';

  contactInfo: {
    name: string;
    email: string;
    phone: string;
  };

  digipoortCertificate?: {
    filename: string;
    uploadedAt: Date;
    expiresAt: Date;
  };

  autoSubmit: boolean;

  notifications: {
    daysBeforeDeadline: number;
    notifyOnValidationErrors: boolean;
    notifyOnSubmissionSuccess: boolean;
  };

  updatedAt: Date;
}

export interface TaxReturnDeadline {
  year: number;
  period: number;
  periodType: 'monthly' | 'quarterly';
  deadline: Date;
  submitted: boolean;
  taxReturnId?: string;
}

export type TaxReturnStatus = TaxReturn['status'];
export type PeriodType = TaxReturn['period']['type'];
