require('dotenv').config();

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.PG_URL, {
	logging: false,
});

const connect = async () => {
	try {
		await sequelize.authenticate();
		console.log('Connected');
		await sequelize.sync({ alter: true });
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
