module.exports = (sequelize, DataTypes) => {
  const Drill = sequelize.define('Drill', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    ship_id: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(180), allowNull: false },
    drill_type: {
      type: DataTypes.ENUM('fire', 'evacuation', 'man_overboard', 'oil_spill', 'security', 'medical', 'other'),
      defaultValue: 'other',
    },
    description: { type: DataTypes.TEXT, allowNull: true },
    scheduled_date: { type: DataTypes.DATE, allowNull: false },
    status: { type: DataTypes.ENUM('scheduled', 'completed', 'missed'), defaultValue: 'scheduled' },
    created_by: { type: DataTypes.INTEGER, allowNull: false },
    completed_at: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  }, { tableName: 'drills' });

  Drill.associate = (models) => {
    Drill.belongsTo(models.Ship, { foreignKey: 'ship_id', as: 'ship' });
    Drill.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
    Drill.hasMany(models.DrillParticipation, { foreignKey: 'drill_id', as: 'participations' });
  };

  return Drill;
};
