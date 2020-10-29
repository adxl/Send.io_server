require('dotenv').config();

// dep
const express = require('express');

const app = express();

const http = require('http').createServer(app);
const cors = require('cors');
const io = require('socket.io')(http);
const bcrypt = require('bcrypt');

app.use(express.json());
app.use(cors());

// exports
const { Op } = require('sequelize');
const db = require('./db');
const auth = require('./auth.js');
const User = require('./models/user');
const Friendship = require('./models/friendship');
const Invite = require('./models/invite');
const { isPresent, buildPairId } = require('./db');
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
	const { userId } = req;

	const user = await User.findByPk(userId);

	const data = {
		id: user.userId,
		username: user.username,
		code: user.code,
	};

	return res.status(200).json(data);
});

// get public user
app.get('/users/x', auth.authToken, async (req, res) => {
	const { userId } = req;
	const { searchedUserId } = req.body;

	if (await db.isNotPresent(User, searchedUserId)) {
		return res.status(404).send('User not found');
	}

	const user = await User.findByPk(searchedUserId);
	const isFriend = await isPresent(Friendship, db.buildPairId(userId, searchedUserId));
	const isRequested = await isPresent(Invite, db.buildPairId(userId, searchedUserId));
	const isInvitedBy = await isPresent(Invite, db.buildPairId(searchedUserId, userId));
	const isSelf = userId === searchedUserId;

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
	const { userId } = req;

	const invites = await Invite.findAll({
		attributes: ['userId'],
		where: {
			friendId: userId,
		},
	});

	const invitesList = invites.map((i) => db.splitUserId(i.userId));

	return res.status(200).json(invitesList);
});

// send an friend request
app.post('/invites/send', auth.authToken, async (req, res) => {
	const { userId } = req;
	const { friendId } = req.body;
	const inviteId = db.buildPairId(userId, friendId);

	if (userId === friendId) {
		return res.status(400).send('You can\'t invite yourself');
	}

	if (await db.isNotPresent(User, friendId)) {
		return res.status(404).send('User not found');
	}

	if (await db.isPresent(Friendship, db.buildPairId(userId, friendId))) {
		return res.status(400).send('You are already friends');
	}

	if (await db.isPresent(Invite, db.buildPairId(friendId, userId))) {
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
	const inviteId = db.buildPairId(userId, friendId);

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
	const inviteId = db.buildPairId(friendId, userId);

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
		friendshipId: db.buildPairId(userId, friendId),
	};
	const friendshipFriendSide = {
		userId: friendId,
		friendId: userId,
		friendshipId: db.buildPairId(friendId, userId),
	};

	await Friendship.create(friendshipUserSide);
	await Friendship.create(friendshipFriendSide);
	return res.status(201).send('Invite accepted');
});

// deny a friend request
app.post('/invites/deny', auth.authToken, async (req, res) => {
	const { userId } = req;
	const { friendId } = req.body;
	const inviteId = db.buildPairId(friendId, userId);

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

	const conversationId = db.buildConversationId(userId, friendId);

	if (await db.isPresent(Conversation, conversationId)) {
		return res.status(400).send('Conversation exists already');
	}

	const conversationLeft = {
		conversationId,
		userId,
		friendId,
	};
	const conversationRight = {
		conversationId,
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
http.listen(port, () => db.connect());
