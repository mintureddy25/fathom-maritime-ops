module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(160), allowNull: false, unique: true, validate: { isEmail: true } },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'crew'), allowNull: false, defaultValue: 'crew' },
    rank: { type: DataTypes.STRING(80), allowNull: true },
    ship_id: { type: DataTypes.INTEGER, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'users' });

  User.associate = (models) => {
    User.belongsTo(models.Ship, { foreignKey: 'ship_id', as: 'ship' });
    User.hasMany(models.MaintenanceTask, { foreignKey: 'assigned_to', as: 'assigned_tasks' });
    User.hasMany(models.MaintenanceTask, { foreignKey: 'created_by', as: 'created_tasks' });
    User.hasMany(models.TaskComment, { foreignKey: 'user_id', as: 'comments' });
    User.hasMany(models.DrillParticipation, { foreignKey: 'user_id', as: 'drill_participations' });
  };

  User.prototype.toSafeJSON = function () {
    const { password_hash, ...rest } = this.get({ plain: true });
    return rest;
  };

  return User;
};
