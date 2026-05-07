module.exports = (sequelize, DataTypes) => {
  const DrillParticipation = sequelize.define('DrillParticipation', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    drill_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    attended: { type: DataTypes.BOOLEAN, defaultValue: false },
    submitted_at: { type: DataTypes.DATE, allowNull: true },
    remarks: { type: DataTypes.STRING(255), allowNull: true },
  }, {
    tableName: 'drill_participations',
    indexes: [{ unique: true, fields: ['drill_id', 'user_id'] }],
  });

  DrillParticipation.associate = (models) => {
    DrillParticipation.belongsTo(models.Drill, { foreignKey: 'drill_id', as: 'drill' });
    DrillParticipation.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return DrillParticipation;
};
