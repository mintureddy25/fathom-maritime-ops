const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const db = {};

fs.readdirSync(__dirname)
  .filter(f => f !== 'index.js' && f.endsWith('.js'))
  .forEach(f => {
    const model = require(path.join(__dirname, f))(sequelize, DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(name => {
  if (typeof db[name].associate === 'function') {
    db[name].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
