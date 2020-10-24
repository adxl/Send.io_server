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
		type: DataTypes.INT,
		allowNull: false,
	},
}, { timestamps: false });

module.exports = User;
