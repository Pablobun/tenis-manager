## Question

¿Cómo se diseña el **schema de base de datos** completo para el sistema?

## Type

task

## Mode

AFK

## Blocked by

01-tech-stack (resuelto), 04-debt-model (resuelto)

## Resolution

### Schema propuesto (PostgreSQL via Supabase)

```sql
-- =============================================
-- AUTH & USERS
-- =============================================

-- Supabase auth.users already exists
-- We add a profiles table linked to auth.users

CREATE TYPE user_role AS ENUM ('admin', 'professor', 'student');

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'student',
  level TEXT CHECK (level IN ('avanzado', 'intermedio', 'principiante')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- CLASSES & TEMPLATES
-- =============================================

CREATE TYPE class_modality AS ENUM ('fixed', 'extra', 'open');

CREATE TABLE class_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES profiles(id),
  day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Monday, 6=Sunday
  start_hour TIME NOT NULL,
  end_hour TIME NOT NULL,
  level TEXT CHECK (level IN ('avanzado', 'intermedio', 'principiante')),
  modality class_modality NOT NULL,
  max_students INT NOT NULL DEFAULT 4,
  price_per_class NUMERIC(10,2) NOT NULL,
  frequency INT DEFAULT 1, -- classes per week (for fixed)
  month_start INT DEFAULT 1, -- day range for billing
  month_end INT DEFAULT 31,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-generated instances for fixed classes
CREATE TABLE class_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES class_templates(id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES profiles(id),
  instance_date DATE NOT NULL,
  start_hour TIME NOT NULL,
  end_hour TIME NOT NULL,
  level TEXT NOT NULL,
  modality class_modality NOT NULL,
  max_students INT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(template_id, instance_date)
);

-- =============================================
-- GROUPS & ENROLLMENTS
-- =============================================

CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES class_instances(id) ON DELETE CASCADE,
  name TEXT, -- optional group name
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE group_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id),
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, student_id)
);

-- =============================================
-- APPLICATIONS (CANDIDATOS)
-- =============================================

CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected', 'waitlisted', 'cancelled');

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id),
  instance_id UUID NOT NULL REFERENCES class_instances(id),
  status application_status DEFAULT 'pending',
  applied_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE(student_id, instance_id)
);

-- =============================================
-- ATTENDANCE (for extras and open classes)
-- =============================================

CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id),
  instance_id UUID NOT NULL REFERENCES class_instances(id),
  attended BOOLEAN NOT NULL DEFAULT true,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, instance_id)
);

-- =============================================
-- DEBT & PAYMENTS
-- =============================================

CREATE TYPE debt_type AS ENUM ('fixed_monthly', 'extra_class', 'open_class');
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'paid', 'overridden');

CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id),
  instance_id UUID REFERENCES class_instances(id), -- NULL for fixed monthly
  debt_type debt_type NOT NULL,
  billing_month TEXT, -- e.g., '2026-07'
  amount NUMERIC(10,2) NOT NULL,
  paid_amount NUMERIC(10,2) DEFAULT 0,
  status payment_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id),
  debt_id UUID REFERENCES debts(id),
  amount NUMERIC(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  note TEXT,
  recorded_by UUID REFERENCES profiles(id), -- professor who recorded it
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- MONTHLY BILLING CYCLE
-- =============================================

CREATE TABLE billing_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_year TEXT NOT NULL UNIQUE, -- e.g., '2026-07'
  status TEXT DEFAULT 'open', -- open, closed
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_class_instances_date ON class_instances(instance_date);
CREATE INDEX idx_class_instances_professor ON class_instances(professor_id);
CREATE INDEX idx_group_students_student ON group_students(student_id);
CREATE INDEX idx_applications_student ON applications(student_id);
CREATE INDEX idx_applications_instance ON applications(instance_id);
CREATE INDEX idx_debts_student ON debts(student_id);
CREATE INDEX idx_debts_month ON debts(billing_month);
CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_cycles ENABLE ROW LEVEL SECURITY;

-- Students see only their own data
CREATE POLICY "Students view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Students view own group enrollments" ON group_students
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students view own applications" ON applications
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students view own debts" ON debts
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students view own payments" ON payments
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students view available instances" ON class_instances
  FOR SELECT USING (status = 'scheduled');

CREATE POLICY "Students apply to instances" ON applications
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students cancel own applications" ON applications
  FOR UPDATE USING (student_id = auth.uid())
  WITH CHECK (status = 'cancelled');

-- Professors see everything in their scope
CREATE POLICY "Professors view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'professor'))
  );

CREATE POLICY "Professors manage templates" ON class_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'professor'))
  );

CREATE POLICY "Professors manage instances" ON class_instances
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'professor'))
  );

CREATE POLICY "Professors manage groups" ON groups
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'professor'))
  );

CREATE POLICY "Professors manage enrollments" ON group_students
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'professor'))
  );

CREATE POLICY "Professors manage applications" ON applications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'professor'))
  );

CREATE POLICY "Professors manage attendance" ON attendance
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'professor'))
  );

CREATE POLICY "Professors manage debts" ON debts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'professor'))
  );

CREATE POLICY "Professors manage payments" ON payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'professor'))
  );

CREATE POLICY "Professors manage billing cycles" ON billing_cycles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'professor'))
  );
```

**Estado**: RESUELTO
