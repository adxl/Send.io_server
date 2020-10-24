const { DataTypes } = require('sequelize');
const db = require('../db');

const User = db.sequelize.define('user', {
	id: {
		type: DataTypes.STRING,
		allowNull: false,
		primaryKey: true,
	},
	username: {
		type: DataTypes.TEXT,
		allowNull: false,
	},
	code: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
	password: {
		type: DataTypes.TEXT,
		allowNull: false,
	},
}, { timestamps: false });

module.exports = User;
