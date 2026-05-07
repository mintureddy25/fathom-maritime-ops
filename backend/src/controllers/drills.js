const { Op } = require('sequelize');
const { Drill, DrillParticipation, Ship, User } = require('../models');
const { HttpError, ok, created } = require('../utils/http');

const DRILL_INCLUDE = [
  { model: Ship, as: 'ship' },
  { model: User, as: 'creator', attributes: ['id', 'name'] },
  {
    model: DrillParticipation,
    as: 'participations',
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'rank'] }],
  },
];

function buildFilters(req) {
  const where = {};
  if (req.query.ship_id) where.ship_id = req.query.ship_id;
  if (req.query.status) where.status = req.query.status;
  if (req.query.from) where.scheduled_date = { ...(where.scheduled_date || {}), [Op.gte]: new Date(req.query.from) };
  if (req.query.to) where.scheduled_date = { ...(where.scheduled_date || {}), [Op.lte]: new Date(req.query.to) };
  if (req.query.upcoming === 'true') {
    where.scheduled_date = { [Op.gte]: new Date() };
    where.status = 'scheduled';
  }
  return where;
}

async function list(req, res) {
  const where = buildFilters(req);
  if (req.user.role === 'crew' && req.user.ship_id) {
    where.ship_id = req.user.ship_id;
  }
  const drills = await Drill.findAll({
    where,
    include: DRILL_INCLUDE,
    order: [['scheduled_date', 'ASC']],
  });
  ok(res, drills);
}

async function getOne(req, res) {
  const drill = await Drill.findByPk(req.params.id, { include: DRILL_INCLUDE });
  if (!drill) throw new HttpError(404, 'Drill not found');
  if (req.user.role === 'crew' && req.user.ship_id !== drill.ship_id) {
    throw new HttpError(403, 'Not your ship');
  }
  ok(res, drill);
}

async function create(req, res) {
  const { ship_id, title, drill_type, description, scheduled_date } = req.body || {};
  if (!ship_id || !title || !scheduled_date) throw new HttpError(400, 'ship_id, title, and scheduled_date are required');
  const drill = await Drill.create({
    ship_id, title,
    drill_type: drill_type || 'other',
    description,
    scheduled_date,
    created_by: req.user.id,
  });
  const full = await Drill.findByPk(drill.id, { include: DRILL_INCLUDE });
  created(res, full);
}

async function complete(req, res) {
  const drill = await Drill.findByPk(req.params.id);
  if (!drill) throw new HttpError(404, 'Drill not found');
  const { notes } = req.body || {};
  await drill.update({ status: 'completed', completed_at: new Date(), notes: notes || drill.notes });
  const full = await Drill.findByPk(drill.id, { include: DRILL_INCLUDE });
  ok(res, full);
}

async function markAttendance(req, res) {
  const drill = await Drill.findByPk(req.params.id);
  if (!drill) throw new HttpError(404, 'Drill not found');
  if (req.user.role === 'crew' && req.user.ship_id !== drill.ship_id) {
    throw new HttpError(403, 'Not your ship');
  }
  const { attended, remarks } = req.body || {};
  const [participation] = await DrillParticipation.upsert({
    drill_id: drill.id,
    user_id: req.user.id,
    attended: !!attended,
    remarks: remarks || null,
    submitted_at: new Date(),
  });
  const full = await DrillParticipation.findOne({
    where: { drill_id: drill.id, user_id: req.user.id },
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'rank'] }],
  });
  ok(res, full || participation);
}

async function remove(req, res) {
  const drill = await Drill.findByPk(req.params.id);
  if (!drill) throw new HttpError(404, 'Drill not found');
  await drill.destroy();
  ok(res, { ok: true });
}

module.exports = { list, getOne, create, complete, markAttendance, remove };
