require('dotenv').config();

const express = require('express');

const app = express();
app.use(express.json());

const db = require('./db');
const User = require('./models/user');

// dev
console.clear();
db.connect();

app.get('/', (req, res) => res.send('hey'));

app.post('/users/create', async (req, res) => {
	const user = {
		username: req.body.username,
		firstName: req.body.firstName,
		lastName: req.body.lastName,
	};

	await User.create(user);
	return res.status(201).send();
});

// port config
const port = process.env.PORT || 4000;

app.listen(port, () => console.log(port));
