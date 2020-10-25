const { DataTypes } = require('sequelize');
const db = require('../db');
const Friendship = require('./friendship');
const Invite = require('./invite');

const User = db.sequelize.define('user', {
	id: {
		type: DataTypes.STRING,
		allowNull: false,
		primaryKey: true,
	},
	username: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	code: {
		type: DataTypes.SMALLINT,
		allowNull: false,
	},
	password: {
		type: DataTypes.STRING,
		allowNull: false,
	},
}, { timestamps: false });

// User has many friendships : usr->friend  /  friend->usr
User.hasMany(Friendship, {
	foreignKey: {
		name: 'usr',
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
		name: 'usr',
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

module.exports = User;
