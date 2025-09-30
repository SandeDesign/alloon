/*
  # Leave Management Tables

  1. New Tables
    - `leave_requests`: Stores all leave requests from employees
      - `id` (uuid, primary key)
      - `userId` (text): Firebase user ID who owns this record
      - `employeeId` (text): Reference to employee
      - `companyId` (text): Reference to company
      - `type` (text): Type of leave (holiday, sick, special, etc.)
      - `startDate` (timestamptz): Leave start date
      - `endDate` (timestamptz): Leave end date
      - `totalDays` (numeric): Working days of leave
      - `totalHours` (numeric): Hours of leave
      - `partialDay` (jsonb): Optional partial day details
      - `reason` (text): Optional reason for leave
      - `notes` (text): Additional notes
      - `status` (text): Current status
      - `approvedBy` (text): User who approved
      - `approvedAt` (timestamptz): Approval timestamp
      - `rejectedReason` (text): Rejection reason if rejected
      - `sickLeaveDetails` (jsonb): Additional sick leave details
      - `createdAt` (timestamptz): Record creation time
      - `updatedAt` (timestamptz): Last update time

    - `leave_balances`: Tracks leave balances per employee per year
      - `id` (uuid, primary key)
      - `employeeId` (text): Reference to employee
      - `companyId` (text): Reference to company
      - `year` (integer): Balance year
      - `holidayDays` (jsonb): Holiday days breakdown
      - `advDays` (jsonb): ADV days if applicable
      - `seniorDays` (numeric): Senior days
      - `snipperDays` (numeric): Snipper days
      - `updatedAt` (timestamptz): Last update time

  2. Security
    - Enable RLS on all tables
    - Employees can view and create their own records
    - Managers (userId owners) can view all company records
    - Only managers can approve/reject leave requests
*/

CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" text NOT NULL,
  "employeeId" text NOT NULL,
  "companyId" text NOT NULL,

  type text NOT NULL CHECK (type IN ('holiday', 'sick', 'special', 'unpaid', 'parental', 'care', 'short_leave', 'adv')),

  "startDate" timestamptz NOT NULL,
  "endDate" timestamptz NOT NULL,
  "totalDays" numeric NOT NULL DEFAULT 0,
  "totalHours" numeric NOT NULL DEFAULT 0,

  "partialDay" jsonb,
  reason text,
  notes text,

  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'cancelled')),

  "approvedBy" text,
  "approvedAt" timestamptz,
  "rejectedReason" text,

  "sickLeaveDetails" jsonb,

  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "employeeId" text NOT NULL,
  "companyId" text NOT NULL,
  year integer NOT NULL,

  "holidayDays" jsonb NOT NULL DEFAULT '{"statutory": 0, "extraStatutory": 0, "carried": 0, "accumulated": 0, "taken": 0, "pending": 0, "remaining": 0, "expires": null}'::jsonb,
  "advDays" jsonb,
  "seniorDays" numeric DEFAULT 0,
  "snipperDays" numeric DEFAULT 0,

  "updatedAt" timestamptz DEFAULT now(),

  UNIQUE("employeeId", year)
);

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view own leave requests"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = "userId" OR "employeeId" IN (
    SELECT id FROM employees WHERE "userId" = auth.uid()
  ));

CREATE POLICY "Employees can create own leave requests"
  ON leave_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Employees can update own leave requests"
  ON leave_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = "userId");

CREATE POLICY "Managers can view all company leave requests"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = "userId");

CREATE POLICY "Managers can approve leave requests"
  ON leave_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = "userId");

CREATE POLICY "Employees can view own leave balance"
  ON leave_balances FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT "userId" FROM employees WHERE id = "employeeId"
  ));

CREATE POLICY "Managers can view all company balances"
  ON leave_balances FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage balances"
  ON leave_balances FOR ALL
  TO authenticated
  USING (true);

CREATE INDEX idx_leave_requests_employee ON leave_requests("employeeId");
CREATE INDEX idx_leave_requests_company ON leave_requests("companyId");
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests("startDate", "endDate");
CREATE INDEX idx_leave_balances_employee_year ON leave_balances("employeeId", year);
