const { Sequelize } = require('sequelize');
const cfg = require('./sequelize').development;

const sequelize = new Sequelize(cfg.database, cfg.username, cfg.password, cfg);

module.exports = sequelize;
