'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(120), allowNull: false },
      email: { type: Sequelize.STRING(160), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      role: { type: Sequelize.ENUM('admin', 'crew'), allowNull: false, defaultValue: 'crew' },
      rank: { type: Sequelize.STRING(80), allowNull: true },
      ship_id: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'ships', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('users', ['ship_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
