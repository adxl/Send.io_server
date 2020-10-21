const { DataTypes } = require('sequelize');
const db = require('../db');

const User = db.sequelize.define('User', {
  username: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  firstName: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  lastName: {
    type: DataTypes.TEXT,
    allowNull: false
  }
});

module.exports = {
  user: User
};
