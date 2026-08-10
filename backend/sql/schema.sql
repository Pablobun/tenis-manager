-- =============================================
-- SCHEMA: tenisriverside (MySQL)
-- =============================================

-- Profiles (usuarios)
CREATE TABLE IF NOT EXISTS profiles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('admin', 'professor', 'student') NOT NULL DEFAULT 'student',
  level ENUM('avanzado', 'intermedio', 'principiante'),
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Plantillas de clases (fijas, abiertas, extras)
CREATE TABLE IF NOT EXISTS class_templates (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  professor_id BIGINT UNSIGNED NOT NULL,
  day_of_week TINYINT CHECK (day_of_week BETWEEN 0 AND 6),
  start_hour TIME NOT NULL,
  end_hour TIME NOT NULL,
  level ENUM('avanzado', 'intermedio', 'principiante'),
  modality ENUM('fixed', 'extra', 'open') NOT NULL,
  max_students INT NOT NULL DEFAULT 4,
  price_per_class DECIMAL(10,2) NOT NULL,
  frequency INT DEFAULT 1,
  month_start INT DEFAULT 1,
  month_end INT DEFAULT 31,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (professor_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Instancias de clases (generadas mensualmente)
CREATE TABLE IF NOT EXISTS class_instances (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  template_id BIGINT UNSIGNED NOT NULL,
  professor_id BIGINT UNSIGNED NOT NULL,
  instance_date DATE NOT NULL,
  start_hour TIME NOT NULL,
  end_hour TIME NOT NULL,
  level VARCHAR(50) NOT NULL,
  modality ENUM('fixed', 'extra', 'open') NOT NULL,
  max_students INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_template_date (template_id, instance_date),
  FOREIGN KEY (template_id) REFERENCES class_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (professor_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Grupos
CREATE TABLE IF NOT EXISTS groups (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  instance_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (instance_id) REFERENCES class_instances(id) ON DELETE CASCADE
);

-- Alumnos en grupos
CREATE TABLE IF NOT EXISTS group_students (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_group_student (group_id, student_id),
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Postulaciones de alumnos
CREATE TABLE IF NOT EXISTS applications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  instance_id BIGINT UNSIGNED NOT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'waitlisted', 'cancelled') DEFAULT 'pending',
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME,
  UNIQUE KEY uk_student_instance (student_id, instance_id),
  FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (instance_id) REFERENCES class_instances(id) ON DELETE CASCADE
);

-- Asistencia
CREATE TABLE IF NOT EXISTS attendance (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  instance_id BIGINT UNSIGNED NOT NULL,
  attended TINYINT(1) NOT NULL DEFAULT 1,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_student_instance_att (student_id, instance_id),
  FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (instance_id) REFERENCES class_instances(id) ON DELETE CASCADE
);

-- Deudas
CREATE TABLE IF NOT EXISTS debts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  instance_id BIGINT UNSIGNED,
  debt_type ENUM('fixed_monthly', 'extra_class', 'open_class') NOT NULL,
  billing_month VARCHAR(7),
  amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  status ENUM('pending', 'partial', 'paid', 'overridden') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (instance_id) REFERENCES class_instances(id) ON DELETE SET NULL
);

-- Pagos
CREATE TABLE IF NOT EXISTS payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  debt_id BIGINT UNSIGNED,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  note TEXT,
  recorded_by BIGINT UNSIGNED,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE SET NULL,
  FOREIGN KEY (recorded_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Ciclos de facturacion mensual
CREATE TABLE IF NOT EXISTS billing_cycles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  month_year VARCHAR(7) NOT NULL UNIQUE,
  status ENUM('open', 'closed') DEFAULT 'open',
  opened_at DATETIME,
  closed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
