-- =============================================
-- SEED DEMO: datos varios para probar el sistema (MySQL)
-- Convención: todo en castellano (ver schema.sql).
--
-- Contraseña común de todos los usuarios demo: demo123
--   (hash bcrypt rounds=10 del literal de abajo)
-- Emails con prefijo "demo." (ej. demo.ana@tenismanager.com) para
-- identificarlos/limpiarlos fácilmente después.
--
-- Escenarios cubiertos:
--   · 2 profesores + 12 alumnos
--   · Plantillas fijas (Lunes/Miércoles/Viernes) con sus instancias del MES ACTUAL
--   · Alumnos inscriptos en clase fija (Ana/Bruno en Lunes, Carla en Viernes, Diego en Miércoles)
--   · Deudas: pendiente (Ana), parcial (Bruno), pagada (Carla), atrasada mes anterior (Gabriela),
--     clase extra por asistencia (Javier)
--   · Sin deuda / sin clases (Elena, Facundo, Karina inactiva)
--   · Saldo a favor con pago huérfano (Facundo $15000, Lucía $5000)
--   · Clase abierta futura con postulaciones (pendiente ×2, aceptada, lista_espera)
--   · Clase extra pasada con asistencia (Javier asistió)
--   · Ciclos: mes anterior cerrado, mes actual abierto
--
-- IMPORTANTE: script SOLO de INSERT. Ejecutar sobre un estado limpio
-- (sin datos demo.* preexistentes). La limpieza posterior la hace el dueño.
-- =============================================

SET @hoy = CURDATE();
SET @mesActual = DATE_FORMAT(@hoy, '%Y-%m');
SET @mesAnterior = DATE_FORMAT(DATE_SUB(@hoy, INTERVAL 1 MONTH), '%Y-%m');
SET @primerDia = DATE_FORMAT(@hoy, '%Y-%m-01');
SET @pwd = '$2b$10$CEyEIZDLLxpkDY6MXDil0utBijlWaxMennyd.30fPQazHXYcMSXEW'; -- demo123

-- =============================================
-- 1) PROFESORES
-- =============================================
INSERT INTO perfiles (email, password_hash, nombre_completo, telefono, rol, activo)
VALUES ('demo.profe1@tenismanager.com', @pwd, 'Carolina Martínez', '3510000001', 'profesor', 1);
SET @profe1 = LAST_INSERT_ID();

INSERT INTO perfiles (email, password_hash, nombre_completo, telefono, rol, activo)
VALUES ('demo.profe2@tenismanager.com', @pwd, 'Sofía Rodríguez', '3510000002', 'profesor', 1);
SET @profe2 = LAST_INSERT_ID();

-- =============================================
-- 2) ALUMNOS (12 con escenarios distintos)
-- =============================================
INSERT INTO perfiles (email, password_hash, nombre_completo, telefono, rol, nivel, activo, saldo_a_favor) VALUES
('demo.ana@tenismanager.com',     @pwd, 'Ana García',     '3511000001', 'alumno', 'principiante', 1, 0),
('demo.bruno@tenismanager.com',    @pwd, 'Bruno Pérez',    '3511000002', 'alumno', 'intermedio',  1, 0),
('demo.carla@tenismanager.com',    @pwd, 'Carla Díaz',     '3511000003', 'alumno', 'avanzado',    1, 0),
('demo.diego@tenismanager.com',    @pwd, 'Diego Fernández','3511000004', 'alumno', 'principiante', 1, 0),
('demo.elena@tenismanager.com',    @pwd, 'Elena Ruiz',     '3511000005', 'alumno', 'intermedio',  1, 0),
('demo.facundo@tenismanager.com',  @pwd, 'Facundo Torres', '3511000006', 'alumno', 'avanzado',    1, 0),
('demo.gabriela@tenismanager.com', @pwd, 'Gabriela López', '3511000007', 'alumno', 'principiante', 1, 0),
('demo.hugo@tenismanager.com',     @pwd, 'Hugo Medina',    '3511000008', 'alumno', 'intermedio',  1, 0),
('demo.irene@tenismanager.com',    @pwd, 'Irene Castro',   '3511000009', 'alumno', 'avanzado',    1, 0),
('demo.javier@tenismanager.com',   @pwd, 'Javier Soto',    '3511000010', 'alumno', 'principiante', 1, 0),
('demo.karina@tenismanager.com',   @pwd, 'Karina Vega',    '3511000011', 'alumno', 'principiante', 0, 0),
('demo.lucia@tenismanager.com',    @pwd, 'Lucía Molina',   '3511000012', 'alumno', 'intermedio',  1, 0);

SET @ana      = (SELECT id FROM perfiles WHERE email = 'demo.ana@tenismanager.com');
SET @bruno    = (SELECT id FROM perfiles WHERE email = 'demo.bruno@tenismanager.com');
SET @carla    = (SELECT id FROM perfiles WHERE email = 'demo.carla@tenismanager.com');
SET @diego    = (SELECT id FROM perfiles WHERE email = 'demo.diego@tenismanager.com');
SET @elena    = (SELECT id FROM perfiles WHERE email = 'demo.elena@tenismanager.com');
SET @facundo  = (SELECT id FROM perfiles WHERE email = 'demo.facundo@tenismanager.com');
SET @gabriela = (SELECT id FROM perfiles WHERE email = 'demo.gabriela@tenismanager.com');
SET @hugo     = (SELECT id FROM perfiles WHERE email = 'demo.hugo@tenismanager.com');
SET @irene    = (SELECT id FROM perfiles WHERE email = 'demo.irene@tenismanager.com');
SET @javier   = (SELECT id FROM perfiles WHERE email = 'demo.javier@tenismanager.com');
SET @lucia    = (SELECT id FROM perfiles WHERE email = 'demo.lucia@tenismanager.com');

-- =============================================
-- 3) PLANTILLAS FIJAS
-- =============================================
INSERT INTO plantillas_clases (profesor_id, dia_semana, hora_inicio, hora_fin, nivel, modalidad, cupo_maximo, precio_por_clase, activa)
VALUES (@profe1, 0, '18:00:00', '19:00:00', 'intermedio', 'fija', 6, 6000.00, 1); -- Lunes
SET @tplLun = LAST_INSERT_ID();

INSERT INTO plantillas_clases (profesor_id, dia_semana, hora_inicio, hora_fin, nivel, modalidad, cupo_maximo, precio_por_clase, activa)
VALUES (@profe2, 2, '19:00:00', '20:00:00', 'principiante', 'fija', 6, 5000.00, 1); -- Miércoles
SET @tplMie = LAST_INSERT_ID();

INSERT INTO plantillas_clases (profesor_id, dia_semana, hora_inicio, hora_fin, nivel, modalidad, cupo_maximo, precio_por_clase, activa)
VALUES (@profe1, 4, '17:00:00', '18:00:00', 'avanzado', 'fija', 4, 8000.00, 1); -- Viernes
SET @tplVie = LAST_INSERT_ID();

-- =============================================
-- 4) INSTANCIAS DEL MES ACTUAL (una por cada día que cae en el mes, por plantilla)
-- =============================================
INSERT INTO instancias_clases (plantilla_id, profesor_id, fecha, hora_inicio, hora_fin, nivel, modalidad, cupo_maximo, precio, estado)
SELECT t.id, t.profesor_id, d.fecha, t.hora_inicio, t.hora_fin, t.nivel, t.modalidad, t.cupo_maximo, t.precio_por_clase, 'programada'
FROM plantillas_clases t
JOIN (
  SELECT DATE_ADD(@primerDia, INTERVAL (n - 1) DAY) AS fecha
  FROM (
    SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL
    SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL
    SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL
    SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL SELECT 16 UNION ALL
    SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20 UNION ALL
    SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24 UNION ALL
    SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28 UNION ALL
    SELECT 29 UNION ALL SELECT 30 UNION ALL SELECT 31
  ) nums
) d
WHERE t.id IN (@tplLun, @tplMie, @tplVie)
  AND MONTH(d.fecha) = MONTH(@hoy)
  AND ((DAYOFWEEK(d.fecha) + 5) % 7) = t.dia_semana;

-- =============================================
-- 5) GRUPOS (uno por instancia)
-- =============================================
INSERT INTO grupos (instancia_id, nombre)
SELECT id, 'Grupo Principal'
FROM instancias_clases
WHERE plantilla_id IN (@tplLun, @tplMie, @tplVie);

-- =============================================
-- 6) INSCRIPCIONES en clase fija
--   Ana + Bruno → todas las instancias del Lunes (intermedio, $6000)
--   Carla        → todas las instancias del Viernes (avanzado, $8000)
--   Diego        → todas las instancias del Miércoles (principiante, $5000)
-- =============================================
INSERT INTO grupo_alumnos (grupo_id, alumno_id)
SELECT g.id, @ana
FROM grupos g
JOIN instancias_clases i ON g.instancia_id = i.id
WHERE i.plantilla_id = @tplLun;

INSERT INTO grupo_alumnos (grupo_id, alumno_id)
SELECT g.id, @bruno
FROM grupos g
JOIN instancias_clases i ON g.instancia_id = i.id
WHERE i.plantilla_id = @tplLun;

INSERT INTO grupo_alumnos (grupo_id, alumno_id)
SELECT g.id, @carla
FROM grupos g
JOIN instancias_clases i ON g.instancia_id = i.id
WHERE i.plantilla_id = @tplVie;

INSERT INTO grupo_alumnos (grupo_id, alumno_id)
SELECT g.id, @diego
FROM grupos g
JOIN instancias_clases i ON g.instancia_id = i.id
WHERE i.plantilla_id = @tplMie;

-- =============================================
-- 7) CLASE ABIERTA FUTURA (plantilla inactiva de respaldo + instancia + grupo)
--    Postulaciones: Hugo pendiente · Elena pendiente · Lucía aceptada · Irene lista_espera
-- =============================================
SET @fechaAbierta = DATE_ADD(@hoy, INTERVAL 7 DAY);

INSERT INTO plantillas_clases (profesor_id, dia_semana, hora_inicio, hora_fin, nivel, modalidad, cupo_maximo, precio_por_clase, activa)
VALUES (@profe2, ((DAYOFWEEK(@fechaAbierta) + 5) % 7), '10:00:00', '11:00:00', 'intermedio', 'abierta', 4, 3000.00, 0);
SET @tplAbierta = LAST_INSERT_ID();

INSERT INTO instancias_clases (plantilla_id, profesor_id, fecha, hora_inicio, hora_fin, nivel, modalidad, cupo_maximo, precio, estado)
VALUES (@tplAbierta, @profe2, @fechaAbierta, '10:00:00', '11:00:00', 'intermedio', 'abierta', 4, 3000.00, 'programada');
SET @instAbierta = LAST_INSERT_ID();

INSERT INTO grupos (instancia_id, nombre) VALUES (@instAbierta, 'Grupo Abierto');
SET @grupoAbierta = LAST_INSERT_ID();

-- Lucía aceptada → ocupa cupo (inscripta en el grupo)
INSERT INTO grupo_alumnos (grupo_id, alumno_id) VALUES (@grupoAbierta, @lucia);

INSERT INTO postulaciones (alumno_id, instancia_id, estado, postulada_en, respondida_en) VALUES
(@hugo,  @instAbierta, 'pendiente',    NOW(), NULL),
(@elena, @instAbierta, 'pendiente',    NOW(), NULL),
(@lucia, @instAbierta, 'aceptada',     NOW(), NOW()),
(@irene, @instAbierta, 'lista_espera', NOW(), NOW());

-- =============================================
-- 8) CLASE EXTRA PASADA (plantilla inactiva de respaldo + instancia + grupo)
--    Javier asistió → genera deuda clase_extra
-- =============================================
SET @fechaExtra = DATE_SUB(@hoy, INTERVAL 3 DAY);

INSERT INTO plantillas_clases (profesor_id, dia_semana, hora_inicio, hora_fin, nivel, modalidad, cupo_maximo, precio_por_clase, activa)
VALUES (@profe1, ((DAYOFWEEK(@fechaExtra) + 5) % 7), '16:00:00', '17:00:00', 'principiante', 'extra', 6, 2500.00, 0);
SET @tplExtra = LAST_INSERT_ID();

INSERT INTO instancias_clases (plantilla_id, profesor_id, fecha, hora_inicio, hora_fin, nivel, modalidad, cupo_maximo, precio, estado)
VALUES (@tplExtra, @profe1, @fechaExtra, '16:00:00', '17:00:00', 'principiante', 'extra', 6, 2500.00, 'completada');
SET @instExtra = LAST_INSERT_ID();

INSERT INTO grupos (instancia_id, nombre) VALUES (@instExtra, 'Grupo Extra');

INSERT INTO asistencias (alumno_id, instancia_id, asistio)
VALUES (@javier, @instExtra, 1);

-- =============================================
-- 9) DEUDAS
--    Mensualidad mes actual (patrón billing.generate, sin instancia):
--      Ana pendiente · Bruno parcial (pagó $10000) · Carla pagada
--    Mensualidad mes anterior pendiente: Gabriela (deudora)
--    Clase extra por asistencia: Javier (con instancia)
-- =============================================
INSERT INTO deudas (alumno_id, tipo_deuda, mes_facturacion, monto, monto_pagado, estado)
SELECT @ana, 'mensualidad', @mesActual,
       (SELECT COUNT(*) FROM instancias_clases WHERE plantilla_id = @tplLun) * 6000.00,
       0, 'pendiente';
SET @deudaAna = LAST_INSERT_ID();

INSERT INTO deudas (alumno_id, tipo_deuda, mes_facturacion, monto, monto_pagado, estado)
SELECT @bruno, 'mensualidad', @mesActual,
       (SELECT COUNT(*) FROM instancias_clases WHERE plantilla_id = @tplLun) * 6000.00,
       10000.00, 'parcial';
SET @deudaBruno = LAST_INSERT_ID();

INSERT INTO deudas (alumno_id, tipo_deuda, mes_facturacion, monto, monto_pagado, estado)
SELECT @carla, 'mensualidad', @mesActual,
       (SELECT COUNT(*) FROM instancias_clases WHERE plantilla_id = @tplVie) * 8000.00,
       (SELECT COUNT(*) FROM instancias_clases WHERE plantilla_id = @tplVie) * 8000.00,
       'pagada';
SET @deudaCarla = LAST_INSERT_ID();

INSERT INTO deudas (alumno_id, tipo_deuda, mes_facturacion, monto, monto_pagado, estado)
VALUES (@gabriela, 'mensualidad', @mesAnterior, 24000.00, 0, 'pendiente');

INSERT INTO deudas (alumno_id, instancia_id, tipo_deuda, mes_facturacion, monto, monto_pagado, estado)
VALUES (@javier, @instExtra, 'clase_extra', @mesActual, 2500.00, 0, 'pendiente');

-- =============================================
-- 10) PAGOS
--     Bruno: pago parcial a su deuda · Carla: pago completo
--     Facundo y Lucía: pago huérfano (deuda_id NULL) → saldo a favor
-- =============================================
INSERT INTO pagos (alumno_id, deuda_id, monto, fecha_pago, nota, registrado_por) VALUES
(@bruno, @deudaBruno, 10000.00, DATE_SUB(@hoy, INTERVAL 5 DAY), 'Pago parcial (demo)', @profe1),
(@carla, @deudaCarla, (SELECT monto FROM deudas WHERE id = @deudaCarla), DATE_SUB(@hoy, INTERVAL 3 DAY), 'Pago completo (demo)', @profe1),
(@facundo, NULL, 15000.00, DATE_SUB(@hoy, INTERVAL 6 DAY), 'Excedente → saldo a favor (demo)', @profe1),
(@lucia, NULL, 5000.00, DATE_SUB(@hoy, INTERVAL 4 DAY), 'Excedente → saldo a favor (demo)', @profe1);

UPDATE perfiles SET saldo_a_favor = saldo_a_favor + 15000.00 WHERE id = @facundo;
UPDATE perfiles SET saldo_a_favor = saldo_a_favor + 5000.00  WHERE id = @lucia;

-- =============================================
-- 11) CICLOS DE FACTURACIÓN
--     Mes anterior cerrado · mes actual abierto
-- =============================================
INSERT INTO ciclos_facturacion (mes_anio, estado, abierto_en, cerrado_en)
VALUES (@mesAnterior, 'cerrado', DATE_SUB(@hoy, INTERVAL 1 MONTH), @hoy);

INSERT INTO ciclos_facturacion (mes_anio, estado, abierto_en)
VALUES (@mesActual, 'abierto', NOW());