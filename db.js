require('dotenv').config();

// const pg = require('pg');

// pg.defaults.ssl = true;

const { Sequelize } = require('sequelize');

const database = process.env.DATABASE;
const user = process.env.USERNAME;
const password = process.env.PASSWORD;
const host = process.env.HOST;

// const sequelize = new Sequelize(database, user, password, {
// 	host,
// 	dialect: 'postgres',
// 	logging: false,
// 	dialectOptions: {
// 		ssl: true,
// 	},
// });

const sequelize = new Sequelize(process.env.PG_URL, {
	logging: false,
	dialectOptions: {
		ssl: {
			require: true,
			rejectUnauthorized: false,
		},
	},
});

const connect = async () => {
	try {
		await sequelize.authenticate();
		await sequelize.sync({ alter: true });
		console.clear();
		console.log('*************');
		console.log('Connected');
	} catch (error) {
		console.error('ERROR', error);
	}
};

const isPresent = async (model, id) => await model.findByPk(id) != null;
const isNotPresent = async (model, id) => await model.findByPk(id) == null;

const buildPairId = (id1, id2) => `${id1}__${id2}`;

const buildOneWayId = (userId, friendId) => {
	if (userId < friendId) {
		return `${userId}__${friendId}`;
	}
	return `${friendId}__${userId}`;
};

const buildRelation = (userId, friendId) => {
	if (userId < friendId) {
		return {
			id: `${userId}__${friendId}`,
			user: userId,
			friend: friendId,
		};
	}
	return {
		id: `${friendId}__${userId}`,
		user: friendId,
		friend: userId,
	};
};

module.exports = {
	sequelize,
	connect,
	isPresent,
	isNotPresent,
	buildPairId,
	buildOneWayId,
	buildRelation,
};
