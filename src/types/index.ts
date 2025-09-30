export interface Company {
  id: string;
  userId: string;
  name: string;
  kvk: string;
  taxNumber: string;
  address: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
  contactInfo: {
    email: string;
    phone: string;
    website?: string;
  };
  settings: {
    defaultCAO: string;
    travelAllowancePerKm: number;
    standardWorkWeek: number;
    holidayAllowancePercentage: number;
    pensionContributionPercentage: number;
  };
  logoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Branch {
  id: string;
  userId: string;
  companyId: string;
  name: string;
  location: string;
  costCenter: string;
  cao?: string;
  specificSettings?: {
    overtimeRate: number;
    irregularRate: number;
    shiftRate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: string;
  userId: string;
  companyId: string;
  branchId: string;
  
  // PERSOONLIJKE GEGEVENS (uitgebreid)
  personalInfo: {
    firstName: string;
    lastName: string;
    initials: string;
    bsn: string; // VERPLICHT - Burgerservicenummer (11-proef validatie)
    dateOfBirth: Date;
    placeOfBirth: string;
    nationality: string;
    
    address: {
      street: string;
      houseNumber: string;
      houseNumberAddition?: string;
      postalCode: string; // Format: 1234 AB
      city: string;
      country: string;
    };
    
    contactInfo: {
      email: string;
      phone: string;
      emergencyContact?: {
        name: string;
        phone: string;
        relation: string;
      };
    };
    
    bankAccount: string;
    maritalStatus: 'single' | 'married' | 'registered_partnership' | 'divorced' | 'widowed';
    
    // Kopie identiteitsbewijs (bestandsnaam/URL)
    identityDocument?: string;
  };
  
  // CONTRACT INFORMATIE (uitgebreid)
  contractInfo: {
    type: 'permanent' | 'temporary' | 'zero_hours' | 'on_call' | 'intern' | 'dga' | 'payroll' | 'freelance';
    startDate: Date;
    endDate?: Date; // Verplicht bij temporary
    probationPeriod?: number; // In maanden
    hoursPerWeek: number;
    position: string;
    department?: string;
    costCenter?: string;
    
    // CAO informatie
    cao: string; // Bijv. "Bouw", "Horeca", "Zorg", "Metaal", "Algemeen"
    caoCode?: string;
    
    // Contract status
    contractStatus: 'active' | 'notice_period' | 'ended' | 'suspended';
    noticeDate?: Date; // Datum opzegging
    endReason?: string; // Reden einde contract
  };
  
  // LOON GEGEVENS (uitgebreid)
  salaryInfo: {
    salaryScale: string; // A-F of custom
    
    // Primair loon
    hourlyRate?: number;
    monthlySalary?: number;
    annualSalary?: number;
    
    // Type loon
    paymentType: 'hourly' | 'monthly' | 'annual';
    paymentFrequency: 'monthly' | 'four_weekly' | 'weekly';
    
    // Toeslagen percentages
    allowances: {
      overtime: number; // % (bijv. 150)
      irregular: number; // % avond/nacht/weekend
      shift: number; // % ploegendienst
      weekend: number; // % weekend
      evening?: number; // % 18:00-23:00
      night?: number; // % 23:00-06:00
      sunday?: number; // % zondag
      callDuty?: number; // % consignatie
    };
    
    // Vergoedingen
    holidayAllowancePercentage: number; // Standaard 8%
    thirteenthMonth: boolean; // 13e maand
    endOfYearBonus?: number; // Eindejaarsuitkering
    
    travelAllowance: {
      type: 'per_km' | 'public_transport' | 'fixed';
      amountPerKm?: number; // €0,23 standaard
      fixedAmount?: number;
    };
    
    phoneAllowance?: number;
    homeWorkAllowance?: number; // Thuiswerkvergoeding
    clothingAllowance?: number;
    
    // Pensioenpremie
    pensionScheme?: string;
    pensionContribution: number;
    pensionEmployerContribution: number; // % werkgever aandeel
    pensionFund?: string; // Naam pensioenfonds
    
    // Fiscale gegevens
    taxCredit: boolean; // Loonheffingskorting toepassen
    taxTable: 'white' | 'green' | 'special'; // Wit/Groen/Bijzondere tabel
    
    // Aftrekposten
    deductions?: {
      type: string; // 'advance' | 'loan' | 'garnishment' | 'contribution'
      amount: number;
      description: string;
      active: boolean;
    }[];
    
    // Auto van de zaak
    companyCarBenefit?: {
      catalogValue: number;
      co2Emission: number;
      privateUsePercentage: number; // Bijtelling %
      monthlyAmount: number;
    };
  };
  
  // VERLOF & VERZUIM
  leaveInfo: {
    // Vakantiedagen
    holidayDays: {
      statutory: number; // Wettelijk (4x contracturen per week)
      extraStatutory: number; // Bovenwettelijk
      accumulated: number; // Opgebouwd
      taken: number; // Opgenomen
      remaining: number; // Resterend
      expiryDate: Date; // Vervaldatum (5 jaar)
    };
    
    // ADV dagen
    advDays?: {
      accumulated: number;
      taken: number;
      remaining: number;
    };
    
    // Overige dagen
    seniorDays?: number;
    snipperDays?: number;
  };
  
  status: 'active' | 'inactive' | 'on_leave' | 'sick';
  
  createdAt: Date;
  updatedAt: Date;
  
  // Historie
  salaryHistory?: {
    date: Date;
    oldValue: number;
    newValue: number;
    reason: string;
    changedBy: string;
  }[];
}

export interface TimeEntry {
  id: string;
  userId: string;
  employeeId: string;
  date: Date;
  regularHours: number;
  overtimeHours: number;
  irregularHours: number;
  travelKilometers: number;
  project?: string;
  branchId: string;
  status: 'draft' | 'approved' | 'processed';
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollCalculation {
  id: string;
  userId: string;
  employeeId: string;
  period: {
    month: number;
    year: number;
  };
  gross: {
    baseSalary: number;
    overtime: number;
    irregularHours: number;
    shift: number;
    total: number;
  };
  allowances: {
    travel: number;
    holiday: number;
    total: number;
  };
  deductions: {
    tax: number;
    pension: number;
    other: number;
    total: number;
  };
  net: number;
  breakdown: any[];
  status: 'calculated' | 'approved' | 'paid';
  createdAt: Date;
  updatedAt: Date;
}

export interface Regulation {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: 'tax' | 'minimum-wage' | 'pension' | 'cao' | 'other';
  effectiveDate: Date;
  endDate?: Date;
  sourceUrl: string;
  isNew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  activeEmployees: number;
  totalGrossThisMonth: number;
  companiesCount: number;
  branchesCount: number;
  pendingApprovals: number;
}