const bcrypt = require('bcryptjs');
const { User, Ship } = require('../models');
const { HttpError, ok, created } = require('../utils/http');

async function list(req, res) {
  const where = {};
  if (req.query.role) where.role = req.query.role;
  if (req.query.ship_id) where.ship_id = req.query.ship_id;
  const users = await User.findAll({
    where,
    include: [{ model: Ship, as: 'ship' }],
    order: [['name', 'ASC']],
  });
  ok(res, users.map(u => u.toSafeJSON()));
}

async function getOne(req, res) {
  const user = await User.findByPk(req.params.id, { include: [{ model: Ship, as: 'ship' }] });
  if (!user) throw new HttpError(404, 'User not found');
  ok(res, user.toSafeJSON());
}

async function create(req, res) {
  const { name, email, password, role, rank, ship_id } = req.body || {};
  if (!name || !email || !password) throw new HttpError(400, 'name, email and password are required');
  const password_hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password_hash, role: role || 'crew', rank, ship_id });
  created(res, user.toSafeJSON());
}

async function update(req, res) {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new HttpError(404, 'User not found');
  const { name, role, rank, ship_id, is_active } = req.body || {};
  await user.update({ name, role, rank, ship_id, is_active });
  ok(res, user.toSafeJSON());
}

module.exports = { list, getOne, create, update };
