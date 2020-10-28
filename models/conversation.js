const { DataTypes } = require('sequelize');
const db = require('../db');

const Conversation = db.sequelize.define('conversation', {
	conversationId: {
		type: DataTypes.STRING,
		allowNull: false,
		primaryKey: true,
	},
}, { timestamps: false });

module.exports = Conversation;
