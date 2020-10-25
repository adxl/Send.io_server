const { DataTypes } = require('sequelize');
const db = require('../db');

const Friendship = db.sequelize.define('friendship', {
	friendship: {
		type: DataTypes.STRING,
		allowNull: false,
		primaryKey: true,
	},
}, { timestamps: false });

module.exports = Friendship;
