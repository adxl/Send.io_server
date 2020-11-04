const { DataTypes } = require('sequelize');
const db = require('../db');
const Conversation = require('./conversation');
const Friendship = require('./friendship');
const Invite = require('./invite');

const User = db.sequelize.define('user', {
	username: {
		type: DataTypes.STRING,
		allowNull: false,
		primaryKey: true,
	},
	password: {
		type: DataTypes.STRING,
		allowNull: false,
	},
}, { timestamps: false });

// User has many friendships : usr->friend  /  friend->usr

User.hasMany(Friendship, {
	foreignKey: {
		name: 'user',
		allowNull: false,
	},
	onDelete: 'CASCADE',
});
User.hasMany(Friendship, {
	foreignKey: {
		name: 'friend',
		allowNull: false,
	},
	onDelete: 'CASCADE',
});

// User has many invites : usr->friend  /  friend->usr

User.hasMany(Invite, {
	foreignKey: {
		name: 'user',
		allowNull: false,
	},
	onDelete: 'CASCADE',
});

User.hasMany(Invite, {
	foreignKey: {
		name: 'friend',
		allowNull: false,
	},
	onDelete: 'CASCADE',
});

// User has many conversations

User.hasMany(Conversation, {
	foreignKey: {
		name: 'user',
		allowNull: false,
	},
	onDelete: 'CASCADE',
});

User.hasMany(Conversation, {
	foreignKey: {
		name: 'friend',
		allowNull: false,
	},
	onDelete: 'CASCADE',
});

module.exports = User;
