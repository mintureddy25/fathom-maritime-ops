'use strict';

const bcrypt = require('bcryptjs');

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function dateOnly(n) {
  return daysFromNow(n).toISOString().slice(0, 10);
}

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const hash = (pwd) => bcrypt.hashSync(pwd, 10);

    await queryInterface.bulkInsert('ships', [
      { name: 'MV Aurora', imo_number: 'IMO9011001', type: 'Container', flag: 'India', status: 'active', created_at: now, updated_at: now },
      { name: 'MV Trident', imo_number: 'IMO9011002', type: 'Bulk Carrier', flag: 'Singapore', status: 'active', created_at: now, updated_at: now },
      { name: 'MV Polaris', imo_number: 'IMO9011003', type: 'Tanker', flag: 'Panama', status: 'docked', created_at: now, updated_at: now },
    ]);

    await queryInterface.bulkInsert('users', [
      { name: 'Operations Admin', email: 'admin@fathom.io', password_hash: hash('admin123'), role: 'admin', rank: 'Fleet Manager', ship_id: null, is_active: true, created_at: now, updated_at: now },
      { name: 'Captain Rao', email: 'rao@fathom.io', password_hash: hash('crew123'), role: 'crew', rank: 'Master', ship_id: 1, is_active: true, created_at: now, updated_at: now },
      { name: 'Chief Eng. Khan', email: 'khan@fathom.io', password_hash: hash('crew123'), role: 'crew', rank: 'Chief Engineer', ship_id: 1, is_active: true, created_at: now, updated_at: now },
      { name: 'Officer Mehta', email: 'mehta@fathom.io', password_hash: hash('crew123'), role: 'crew', rank: 'Second Officer', ship_id: 1, is_active: true, created_at: now, updated_at: now },
      { name: 'Captain Iyer', email: 'iyer@fathom.io', password_hash: hash('crew123'), role: 'crew', rank: 'Master', ship_id: 2, is_active: true, created_at: now, updated_at: now },
      { name: 'Bosun DSilva', email: 'dsilva@fathom.io', password_hash: hash('crew123'), role: 'crew', rank: 'Bosun', ship_id: 2, is_active: true, created_at: now, updated_at: now },
      { name: 'Officer Patel', email: 'patel@fathom.io', password_hash: hash('crew123'), role: 'crew', rank: 'Third Officer', ship_id: 3, is_active: true, created_at: now, updated_at: now },
    ]);

    const tasks = [
      { ship_id: 1, title: 'Main engine oil change', category: 'Engine Room', priority: 'high', due_date: dateOnly(-10), status: 'completed', assigned_to: 3, completed_at: daysFromNow(-9) },
      { ship_id: 1, title: 'Lifeboat hoist inspection', category: 'Safety', priority: 'critical', due_date: dateOnly(-3), status: 'pending', assigned_to: 2, completed_at: null },
      { ship_id: 1, title: 'Hull integrity scan', category: 'Hull', priority: 'medium', due_date: dateOnly(5), status: 'in_progress', assigned_to: 4, completed_at: null },
      { ship_id: 1, title: 'Navigation system firmware update', category: 'Navigation', priority: 'medium', due_date: dateOnly(12), status: 'pending', assigned_to: 2, completed_at: null },
      { ship_id: 2, title: 'Cargo hold ventilation check', category: 'Cargo', priority: 'medium', due_date: dateOnly(-7), status: 'completed', assigned_to: 6, completed_at: daysFromNow(-7) },
      { ship_id: 2, title: 'Fire detection sensor calibration', category: 'Safety', priority: 'high', due_date: dateOnly(-2), status: 'in_progress', assigned_to: 6, completed_at: null },
      { ship_id: 2, title: 'Bilge pump service', category: 'Engine Room', priority: 'high', due_date: dateOnly(8), status: 'pending', assigned_to: 5, completed_at: null },
      { ship_id: 3, title: 'Tank cleaning schedule', category: 'Cargo', priority: 'critical', due_date: dateOnly(-4), status: 'pending', assigned_to: 7, completed_at: null },
      { ship_id: 3, title: 'Radar antenna alignment', category: 'Navigation', priority: 'low', due_date: dateOnly(20), status: 'pending', assigned_to: 7, completed_at: null },
    ].map(t => ({ ...t, description: `${t.title} as part of routine maintenance`, created_by: 1, created_at: now, updated_at: now }));

    await queryInterface.bulkInsert('maintenance_tasks', tasks);

    const drills = [
      { ship_id: 1, title: 'Monthly fire drill', drill_type: 'fire', scheduled_date: daysFromNow(-15), status: 'completed', completed_at: daysFromNow(-15), notes: 'Completed within 6 minutes; all crew responded.' },
      { ship_id: 1, title: 'Abandon ship drill', drill_type: 'evacuation', scheduled_date: daysFromNow(-5), status: 'missed', completed_at: null, notes: null },
      { ship_id: 1, title: 'Man overboard drill', drill_type: 'man_overboard', scheduled_date: daysFromNow(4), status: 'scheduled', completed_at: null, notes: null },
      { ship_id: 2, title: 'Quarterly fire drill', drill_type: 'fire', scheduled_date: daysFromNow(-20), status: 'completed', completed_at: daysFromNow(-20), notes: 'Smooth execution, follow-up training scheduled.' },
      { ship_id: 2, title: 'Oil spill response drill', drill_type: 'oil_spill', scheduled_date: daysFromNow(2), status: 'scheduled', completed_at: null, notes: null },
      { ship_id: 3, title: 'Security awareness drill', drill_type: 'security', scheduled_date: daysFromNow(-2), status: 'missed', completed_at: null, notes: null },
      { ship_id: 3, title: 'Medical emergency drill', drill_type: 'medical', scheduled_date: daysFromNow(7), status: 'scheduled', completed_at: null, notes: null },
    ].map(d => ({ ...d, description: `${d.title} per SOLAS/ISM schedule`, created_by: 1, created_at: now, updated_at: now }));

    await queryInterface.bulkInsert('drills', drills);

    await queryInterface.bulkInsert('drill_participations', [
      { drill_id: 1, user_id: 2, attended: true, submitted_at: daysFromNow(-15), remarks: 'On time', created_at: now, updated_at: now },
      { drill_id: 1, user_id: 3, attended: true, submitted_at: daysFromNow(-15), remarks: null, created_at: now, updated_at: now },
      { drill_id: 1, user_id: 4, attended: false, submitted_at: daysFromNow(-15), remarks: 'Off-duty', created_at: now, updated_at: now },
      { drill_id: 4, user_id: 5, attended: true, submitted_at: daysFromNow(-20), remarks: null, created_at: now, updated_at: now },
      { drill_id: 4, user_id: 6, attended: true, submitted_at: daysFromNow(-20), remarks: null, created_at: now, updated_at: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('drill_participations', null, {});
    await queryInterface.bulkDelete('drills', null, {});
    await queryInterface.bulkDelete('task_comments', null, {});
    await queryInterface.bulkDelete('maintenance_tasks', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('ships', null, {});
  },
};
