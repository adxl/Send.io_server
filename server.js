require('dotenv').config();

// dep
const express = require('express');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());

// exports
const db = require('./db');
const User = require('./models/user');

// dev
console.clear();
db.connect();

app.get('/users', async (req, res) => {
	const users = await User.findAll();
	return res.status(200).json(users);
});

app.post('/register', async (req, res) => {
	const { username } = req.body;

	let code;
	let id;
	let userExists;

	do {
		code = Math.floor(Math.random() * (9999 - 1000)) + 1000;
		id = `${username}#${code}`;
		userExists = await User.findByPk(id).then((u) => u);
	} while (userExists);

	const user = {
		username,
		code,
		id,
		password: await bcrypt.hash(req.body.password, 10),
	};

	await User.create(user);
	return res.status(201).send(user.id);
});

// port config
const port = process.env.PORT || 4000;

app.listen(port, () => console.log(port));
