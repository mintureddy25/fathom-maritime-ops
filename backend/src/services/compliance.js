const { Op } = require('sequelize');
const { Ship, MaintenanceTask, Drill, DrillParticipation, User } = require('../models');

function pct(numerator, denominator) {
  if (!denominator) return 100;
  return Math.round((numerator / denominator) * 100);
}

function classify(score) {
  if (score >= 90) return 'compliant';
  if (score >= 70) return 'at_risk';
  return 'non_compliant';
}

async function shipCompliance(shipId, asOf = new Date()) {
  const ship = await Ship.findByPk(shipId);
  if (!ship) return null;

  const tasks = await MaintenanceTask.findAll({ where: { ship_id: shipId } });
  const drills = await Drill.findAll({ where: { ship_id: shipId } });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const overdueTasks = tasks.filter(t =>
    t.status !== 'completed' && new Date(t.due_date) < asOf
  );

  const elapsedDrills = drills.filter(d => new Date(d.scheduled_date) <= asOf);
  const completedDrills = elapsedDrills.filter(d => d.status === 'completed');
  const missedDrills = elapsedDrills.filter(d => d.status !== 'completed');

  const crewIds = (await User.findAll({ where: { ship_id: shipId, role: 'crew' }, attributes: ['id'] }))
    .map(u => u.id);
  let attendanceTotal = 0;
  let attendanceMarked = 0;
  for (const drill of completedDrills) {
    const parts = await DrillParticipation.findAll({ where: { drill_id: drill.id } });
    attendanceTotal += crewIds.length;
    attendanceMarked += parts.filter(p => p.attended).length;
  }

  const maintenancePct = pct(completedTasks, totalTasks);
  const drillPct = pct(completedDrills.length, elapsedDrills.length);
  const participationPct = pct(attendanceMarked, attendanceTotal);

  const overall = Math.round(
    (maintenancePct * 0.5) + (drillPct * 0.3) + (participationPct * 0.2)
  );

  return {
    ship: { id: ship.id, name: ship.name, imo_number: ship.imo_number, status: ship.status },
    metrics: {
      maintenance_pct: maintenancePct,
      drill_completion_pct: drillPct,
      participation_pct: participationPct,
      overall_score: overall,
      classification: classify(overall),
    },
    counts: {
      tasks_total: totalTasks,
      tasks_completed: completedTasks,
      tasks_pending: totalTasks - completedTasks,
      tasks_overdue: overdueTasks.length,
      drills_elapsed: elapsedDrills.length,
      drills_completed: completedDrills.length,
      drills_missed: missedDrills.length,
      drills_upcoming: drills.length - elapsedDrills.length,
    },
    overdue_tasks: overdueTasks.map(t => ({
      id: t.id, title: t.title, due_date: t.due_date, status: t.status, priority: t.priority,
    })),
    missed_drills: missedDrills.map(d => ({
      id: d.id, title: d.title, scheduled_date: d.scheduled_date, drill_type: d.drill_type,
    })),
  };
}

async function fleetOverview(asOf = new Date()) {
  const ships = await Ship.findAll();
  const perShip = await Promise.all(ships.map(s => shipCompliance(s.id, asOf)));

  const aggregate = (key) => perShip.reduce((acc, s) => acc + s.counts[key], 0);
  const fleet = {
    ships_total: ships.length,
    tasks_total: aggregate('tasks_total'),
    tasks_completed: aggregate('tasks_completed'),
    tasks_pending: aggregate('tasks_pending'),
    tasks_overdue: aggregate('tasks_overdue'),
    drills_elapsed: aggregate('drills_elapsed'),
    drills_completed: aggregate('drills_completed'),
    drills_missed: aggregate('drills_missed'),
    drills_upcoming: aggregate('drills_upcoming'),
  };

  const overallScore = perShip.length
    ? Math.round(perShip.reduce((acc, s) => acc + s.metrics.overall_score, 0) / perShip.length)
    : 100;

  return {
    fleet: { ...fleet, overall_score: overallScore, classification: classify(overallScore) },
    ships: perShip,
  };
}

async function autoMarkMissedDrills(asOf = new Date()) {
  const [count] = await Drill.update(
    { status: 'missed' },
    { where: { status: 'scheduled', scheduled_date: { [Op.lt]: asOf } } }
  );
  return count;
}

module.exports = { shipCompliance, fleetOverview, autoMarkMissedDrills };
