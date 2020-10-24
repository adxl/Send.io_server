require('dotenv').config();

const express = require('express');

const app = express();
app.use(express.json());

const db = require('./db');
const User = require('./models/user');

// dev
console.clear();
db.connect();

app.get('/users', async (req, res) => {
	const users = await User.findAll();
	return res.status(200).json(users);
});

app.post('/users/create', async (req, res) => {
	const { username } = req.body;

	let code;
	let userExists;

	do {
		code = Math.floor(Math.random() * (9999 - 1000)) + 1000;
		userExists = await User.findByPk(`${username}#${code}`).then((u) => u);
	} while (userExists);

	const user = {
		username,
		code,
		id: `${username}#${code}`,
	};

	await User.create(user);
	return res.status(201).send(user.id);
});

// port config
const port = process.env.PORT || 4000;

app.listen(port, () => console.log(port));
