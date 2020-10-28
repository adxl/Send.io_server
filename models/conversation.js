const { DataTypes } = require('sequelize');
const db = require('../db');
const Message = require('./message');

const Conversation = db.sequelize.define('conversation', {
	conversationId: {
		type: DataTypes.STRING,
		allowNull: false,
		primaryKey: true,
	},
}, { timestamps: false });

// Conversation has many messages

Conversation.hasMany(Message, {
	foreignKey: {
		name: 'conversationId',
		allowNull: false,
	},
	onDelete: 'CASCADE',
});

module.exports = Conversation;
