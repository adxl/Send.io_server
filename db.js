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

const buildId = (id1, id2) => `${id1}_${id2}`;

module.exports = {
	sequelize,
	connect,
	isPresent,
	isNotPresent,
	buildId,
};
