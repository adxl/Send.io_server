require('dotenv').config();

const express = require('express');

const router = express.Router();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { isNotPresent } = require('./db');

const User = require('./models/user');

router.use(express.json());

router.post('/login', async (req, res) => {
	const username = req.body.username.toLowerCase();
	const { password } = req.body;

	const user = await User.findByPk(username);
	if (user && await bcrypt.compare(password, user.password)) {
		const token = jwt.sign(username, process.env.TOKEN);
		return res.status(200).send(token);
	}

	return res.status(400).send('Wrong username or/and password');
});

const authToken = (req, res, next) => {
	const token = req.headers.authorization;

	if (token == null) return res.status(401).send('No token');

	jwt.verify(token, process.env.TOKEN, async (err, username) => {
		// if (err) return res.status(403).send('Invalid token');
		if (err || await isNotPresent(User, username)) {
			return res.status(403).send('Invalid token');
		}
		req.username = username;
		next();
		return 0;
	});

	return 0;
};

module.exports = {
	router,
	authToken,
};
