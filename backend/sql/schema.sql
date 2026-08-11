-- =============================================
-- SCHEMA: tenisriverside (MySQL)
-- Convención: TODO en castellano (nadie dijo que debía ser inglés).
-- Valores ENUM en español: admin/profesor/alumno, principiante/intermedio/avanzado,
-- fija/extra/abierta, pendiente/aceptada/rechazada/lista_espera/cancelada, etc.
-- =============================================

-- Usuarios (profesoras, alumnos, admin)
CREATE TABLE IF NOT EXISTS perfiles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nombre_completo VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  rol ENUM('admin', 'profesor', 'alumno') NOT NULL DEFAULT 'alumno',
  nivel ENUM('principiante', 'intermedio', 'avanzado'),
  activo TINYINT(1) DEFAULT 1,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Plantillas de clases (fijas, abiertas, extras)
CREATE TABLE IF NOT EXISTS plantillas_clases (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  profesor_id BIGINT UNSIGNED NOT NULL,
  dia_semana TINYINT CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  nivel ENUM('principiante', 'intermedio', 'avanzado'),
  modalidad ENUM('fija', 'extra', 'abierta') NOT NULL,
  cupo_maximo INT NOT NULL DEFAULT 4,
  precio_por_clase DECIMAL(10,2) NOT NULL,
  frecuencia INT DEFAULT 1,
  inicio_mes INT DEFAULT 1,
  fin_mes INT DEFAULT 31,
  activa TINYINT(1) DEFAULT 1,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profesor_id) REFERENCES perfiles(id) ON DELETE CASCADE
);

-- Instancias de clases (generadas mensualmente desde las plantillas)
CREATE TABLE IF NOT EXISTS instancias_clases (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  plantilla_id BIGINT UNSIGNED NOT NULL,
  profesor_id BIGINT UNSIGNED NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  nivel ENUM('principiante', 'intermedio', 'avanzado') NOT NULL,
  modalidad ENUM('fija', 'extra', 'abierta') NOT NULL,
  cupo_maximo INT NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  estado ENUM('programada', 'completada', 'cancelada') DEFAULT 'programada',
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_plantilla_fecha (plantilla_id, fecha),
  FOREIGN KEY (plantilla_id) REFERENCES plantillas_clases(id) ON DELETE CASCADE,
  FOREIGN KEY (profesor_id) REFERENCES perfiles(id) ON DELETE CASCADE
);

-- Grupos (alumnos asignados a una misma franja de una instancia)
CREATE TABLE IF NOT EXISTS grupos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  instancia_id BIGINT UNSIGNED NOT NULL,
  nombre VARCHAR(100),
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (instancia_id) REFERENCES instancias_clases(id) ON DELETE CASCADE
);

-- Alumnos en grupos
CREATE TABLE IF NOT EXISTS grupo_alumnos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  grupo_id BIGINT UNSIGNED NOT NULL,
  alumno_id BIGINT UNSIGNED NOT NULL,
  inscripto_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_grupo_alumno (grupo_id, alumno_id),
  FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
  FOREIGN KEY (alumno_id) REFERENCES perfiles(id) ON DELETE CASCADE
);

-- Postulaciones de alumnos a clases (candidatos)
CREATE TABLE IF NOT EXISTS postulaciones (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  alumno_id BIGINT UNSIGNED NOT NULL,
  instancia_id BIGINT UNSIGNED NOT NULL,
  estado ENUM('pendiente', 'aceptada', 'rechazada', 'lista_espera', 'cancelada') DEFAULT 'pendiente',
  postulada_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  respondida_en DATETIME,
  UNIQUE KEY uk_alumno_instancia (alumno_id, instancia_id),
  FOREIGN KEY (alumno_id) REFERENCES perfiles(id) ON DELETE CASCADE,
  FOREIGN KEY (instancia_id) REFERENCES instancias_clases(id) ON DELETE CASCADE
);

-- Asistencia
CREATE TABLE IF NOT EXISTS asistencias (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  alumno_id BIGINT UNSIGNED NOT NULL,
  instancia_id BIGINT UNSIGNED NOT NULL,
  asistio TINYINT(1) NOT NULL DEFAULT 1,
  registrada_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_alumno_instancia_asist (alumno_id, instancia_id),
  FOREIGN KEY (alumno_id) REFERENCES perfiles(id) ON DELETE CASCADE,
  FOREIGN KEY (instancia_id) REFERENCES instancias_clases(id) ON DELETE CASCADE
);

-- Deudas
CREATE TABLE IF NOT EXISTS deudas (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  alumno_id BIGINT UNSIGNED NOT NULL,
  instancia_id BIGINT UNSIGNED,
  tipo_deuda ENUM('mensualidad', 'clase_extra', 'clase_abierta') NOT NULL,
  mes_facturacion VARCHAR(7),
  monto DECIMAL(10,2) NOT NULL,
  monto_pagado DECIMAL(10,2) DEFAULT 0,
  estado ENUM('pendiente', 'parcial', 'pagada', 'anulada') DEFAULT 'pendiente',
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (alumno_id) REFERENCES perfiles(id) ON DELETE CASCADE,
  FOREIGN KEY (instancia_id) REFERENCES instancias_clases(id) ON DELETE SET NULL
);

-- Pagos
CREATE TABLE IF NOT EXISTS pagos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  alumno_id BIGINT UNSIGNED NOT NULL,
  deuda_id BIGINT UNSIGNED,
  monto DECIMAL(10,2) NOT NULL,
  fecha_pago DATE NOT NULL,
  nota TEXT,
  registrado_por BIGINT UNSIGNED,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (alumno_id) REFERENCES perfiles(id) ON DELETE CASCADE,
  FOREIGN KEY (deuda_id) REFERENCES deudas(id) ON DELETE SET NULL,
  FOREIGN KEY (registrado_por) REFERENCES perfiles(id) ON DELETE SET NULL
);

-- Ciclos de facturación mensual
CREATE TABLE IF NOT EXISTS ciclos_facturacion (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  mes_anio VARCHAR(7) NOT NULL UNIQUE,
  estado ENUM('abierto', 'cerrado') DEFAULT 'abierto',
  abierto_en DATETIME,
  cerrado_en DATETIME,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ÍNDICES
-- =============================================

CREATE INDEX idx_instancias_fecha ON instancias_clases(fecha);
CREATE INDEX idx_instancias_profesor ON instancias_clases(profesor_id);
CREATE INDEX idx_grupo_alumnos_alumno ON grupo_alumnos(alumno_id);
CREATE INDEX idx_postulaciones_alumno ON postulaciones(alumno_id);
CREATE INDEX idx_postulaciones_instancia ON postulaciones(instancia_id);
CREATE INDEX idx_deudas_alumno ON deudas(alumno_id);
CREATE INDEX idx_deudas_mes ON deudas(mes_facturacion);
CREATE INDEX idx_pagos_alumno ON pagos(alumno_id);
CREATE INDEX idx_pagos_fecha ON pagos(fecha_pago);
