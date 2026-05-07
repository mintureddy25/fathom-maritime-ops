const { Op } = require('sequelize');
const { MaintenanceTask, TaskComment, Ship, User } = require('../models');
const { HttpError, ok, created } = require('../utils/http');

const TASK_INCLUDE = [
  { model: Ship, as: 'ship' },
  { model: User, as: 'assignee', attributes: ['id', 'name', 'rank', 'email'] },
  { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
];

function buildFilters(req) {
  const where = {};
  if (req.query.ship_id) where.ship_id = req.query.ship_id;
  if (req.query.status) where.status = req.query.status;
  if (req.query.assigned_to) where.assigned_to = req.query.assigned_to;
  if (req.query.due_before) where.due_date = { ...(where.due_date || {}), [Op.lte]: req.query.due_before };
  if (req.query.due_after) where.due_date = { ...(where.due_date || {}), [Op.gte]: req.query.due_after };
  if (req.query.overdue === 'true') {
    where.due_date = { [Op.lt]: new Date() };
    where.status = { [Op.ne]: 'completed' };
  }
  return where;
}

async function list(req, res) {
  const where = buildFilters(req);
  if (req.user.role === 'crew') where.assigned_to = req.user.id;
  const tasks = await MaintenanceTask.findAll({
    where,
    include: TASK_INCLUDE,
    order: [['due_date', 'ASC']],
  });
  ok(res, tasks);
}

async function getOne(req, res) {
  const task = await MaintenanceTask.findByPk(req.params.id, {
    include: [
      ...TASK_INCLUDE,
      {
        model: TaskComment,
        as: 'comments',
        include: [{ model: User, as: 'author', attributes: ['id', 'name', 'role'] }],
      },
    ],
    order: [[{ model: TaskComment, as: 'comments' }, 'created_at', 'ASC']],
  });
  if (!task) throw new HttpError(404, 'Task not found');
  if (req.user.role === 'crew' && task.assigned_to !== req.user.id) {
    throw new HttpError(403, 'Not your task');
  }
  ok(res, task);
}

async function create(req, res) {
  const { ship_id, title, description, category, priority, due_date, assigned_to } = req.body || {};
  if (!ship_id || !title || !due_date) throw new HttpError(400, 'ship_id, title, and due_date are required');
  const task = await MaintenanceTask.create({
    ship_id, title, description, category,
    priority: priority || 'medium',
    due_date,
    assigned_to: assigned_to || null,
    created_by: req.user.id,
  });
  const full = await MaintenanceTask.findByPk(task.id, { include: TASK_INCLUDE });
  created(res, full);
}

async function update(req, res) {
  const task = await MaintenanceTask.findByPk(req.params.id);
  if (!task) throw new HttpError(404, 'Task not found');
  const { title, description, category, priority, due_date, assigned_to } = req.body || {};
  await task.update({ title, description, category, priority, due_date, assigned_to });
  const full = await MaintenanceTask.findByPk(task.id, { include: TASK_INCLUDE });
  ok(res, full);
}

async function updateStatus(req, res) {
  const task = await MaintenanceTask.findByPk(req.params.id);
  if (!task) throw new HttpError(404, 'Task not found');
  if (req.user.role === 'crew' && task.assigned_to !== req.user.id) {
    throw new HttpError(403, 'Not your task');
  }
  const { status } = req.body || {};
  if (!['pending', 'in_progress', 'completed'].includes(status)) {
    throw new HttpError(400, 'Invalid status');
  }
  const update = { status };
  update.completed_at = status === 'completed' ? new Date() : null;
  await task.update(update);
  const full = await MaintenanceTask.findByPk(task.id, { include: TASK_INCLUDE });
  ok(res, full);
}

async function addComment(req, res) {
  const task = await MaintenanceTask.findByPk(req.params.id);
  if (!task) throw new HttpError(404, 'Task not found');
  if (req.user.role === 'crew' && task.assigned_to !== req.user.id) {
    throw new HttpError(403, 'Not your task');
  }
  const { body } = req.body || {};
  if (!body || !body.trim()) throw new HttpError(400, 'Comment body is required');
  const comment = await TaskComment.create({ task_id: task.id, user_id: req.user.id, body: body.trim() });
  const full = await TaskComment.findByPk(comment.id, {
    include: [{ model: User, as: 'author', attributes: ['id', 'name', 'role'] }],
  });
  created(res, full);
}

async function remove(req, res) {
  const task = await MaintenanceTask.findByPk(req.params.id);
  if (!task) throw new HttpError(404, 'Task not found');
  await task.destroy();
  ok(res, { ok: true });
}

module.exports = { list, getOne, create, update, updateStatus, addComment, remove };
