const { Op } = require('sequelize');
const { MaintenanceTask, Drill, DrillParticipation, Ship } = require('../models');
const { fleetOverview, shipCompliance, autoMarkMissedDrills } = require('../services/compliance');
const { ok, HttpError } = require('../utils/http');

async function adminOverview(_req, res) {
  await autoMarkMissedDrills();
  const data = await fleetOverview();
  ok(res, data);
}

async function shipOverview(req, res) {
  await autoMarkMissedDrills();
  const data = await shipCompliance(req.params.id);
  if (!data) throw new HttpError(404, 'Ship not found');
  ok(res, data);
}

async function crewOverview(req, res) {
  const userId = req.user.id;
  const shipId = req.user.ship_id;
  const now = new Date();

  const myTasks = await MaintenanceTask.findAll({
    where: { assigned_to: userId },
    include: [{ model: Ship, as: 'ship' }],
    order: [['due_date', 'ASC']],
  });

  const upcomingDrills = shipId ? await Drill.findAll({
    where: {
      ship_id: shipId,
      status: 'scheduled',
      scheduled_date: { [Op.gte]: now },
    },
    order: [['scheduled_date', 'ASC']],
    limit: 10,
  }) : [];

  const myParticipations = await DrillParticipation.findAll({
    where: { user_id: userId },
    include: [{ model: Drill, as: 'drill', include: [{ model: Ship, as: 'ship' }] }],
    order: [['submitted_at', 'DESC']],
    limit: 20,
  });

  ok(res, {
    summary: {
      tasks_total: myTasks.length,
      tasks_completed: myTasks.filter(t => t.status === 'completed').length,
      tasks_in_progress: myTasks.filter(t => t.status === 'in_progress').length,
      tasks_pending: myTasks.filter(t => t.status === 'pending').length,
      tasks_overdue: myTasks.filter(t => t.status !== 'completed' && new Date(t.due_date) < now).length,
      drills_upcoming: upcomingDrills.length,
      drills_attended: myParticipations.filter(p => p.attended).length,
    },
    tasks: myTasks,
    upcoming_drills: upcomingDrills,
    recent_participations: myParticipations,
  });
}

module.exports = { adminOverview, shipOverview, crewOverview };
