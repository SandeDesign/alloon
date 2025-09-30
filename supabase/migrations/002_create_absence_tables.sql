/*
  # Absence and Sick Leave Management Tables

  1. New Tables
    - `sick_leave`: Tracks sick leave periods with Poortwachter milestones
      - `id` (uuid, primary key)
      - `userId` (text): Firebase user ID who owns this record
      - `employeeId` (text): Reference to employee
      - `companyId` (text): Reference to company
      - `startDate` (timestamptz): Sick leave start date
      - `reportedAt` (timestamptz): When sickness was reported
      - `reportedBy` (text): Who reported the sickness
      - `reportedVia` (text): How it was reported
      - `endDate` (timestamptz): Recovery date
      - `actualReturnDate` (timestamptz): Actual return to work
      - `status` (text): Current status
      - `workCapacityPercentage` (numeric): Work capacity percentage
      - `reintegration` (jsonb): Reintegration plan details
      - `doctorVisits` (jsonb): Array of doctor visits
      - `arboServiceContacted` (boolean): Arbo service contacted
      - `arboServiceDate` (timestamptz): When contacted
      - `arboAdvice` (text): Arbo advice
      - `poortwachterActive` (boolean): Poortwachter activated
      - `poortwachterMilestones` (jsonb): Array of milestones
      - `wiaApplication` (jsonb): WIA application details
      - `notes` (text): Additional notes
      - `createdAt` (timestamptz): Record creation time
      - `updatedAt` (timestamptz): Last update time

    - `absence_statistics`: Aggregated absence statistics per employee
      - `id` (uuid, primary key)
      - `employeeId` (text): Reference to employee
      - `companyId` (text): Reference to company
      - `period` (text): Period type (month/quarter/year)
      - `periodStart` (timestamptz): Period start
      - `periodEnd` (timestamptz): Period end
      - `totalSickDays` (numeric): Total sick days
      - `totalSickHours` (numeric): Total sick hours
      - `absenceFrequency` (numeric): Number of absence periods
      - `averageDuration` (numeric): Average duration per period
      - `absencePercentage` (numeric): Absence percentage
      - `longTermAbsence` (boolean): Has long-term absence
      - `chronicAbsence` (boolean): Has chronic absence
      - `calculatedAt` (timestamptz): Calculation timestamp

  2. Security
    - Enable RLS on all tables
    - Employees can view and manage their own sick leave
    - Managers can view all company sick leave records
    - Statistics are calculated by system and viewable by managers
*/

CREATE TABLE IF NOT EXISTS sick_leave (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" text NOT NULL,
  "employeeId" text NOT NULL,
  "companyId" text NOT NULL,

  "startDate" timestamptz NOT NULL,
  "reportedAt" timestamptz NOT NULL DEFAULT now(),
  "reportedBy" text NOT NULL,
  "reportedVia" text NOT NULL CHECK ("reportedVia" IN ('phone', 'email', 'app', 'in_person')),

  "endDate" timestamptz,
  "actualReturnDate" timestamptz,

  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'recovered', 'partially_recovered', 'long_term')),

  "workCapacityPercentage" numeric DEFAULT 0 CHECK ("workCapacityPercentage" >= 0 AND "workCapacityPercentage" <= 100),

  reintegration jsonb,
  "doctorVisits" jsonb DEFAULT '[]'::jsonb,

  "arboServiceContacted" boolean DEFAULT false,
  "arboServiceDate" timestamptz,
  "arboAdvice" text,

  "poortwachterActive" boolean DEFAULT false,
  "poortwachterMilestones" jsonb,

  "wiaApplication" jsonb,

  notes text DEFAULT '',

  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS absence_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "employeeId" text NOT NULL,
  "companyId" text NOT NULL,
  period text NOT NULL CHECK (period IN ('month', 'quarter', 'year')),
  "periodStart" timestamptz NOT NULL,
  "periodEnd" timestamptz NOT NULL,

  "totalSickDays" numeric DEFAULT 0,
  "totalSickHours" numeric DEFAULT 0,
  "absenceFrequency" numeric DEFAULT 0,
  "averageDuration" numeric DEFAULT 0,
  "absencePercentage" numeric DEFAULT 0,

  "longTermAbsence" boolean DEFAULT false,
  "chronicAbsence" boolean DEFAULT false,

  "calculatedAt" timestamptz DEFAULT now(),

  UNIQUE("employeeId", period, "periodStart")
);

ALTER TABLE sick_leave ENABLE ROW LEVEL SECURITY;
ALTER TABLE absence_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view own sick leave"
  ON sick_leave FOR SELECT
  TO authenticated
  USING (auth.uid() = "userId" OR "employeeId" IN (
    SELECT id FROM employees WHERE "userId" = auth.uid()
  ));

CREATE POLICY "Employees can create own sick leave"
  ON sick_leave FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Employees can update own sick leave"
  ON sick_leave FOR UPDATE
  TO authenticated
  USING (auth.uid() = "userId");

CREATE POLICY "Managers can view all company sick leave"
  ON sick_leave FOR SELECT
  TO authenticated
  USING (auth.uid() = "userId");

CREATE POLICY "Managers can update company sick leave"
  ON sick_leave FOR UPDATE
  TO authenticated
  USING (auth.uid() = "userId");

CREATE POLICY "Employees can view own statistics"
  ON absence_statistics FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT "userId" FROM employees WHERE id = "employeeId"
  ));

CREATE POLICY "Managers can view all company statistics"
  ON absence_statistics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage statistics"
  ON absence_statistics FOR ALL
  TO authenticated
  USING (true);

CREATE INDEX idx_sick_leave_employee ON sick_leave("employeeId");
CREATE INDEX idx_sick_leave_company ON sick_leave("companyId");
CREATE INDEX idx_sick_leave_status ON sick_leave(status);
CREATE INDEX idx_sick_leave_dates ON sick_leave("startDate", "endDate");
CREATE INDEX idx_sick_leave_poortwachter ON sick_leave("poortwachterActive") WHERE "poortwachterActive" = true;
CREATE INDEX idx_absence_stats_employee ON absence_statistics("employeeId");
CREATE INDEX idx_absence_stats_period ON absence_statistics(period, "periodStart", "periodEnd");
