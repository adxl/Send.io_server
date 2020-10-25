const { DataTypes } = require('sequelize');
const db = require('../db');

const Invite = db.sequelize.define('invite', {
	invite: {
		type: DataTypes.STRING,
		allowNull: false,
		primaryKey: true,
	},
}, { timestamps: false });

module.exports = Invite;