'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('maintenance_tasks', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      ship_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'ships', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      title: { type: Sequelize.STRING(180), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      category: { type: Sequelize.STRING(80), allowNull: true },
      priority: { type: Sequelize.ENUM('low', 'medium', 'high', 'critical'), defaultValue: 'medium' },
      due_date: { type: Sequelize.DATEONLY, allowNull: false },
      status: { type: Sequelize.ENUM('pending', 'in_progress', 'completed'), defaultValue: 'pending' },
      assigned_to: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      created_by: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      completed_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('maintenance_tasks', ['ship_id']);
    await queryInterface.addIndex('maintenance_tasks', ['assigned_to']);
    await queryInterface.addIndex('maintenance_tasks', ['status']);
    await queryInterface.addIndex('maintenance_tasks', ['due_date']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('maintenance_tasks');
  },
};
