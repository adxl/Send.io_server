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
app.get('/users/me', auth.authToken, async (req, res) => {
	const { userId } = req;

	if (await db.isNotPresent(User, userId)) {
		return res.status(404).send('User not found');
	}

	const user = await User.findByPk(userId);

	const data = {
		id: user.userId,
		username: user.username,
		code: user.code,
	};

	return res.status(200).json(data);
});

// send an friend request
app.post('/invites/send', auth.authToken, async (req, res) => {
	const { userId } = req;
	const { friendId } = req.body;
	const inviteId = `${userId}_${friendId}`;

	if (userId === friendId) {
		return res.status(400).send('You can\'t invite yourself');
	}

	if (await db.isNotPresent(User, friendId)) {
		return res.status(404).send('User not found');
	}

	if (await db.isPresent(Invite, `${friendId}_${userId}`)) {
		return res.status(400).send('You have already been invited');
	}

	if (await db.isPresent(Invite, inviteId)) {
		return res.status(400).send('Invite already sent');
	}

	const invite = {
		userId,
		friendId,
		inviteId,
	};

	await Invite.create(invite);
	return res.status(201).send('Invite sent');
});

// cancel a sent request
app.post('/invites/cancel', auth.authToken, async (req, res) => {
	const { userId } = req;
	const { friendId } = req.body;
	const inviteId = `${userId}_${friendId}`;

	if (await db.isNotPresent(Invite, inviteId)) {
		return res.status(404).send('Invite does not exist');
	}

	await Invite.destroy({
		where: {
			inviteId,
		},
	});
	return res.status(200).send('Invite canceled');
});

// accept a friend request
app.post('/invites/accept', auth.authToken, async (req, res) => {
	const { userId } = req;
	const { friendId } = req.body;
	const inviteId = `${friendId}_${userId}`;

	if (await db.isNotPresent(Invite, inviteId)) {
		return res.status(400).send('Invite does not exist');
	}

	await Invite.destroy({
		where: {
			inviteId,
		},
	});

	const friendshipUserSide = {
		userId,
		friendId,
		friendshipId: `${userId}_${friendId}`,
	};
	const friendshipFriendSide = {
		userId: friendId,
		friendId: userId,
		friendshipId: `${friendId}_${userId}`,
	};

	await Friendship.create(friendshipUserSide);
	await Friendship.create(friendshipFriendSide);
	return res.status(201).send('Invite accepted');
});

// deny a friend request
app.post('/invites/deny', auth.authToken, async (req, res) => {
	const { userId } = req;
	const { friendId } = req.body;
	const inviteId = `${friendId}_${userId}`;

	if (await db.isNotPresent(Invite, inviteId)) {
		return res.status(404).send('Invite does not exist');
	}

	await Invite.destroy({
		where: {
			inviteId,
		},
	});
	return res.status(200).send('Invite denied');
});

// add new user
app.post('/register', async (req, res) => {
	const { username } = req.body;

	let code;
	let userId;
	let userExists;

	do {
		code = Math.floor(Math.random() * (9999 - 1000)) + 1000;
		userId = `${username}#${code}`;
		userExists = await db.isPresent(User, userId);
	} while (userExists);

	const user = {
		username,
		code,
		userId,
		password: await bcrypt.hash(req.body.password, 10),
	};

	await User.create(user);
	return res.status(201).send(userId);
});

// init
const port = process.env.PORT || 4000;
app.listen(port, () => db.connect());
