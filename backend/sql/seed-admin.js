const bcrypt = require('bcrypt');
const pool = require('../src/db');

async function createAdmin() {
  const email = 'admin@tenismanager.com';
  const password = 'admin123';
  const full_name = 'Administrador';

  try {
    const password_hash = await bcrypt.hash(password, 10);

    await pool.execute(
      'INSERT INTO profiles (email, password_hash, full_name, role) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE email = email',
      [email, password_hash, full_name, 'admin']
    );

    console.log(`Admin creado: ${email} / ${password}`);
    console.log('IMPORTANTE: Cambiar la contraseña después del primer login');
  } catch (error) {
    console.error('Error al crear admin:', error);
  } finally {
    await pool.end();
  }
}

createAdmin();
