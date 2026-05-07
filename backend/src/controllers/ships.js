const { Ship, User } = require('../models');
const { HttpError, ok, created } = require('../utils/http');

async function list(_req, res) {
  const ships = await Ship.findAll({ order: [['name', 'ASC']] });
  ok(res, ships);
}

async function getOne(req, res) {
  const ship = await Ship.findByPk(req.params.id, {
    include: [{ model: User, as: 'crew', attributes: ['id', 'name', 'rank', 'role', 'email'] }],
  });
  if (!ship) throw new HttpError(404, 'Ship not found');
  ok(res, ship);
}

async function create(req, res) {
  const { name, imo_number, type, flag, status } = req.body || {};
  if (!name || !imo_number) throw new HttpError(400, 'name and imo_number are required');
  const ship = await Ship.create({ name, imo_number, type, flag, status });
  created(res, ship);
}

async function update(req, res) {
  const ship = await Ship.findByPk(req.params.id);
  if (!ship) throw new HttpError(404, 'Ship not found');
  const { name, type, flag, status } = req.body || {};
  await ship.update({ name, type, flag, status });
  ok(res, ship);
}

module.exports = { list, getOne, create, update };
