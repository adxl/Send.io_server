const { DataTypes } = require('sequelize');
const db = require('../db');
const Conversation = require('./conversation');
const Friendship = require('./friendship');
const Invite = require('./invite');

const User = db.sequelize.define('user', {
	userId: {
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
		name: 'userId',
		allowNull: false,
	},
	onDelete: 'CASCADE',
});
User.hasMany(Friendship, {
	foreignKey: {
		name: 'friendId',
		allowNull: false,
	},
	onDelete: 'CASCADE',
});

// User has many invites : usr->friend  /  friend->usr

User.hasMany(Invite, {
	foreignKey: {
		name: 'userId',
		allowNull: false,
	},
	onDelete: 'CASCADE',
});

User.hasMany(Invite, {
	foreignKey: {
		name: 'friendId',
		allowNull: false,
	},
	onDelete: 'CASCADE',
});

// User has many conversations : user->friend only : sorted

User.hasMany(Conversation, {
	foreignKey: {
		name: 'userId',
		allowNull: false,
	},
	onDelete: 'CASCADE',
});

User.hasMany(Conversation, {
	foreignKey: {
		name: 'friendId',
		allowNull: false,
	},
	onDelete: 'CASCADE',
});

module.exports = User;
