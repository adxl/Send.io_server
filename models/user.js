const { DataTypes } = require('sequelize');
const db = require('../db');
const Friendship = require('./friendship');

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

User.hasMany(Friendship, {
	foreignKey: 'usr',
	onDelete: 'CASCADE',
});
User.hasMany(Friendship, {
	foreignKey: 'friend',
	onDelete: 'CASCADE',
});

module.exports = User;
