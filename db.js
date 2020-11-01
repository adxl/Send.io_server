require('dotenv').config();

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.PG_URL, {
	logging: false,
});

const connect = async () => {
	try {
		await sequelize.authenticate();
		console.log('Connected');
		await sequelize.sync({ force: true });
	} catch (error) {
		console.error('ERROR', error);
	}
};

const isPresent = async (model, id) => await model.findByPk(id) != null;
const isNotPresent = async (model, id) => await model.findByPk(id) == null;

const buildPairId = (id1, id2) => `${id1}__${id2}`;

const buildConversationId = (userId, friendId) => {
	if (userId < friendId) {
		return `${userId}__${friendId}`;
	}
	return `${friendId}__${userId}`;
};

// const splitUserId = (id) => {
// 	const infos = id.split('#');
// 	const data = {
// 		username: infos[0],
// 		code: infos[1],
// 		id,
// 	};
// 	return data;
// };

const splitPairId = (id) => {
	const infos = id.split('__');
	const data = {
		user: infos[0],
		friend: infos[1],
		id,
	};
	return data;
};

module.exports = {
	sequelize,
	connect,
	isPresent,
	isNotPresent,
	buildPairId,
	buildConversationId,
	// splitUserId,
	splitPairId,
};
