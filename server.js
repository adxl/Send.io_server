require('dotenv').config();

// dep
const express = require('express');

const app = express();

const http = require('http').createServer(app);
const cors = require('cors');
// const io = require('socket.io')(http);
const bcrypt = require('bcrypt');

app.use(express.json());
app.use(cors());

// exports
// const { Op } = require('sequelize');
const db = require('./db');
const auth = require('./auth.js');
const User = require('./models/user');
const Friendship = require('./models/friendship');
const Invite = require('./models/invite');
const { isPresent, buildPairId, isNotPresent } = require('./db');
const Conversation = require('./models/conversation');
const Message = require('./models/message');

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

	// const user = await User.findByPk(username);

	// if (user == null) {
	// 	return res.status(404).send('User does not exist anymore');
	// }

	// if (await isNotPresent(User, username)) {
	// 	return res.status(404).send('User does not exist anymore');
	// }

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
	const isFriend = await isPresent(Friendship, db.buildPairId(username, x));
	const isRequested = await isPresent(Invite, db.buildPairId(username, x));
	const isInvitedBy = await isPresent(Invite, db.buildPairId(x, username));
	const isSelf = username === x;

	const data = {
		id: user.userId,
		username: user.username,
		code: user.code,
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

	// const invitesList = invites.map((i) => db.splitUserId(i.userId));

	// return res.status(200).json(invitesList);
	return res.status(200).send(invites);
});

// send an friend request
app.post('/invites/send', auth.authToken, async (req, res) => {
	const { username } = req;
	const { friend } = req.body;
	const inviteId = db.buildPairId(username, friend);

	if (username === friend) {
		return res.status(400).send('You can\'t invite yourself');
	}

	if (await db.isNotPresent(User, friend)) {
		return res.status(404).send('User not found');
	}

	if (await db.isPresent(Friendship, db.buildPairId(username, friend))) {
		return res.status(400).send('You are already friends');
	}

	if (await db.isPresent(Invite, db.buildPairId(friend, username))) {
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
	const inviteId = db.buildPairId(username, friend);

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
	const inviteId = db.buildPairId(friend, username);

	if (await db.isNotPresent(Invite, inviteId)) {
		return res.status(400).send('Invite does not exist');
	}

	await Invite.destroy({
		where: {
			id: inviteId,
		},
	});

	const friendshipUserSide = {
		id: db.buildPairId(username, friend),
		user: username,
		friend,
	};
	const friendshipFriendSide = {
		id: db.buildPairId(friend, username),
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
	const inviteId = db.buildPairId(friend, username);

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
	const { userId } = req;

	const friends = await Friendship.findAll({
		attributes: ['friendId'],
		where: {
			userId,
		},
	});

	const friendsList = friends.map((f) => db.splitUserId(f.friendId));

	return res.status(200).json(friendsList);
});

// remove friend
app.post('/friends/unfriend', auth.authToken, async (req, res) => {
	const { userId } = req;
	const { friendId } = req.body;
	const friendshipId = db.buildPairId(userId, friendId);

	if (await db.isNotPresent(Friendship, friendshipId)) {
		return res.status(404).send('Friend not found');
	}

	const friendshipUserSide = friendshipId;
	const friendshipFriendSide = db.buildPairId(friendId, userId);

	await Friendship.destroy({
		where: {
			friendshipId: friendshipUserSide,
		},
	});
	await Friendship.destroy({
		where: {
			friendshipId: friendshipFriendSide,
		},
	});

	return res.status(200).send('Removed friend');
});

// get user conversations
app.get('/conversations', auth.authToken, async (req, res) => {
	const { userId } = req;

	const conversations = await Conversation.findAll({
		attributes: ['conversationId'],
		where: {
			userId,
		},
	});

	const conversationsList = conversations.map((c) => db.splitPairId(c.conversationId));

	return res.status(200).json(conversationsList);
});

app.post('/conversations/new', auth.authToken, async (req, res) => {
	const { userId } = req;
	const { friendId } = req.body;

	if (userId === friendId) {
		return res.status(400).send('Cannot start a conversation with yourself');
	}

	if (await db.isNotPresent(User, friendId)) {
		return res.status(404).send('User not found');
	}

	const conversationId = db.buildPairId(userId, friendId);

	if (await db.isPresent(Conversation, conversationId)) {
		return res.status(400).send('Conversation exists already');
	}

	const conversationLeft = {
		conversationId,
		userId,
		friendId,
	};
	const conversationRight = {
		conversationId: db.buildPairId(friendId, userId),
		userId: friendId,
		friendId: userId,
	};

	await Conversation.create(conversationLeft);
	await Conversation.create(conversationRight);
	return res.status(201).send('Conversation created');
});

// get conversation messages
app.get('/messages', auth.authToken, async (req, res) => {
	// const { userId } = req;
	const { ConversationId } = req.body;

	const messages = await Message.findAll({
		attributes: ['sender', 'text'],
		where: {
			ConversationId,
		},
	});

	const messagesList = messages.map((c) => ({
		sender: c.sender,
		text: c.text,
	}));

	return res.status(200).json(messagesList);
});

// add new user
app.post('/register', async (req, res) => {
	const username = req.body.username.toLowerCase();

	// let code;
	// let userId;
	// let userExists;

	// do {
	// 	code = Math.floor(Math.random() * (9999 - 1000)) + 1000;
	// 	userId = `${username}#${code}`;
	// 	userExists = await db.isPresent(User, userId);
	// } while (userExists);

	if (await isPresent(User, username)) {
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
