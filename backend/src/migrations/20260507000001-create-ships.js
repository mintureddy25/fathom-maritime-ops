'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ships', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(120), allowNull: false },
      imo_number: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      type: { type: Sequelize.STRING(60), allowNull: true },
      flag: { type: Sequelize.STRING(60), allowNull: true },
      status: { type: Sequelize.ENUM('active', 'docked', 'retired'), defaultValue: 'active' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('ships');
  },
};
