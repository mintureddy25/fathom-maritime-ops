module.exports = (sequelize, DataTypes) => {
  const MaintenanceTask = sequelize.define('MaintenanceTask', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    ship_id: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(180), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    category: { type: DataTypes.STRING(80), allowNull: true },
    priority: { type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), defaultValue: 'medium' },
    due_date: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'in_progress', 'completed'), defaultValue: 'pending' },
    assigned_to: { type: DataTypes.INTEGER, allowNull: true },
    created_by: { type: DataTypes.INTEGER, allowNull: false },
    completed_at: { type: DataTypes.DATE, allowNull: true },
  }, { tableName: 'maintenance_tasks' });

  MaintenanceTask.associate = (models) => {
    MaintenanceTask.belongsTo(models.Ship, { foreignKey: 'ship_id', as: 'ship' });
    MaintenanceTask.belongsTo(models.User, { foreignKey: 'assigned_to', as: 'assignee' });
    MaintenanceTask.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
    MaintenanceTask.hasMany(models.TaskComment, { foreignKey: 'task_id', as: 'comments' });
  };

  return MaintenanceTask;
};
