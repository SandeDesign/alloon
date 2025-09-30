/*
  # Expense Management Tables

  1. New Tables
    - `expenses`: Stores all expense declarations
      - `id` (uuid, primary key)
      - `userId` (text): Firebase user ID who owns this record
      - `employeeId` (text): Reference to employee
      - `companyId` (text): Reference to company
      - `type` (text): Type of expense
      - `date` (timestamptz): Expense date
      - `amount` (numeric): Expense amount
      - `currency` (text): Currency code
      - `vatAmount` (numeric): VAT amount
      - `vatPercentage` (numeric): VAT percentage
      - `description` (text): Expense description
      - `travelDetails` (jsonb): Travel-specific details
      - `receipts` (jsonb): Array of receipt images (base64)
      - `project` (text): Project reference
      - `costCenter` (text): Cost center
      - `status` (text): Current status
      - `submittedAt` (timestamptz): Submission timestamp
      - `approvals` (jsonb): Approval chain
      - `paidInPayroll` (jsonb): Payroll payment details
      - `taxable` (boolean): Is taxable
      - `withinTaxFreeAllowance` (boolean): Within tax-free allowance
      - `createdAt` (timestamptz): Record creation time
      - `updatedAt` (timestamptz): Last update time

  2. Security
    - Enable RLS on expenses table
    - Employees can view and create their own expenses
    - Managers can view all company expenses
    - Only managers can approve/reject expenses
*/

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" text NOT NULL,
  "employeeId" text NOT NULL,
  "companyId" text NOT NULL,

  type text NOT NULL CHECK (type IN ('travel', 'meal', 'accommodation', 'phone', 'office', 'training', 'representation', 'other')),

  date timestamptz NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  "vatAmount" numeric,
  "vatPercentage" numeric,

  description text NOT NULL,

  "travelDetails" jsonb,
  receipts jsonb DEFAULT '[]'::jsonb,

  project text,
  "costCenter" text,

  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'paid')),

  "submittedAt" timestamptz,

  approvals jsonb DEFAULT '[]'::jsonb,

  "paidInPayroll" jsonb,

  taxable boolean DEFAULT false,
  "withinTaxFreeAllowance" boolean DEFAULT true,

  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view own expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (auth.uid() = "userId" OR "employeeId" IN (
    SELECT id FROM employees WHERE "userId" = auth.uid()
  ));

CREATE POLICY "Employees can create own expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Employees can update own draft expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = "userId" AND status = 'draft');

CREATE POLICY "Managers can view all company expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (auth.uid() = "userId");

CREATE POLICY "Managers can approve expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = "userId");

CREATE INDEX idx_expenses_employee ON expenses("employeeId");
CREATE INDEX idx_expenses_company ON expenses("companyId");
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_type ON expenses(type);
CREATE INDEX idx_expenses_submitted ON expenses("submittedAt") WHERE "submittedAt" IS NOT NULL;
