const { verifyToken } = require('../utils/jwt');
const { HttpError } = require('../utils/http');
const { User } = require('../models');

async function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Missing auth token');

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }

  const user = await User.findByPk(payload.id);
  if (!user || !user.is_active) throw new HttpError(401, 'User not found or inactive');

  req.user = user;
  next();
}

function requireRole(...allowed) {
  return (req, _res, next) => {
    if (!req.user) throw new HttpError(401, 'Auth required');
    if (!allowed.includes(req.user.role)) throw new HttpError(403, 'Forbidden');
    next();
  };
}

module.exports = { requireAuth, requireRole };
