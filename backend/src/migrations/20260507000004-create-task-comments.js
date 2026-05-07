'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('task_comments', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      task_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'maintenance_tasks', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      body: { type: Sequelize.TEXT, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('task_comments', ['task_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('task_comments');
  },
};
