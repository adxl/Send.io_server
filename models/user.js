const { DataTypes } = require('sequelize');
const db = require('../db');

const User = db.sequelize.define('user', {
	username: {
		type: DataTypes.TEXT,
		allowNull: false,
		primaryKey: true,
	},
	firstName: {
		type: DataTypes.TEXT,
		allowNull: false,
	},
	lastName: {
		type: DataTypes.TEXT,
		allowNull: false,
	},

}, { timestamps: false });

module.exports = User;
