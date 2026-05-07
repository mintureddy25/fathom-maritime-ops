'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('drills', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      ship_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'ships', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      title: { type: Sequelize.STRING(180), allowNull: false },
      drill_type: {
        type: Sequelize.ENUM('fire', 'evacuation', 'man_overboard', 'oil_spill', 'security', 'medical', 'other'),
        defaultValue: 'other',
      },
      description: { type: Sequelize.TEXT, allowNull: true },
      scheduled_date: { type: Sequelize.DATE, allowNull: false },
      status: { type: Sequelize.ENUM('scheduled', 'completed', 'missed'), defaultValue: 'scheduled' },
      created_by: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      completed_at: { type: Sequelize.DATE, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('drills', ['ship_id']);
    await queryInterface.addIndex('drills', ['scheduled_date']);
    await queryInterface.addIndex('drills', ['status']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('drills');
  },
};
