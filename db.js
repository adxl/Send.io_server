require('dotenv').config();

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.PG_URL, {
	logging: false,
});

const connect = async () => {
	try {
		await sequelize.authenticate();
		console.log('Connected');
	} catch (error) {
		console.error('ERROR', error);
	}
};

module.exports = {
	sequelize,
	connect,
};
