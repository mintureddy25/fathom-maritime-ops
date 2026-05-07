module.exports = (sequelize, DataTypes) => {
  const TaskComment = sequelize.define('TaskComment', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    task_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
  }, { tableName: 'task_comments' });

  TaskComment.associate = (models) => {
    TaskComment.belongsTo(models.MaintenanceTask, { foreignKey: 'task_id', as: 'task' });
    TaskComment.belongsTo(models.User, { foreignKey: 'user_id', as: 'author' });
  };

  return TaskComment;
};
