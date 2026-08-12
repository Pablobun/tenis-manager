const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function seedAdmin() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'tenisriverside'
  });

  try {
    const email = 'admin@tenismanager.com';
    const password = 'admin123';
    const nombre_completo = 'Administrador Riverside';
    const rol = 'admin';

    const [existing] = await connection.query('SELECT id FROM perfiles WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.log('El superusuario admin ya existe.');
      return;
    }

    const hashed = await bcrypt.hash(password, 10);

    await connection.query(
      'INSERT INTO perfiles (email, password_hash, nombre_completo, rol, activo) VALUES (?, ?, ?, ?, 1)',
      [email, hashed, nombre_completo, rol]
    );

    console.log(`Superusuario creado exitosamente:\nEmail: ${email}\nContraseña: ${password}`);
  } catch (err) {
    console.error('Error creando superusuario:', err);
  } finally {
    await connection.end();
  }
}

seedAdmin();
