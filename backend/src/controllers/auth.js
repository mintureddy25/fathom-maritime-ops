const bcrypt = require('bcryptjs');
const { User, Ship } = require('../models');
const { signToken } = require('../utils/jwt');
const { HttpError, ok } = require('../utils/http');

async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) throw new HttpError(400, 'Email and password are required');

  const user = await User.findOne({ where: { email }, include: [{ model: Ship, as: 'ship' }] });
  if (!user || !user.is_active) throw new HttpError(401, 'Invalid credentials');

  const matches = await bcrypt.compare(password, user.password_hash);
  if (!matches) throw new HttpError(401, 'Invalid credentials');

  const token = signToken({ id: user.id, role: user.role });
  ok(res, { token, user: user.toSafeJSON() });
}

async function me(req, res) {
  const fresh = await User.findByPk(req.user.id, { include: [{ model: Ship, as: 'ship' }] });
  ok(res, fresh.toSafeJSON());
}

module.exports = { login, me };
