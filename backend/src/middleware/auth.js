const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'ts_riverside_2026_secret';

function authenticateToken(req, res, next) {
  let token = req.cookies && req.cookies.token;
  
  if (!token && req.headers['authorization']) {
    const authHeader = req.headers['authorization'];
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  jwt.verify(token, SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.user = user;
    next();
  });
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles
};
