require('dotenv').config();

const express = require('express');

const app = express();

const http = require('http').createServer(app);
const cors = require('cors');
// const io = require('socket.io')(http);
const bcrypt = require('bcrypt');

// const { Op } = require('sequelize');
const db = require('./db');
const auth = require('./auth.js');

/* models */
const User = require('./models/user');
const Friendship = require('./models/friendship');
const Invite = require('./models/invite');
const Conversation = require('./models/conversation');
const Message = require('./models/message');

app.use(express.json());
app.use(auth.router);
app.use(cors());

/* !DEV BLOCK! */
console.clear();
console.log('*************');

// get list of users
app.get('/users', async (req, res) => {
	const users = await User.findAll();
	return res.status(200).json(users);
});

/* !END OF DEV BLOCK! */

// socket
// io.on('connect', (socket) => {
// 	const { id } = socket.handshake.query;
// 	console.log(`${id} connected`);
// 	socket.join(id);

// 	socket.on('send-message', (data) => {
// 		const { sender } = data;
// 		const { message } = data;

// 		io.emit('receive-message', `${sender} said : ${message}`);
// 		console.log(`${sender} said : ${message}`);
// 	});

// 	socket.on('disconnect', () => console.log(`${id} left`));
// });

// get current user (from token)
app.get('/users/me', auth.authToken, async (req, res) => {
	const { username } = req;
	return res.status(200).json({ username });
});

// get public user
app.get('/users/:x', auth.authToken, async (req, res) => {
	const { username } = req;
	const { x } = req.params;

	if (await db.isNotPresent(User, x)) {
		return res.status(404).send('User not found');
	}

	const user = await User.findByPk(x);
	const isFriend = await db.isPresent(Friendship, db.buildId(username, x));
	const isRequested = await db.isPresent(Invite, db.buildId(username, x));
	const isInvitedBy = await db.isPresent(Invite, db.buildId(x, username));
	const isSelf = username === x;

	const data = {
		username: user.username,
		isFriend,
		isRequested,
		isInvitedBy,
		isSelf,
	};

	return res.status(200).json(data);
});

app.get('/invites', auth.authToken, async (req, res) => {
	const { username } = req;

	const invites = await Invite.findAll({
		attributes: ['user'],
		where: {
			friend: username,
		},
	});

	return res.status(200).send(invites);
});

// send an friend request
app.post('/invites/send', auth.authToken, async (req, res) => {
	const { username } = req;
	const { friend } = req.body;
	const inviteId = db.buildId(username, friend);

	if (username === friend) {
		return res.status(400).send('You can\'t invite yourself');
	}

	if (await db.isNotPresent(User, friend)) {
		return res.status(404).send('User not found');
	}

	if (await db.isPresent(Friendship, db.buildId(username, friend))) {
		return res.status(400).send('You are already friends');
	}

	if (await db.isPresent(Invite, db.buildId(friend, username))) {
		return res.status(400).send('You have already been invited');
	}

	if (await db.isPresent(Invite, inviteId)) {
		return res.status(400).send('Invite already sent');
	}

	const invite = {
		id: inviteId,
		user: username,
		friend,
	};

	await Invite.create(invite);
	return res.status(201).send('Invite sent');
});

// cancel a sent request
app.post('/invites/cancel', auth.authToken, async (req, res) => {
	const { username } = req;
	const { friend } = req.body;
	const inviteId = db.buildId(username, friend);

	if (await db.isNotPresent(Invite, inviteId)) {
		return res.status(404).send('Invite does not exist');
	}

	await Invite.destroy({
		where: {
			id: inviteId,
		},
	});
	return res.status(200).send('Invite canceled');
});

// accept a friend request
app.post('/invites/accept', auth.authToken, async (req, res) => {
	const { username } = req;
	const { friend } = req.body;
	const inviteId = db.buildId(friend, username);

	if (await db.isNotPresent(Invite, inviteId)) {
		return res.status(400).send('Invite does not exist');
	}

	await Invite.destroy({
		where: {
			id: inviteId,
		},
	});

	const friendshipUserSide = {
		id: db.buildId(username, friend),
		user: username,
		friend,
	};
	const friendshipFriendSide = {
		id: db.buildId(friend, username),
		user: friend,
		friend: username,
	};

	await Friendship.create(friendshipUserSide);
	await Friendship.create(friendshipFriendSide);
	return res.status(201).send('Invite accepted');
});

// deny a friend request
app.post('/invites/deny', auth.authToken, async (req, res) => {
	const { username } = req;
	const { friend } = req.body;
	const inviteId = db.buildId(friend, username);

	if (await db.isNotPresent(Invite, inviteId)) {
		return res.status(404).send('Invite does not exist');
	}

	await Invite.destroy({
		where: {
			id: inviteId,
		},
	});
	return res.status(200).send('Invite denied');
});

// get friends list
app.get('/friends', auth.authToken, async (req, res) => {
	const { username } = req;

	const friends = await Friendship.findAll({
		attributes: ['friend'],
		where: {
			user: username,
		},
	});

	return res.status(200).json(friends);
});

// remove friend
app.post('/friends/unfriend', auth.authToken, async (req, res) => {
	const { username } = req;
	const { friend } = req.body;
	const friendshipId = db.buildId(username, friend);

	if (await db.isNotPresent(Friendship, friendshipId)) {
		return res.status(404).send('Friend not found');
	}

	const friendshipUserSide = friendshipId;
	const friendshipFriendSide = db.buildId(friend, username);

	await Friendship.destroy({
		where: {
			id: friendshipUserSide,
		},
	});
	await Friendship.destroy({
		where: {
			id: friendshipFriendSide,
		},
	});

	return res.status(200).send('Removed friend');
});

// get user conversations
app.get('/conversations', auth.authToken, async (req, res) => {
	const { username } = req;

	const conversations = await Conversation.findAll({
		attributes: ['id'],
		where: {
			user: username,
		},
	});

	return res.status(200).json(conversations);
});

app.post('/conversations/new', auth.authToken, async (req, res) => {
	const { username } = req;
	const { friend } = req.body;

	if (username === friend) {
		return res.status(400).send('Cannot start a conversation with yourself');
	}

	if (await db.isNotPresent(User, friend)) {
		return res.status(404).send('User not found');
	}

	const conversationId = db.buildId(username, friend);

	if (await db.isPresent(Conversation, conversationId)) {
		return res.status(400).send('Conversation exists already');
	}

	const conversationLeft = {
		id: conversationId,
		user: username,
		friend,
	};
	const conversationRight = {
		id: db.buildId(friend, username),
		user: friend,
		friend: username,
	};

	await Conversation.create(conversationLeft);
	await Conversation.create(conversationRight);
	return res.status(201).send('Conversation created');
});

// get conversation messages
app.get('/conversations/:id/messages', auth.authToken, async (req, res) => {
	const conversationId = req.params.id;

	if (await db.isNotPresent(Conversation, conversationId)) {
		return res.status(404).send('This conversation does not exist');
	}

	const messages = await Message.findAll({
		attributes: ['sender', 'text'],
		where: {
			conversationId,
		},
	});

	const messagesList = messages.map((m) => ({
		sender: m.sender,
		text: m.text,
	}));

	return res.status(200).json(messagesList);
});

// add new user
app.post('/register', async (req, res) => {
	const username = req.body.username.toLowerCase();

	if (await db.isPresent(User, username)) {
		return res.status(400).send('This username has already been taken');
	}

	const user = {
		username,
		password: await bcrypt.hash(req.body.password, 10),
	};

	await User.create(user);
	return res.status(201).send(username);
});

// init
const port = process.env.PORT || 4000;
http.listen(port, () => db.connect());
