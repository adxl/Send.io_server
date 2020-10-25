require('dotenv').config();

// dep
const express = require('express');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());

// exports
const db = require('./db');
const auth = require('./auth.js');
const User = require('./models/user');
const Friendship = require('./models/friendship');
const Invite = require('./models/invite');

app.use(auth.router);

/* !DEV BLOCK! */
console.clear();
console.log('*************');
// get list of users
app.get('/users', async (req, res) => {
	const users = await User.findAll();
	return res.status(200).json(users);
});
/* !END OF DEV BLOCK! */

// get current user (from token)
app.get('/users/me', auth.authToken, (req, res) => res.status(200).send(req.id));

// send an friend request
app.post('/invites/send', auth.authToken, async (req, res) => {
	const user = req.id;
	const { friend } = req.body;

	if (user === friend) {
		return res.status(400).send('You can\'t invite yourself');
	}

	const inviteExists = await Invite.findByPk(`${user}_${friend}`);
	if (inviteExists) {
		return res.status(400).send('Invite already sent');
	}

	const friendExists = await User.findByPk(friend);

	if (!friendExists) {
		return res.status(404).send('User not found');
	}

	const invite = {
		usr: user,
		friend,
		invite: `${user}_${friend}`,
	};

	await Invite.create(invite);
	return res.status(201).send('Invite sent');
});

// app.post('/invites/cancel', (req, res) => {
// });

// app.post('/invites/accept', (req, res) => {
// });

// app.post('/invites/deny', (req, res) => {
// });

// add new user
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

// init
const port = process.env.PORT || 4000;
app.listen(port, () => db.connect());
