'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('drill_participations', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      drill_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'drills', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      attended: { type: Sequelize.BOOLEAN, defaultValue: false },
      submitted_at: { type: Sequelize.DATE, allowNull: true },
      remarks: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('drill_participations', ['drill_id', 'user_id'], { unique: true });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('drill_participations');
  },
};
