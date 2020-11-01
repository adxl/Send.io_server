require('dotenv').config();

const express = require('express');

const router = express.Router();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/user');

router.use(express.json());

router.post('/login', async (req, res) => {
	const username = req.body.username.toLowerCase();
	const { password } = req.body;

	const userExists = await User.findByPk(username);
	if (userExists && await bcrypt.compare(password, userExists.password)) {
		const token = jwt.sign(username, process.env.TOKEN);
		return res.status(200).send(token);
	}
	return res.status(400).send('Wrong username or/and password');
});

const authToken = (req, res, next) => {
	const token = req.headers.authorization;

	if (token == null) return res.status(401).send('Bad request : no token');

	jwt.verify(token, process.env.TOKEN, (err, id) => {
		if (err) return res.status(403).send('Forbidden : invalid token');
		req.username = id;
		next();
	});
};

module.exports = {
	router,
	authToken,
};
