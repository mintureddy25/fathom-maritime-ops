module.exports = (sequelize, DataTypes) => {
  const Ship = sequelize.define('Ship', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    imo_number: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    type: { type: DataTypes.STRING(60), allowNull: true },
    flag: { type: DataTypes.STRING(60), allowNull: true },
    status: { type: DataTypes.ENUM('active', 'docked', 'retired'), defaultValue: 'active' },
  }, { tableName: 'ships' });

  Ship.associate = (models) => {
    Ship.hasMany(models.User, { foreignKey: 'ship_id', as: 'crew' });
    Ship.hasMany(models.MaintenanceTask, { foreignKey: 'ship_id', as: 'tasks' });
    Ship.hasMany(models.Drill, { foreignKey: 'ship_id', as: 'drills' });
  };

  return Ship;
};
