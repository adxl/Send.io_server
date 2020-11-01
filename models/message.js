const { DataTypes } = require('sequelize');
const db = require('../db');

const Message = db.sequelize.define('message', {
	id: {
		type: DataTypes.UUID,
		defaultValue: db.sequelize.UUIDV4,
		allowNull: false,
		primaryKey: true,
	},
	sender: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	text: {
		type: DataTypes.TEXT,
		allowNull: false,
	},
}, { timestamps: false });

module.exports = Message;
