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
	const id = `${user}_${friend}`;

	if (user === friend) {
		return res.status(400).send('You can\'t invite yourself');
	}

	if (await db.isNotPresent(User, friend)) {
		return res.status(404).send('User not found');
	}

	if (await db.isPresent(Invite, id)) {
		return res.status(400).send('Invite already sent');
	}

	const invite = {
		usr: user,
		friend,
		invite: id,
	};

	await Invite.create(invite);
	return res.status(201).send('Invite sent');
});

app.post('/invites/cancel', auth.authToken, async (req, res) => {
	const user = req.id;
	const { friend } = req.body;
	const invite = `${user}_${friend}`;

	if (await db.isNotPresent(Invite, invite)) {
		return res.status(404).send('Invite does not exist');
	}

	await Invite.destroy({
		where: {
			invite,
		},
	});
	return res.status(200).send('Invite canceled');
});

app.post('/invites/accept', auth.authToken, async (req, res) => {
	const user = req.id;
	const { friend } = req.body;
	const inviteId = `${friend}_${user}`;

	if (await db.isNotPresent(Invite, inviteId)) {
		return res.status(400).send('Invite does not exist');
	}

	await Invite.destroy({
		where: {
			invite: inviteId,
		},
	});

	const friendshipUserSide = {
		usr: user,
		friend,
		friendship: `${user}_${friend}`,
	};
	const friendshipFriendSide = {
		usr: friend,
		friend: user,
		friendship: `${friend}_${user}`,
	};

	await Friendship.create(friendshipUserSide);
	await Friendship.create(friendshipFriendSide);
	return res.status(201).send('Invite accepted');
});

app.post('/invites/deny', auth.authToken, async (req, res) => {
	const user = req.id;
	const { friend } = req.body;
	const invite = `${friend}_${user}`;

	if (await db.isNotPresent(Invite, invite)) {
		return res.status(404).send('Invite does not exist');
	}

	await Invite.destroy({
		where: {
			invite,
		},
	});
	return res.status(200).send('Invite denied');
});

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
