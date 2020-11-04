require('dotenv').config();

const express = require('express');

const app = express();
app.use(express.json());

const http = require('http').createServer(app);
const cors = require('cors');

app.use(cors());
// const io = require('socket.io')(http);

const { Op } = require('sequelize');
const db = require('./db');

const { authRouter, authenticate } = require('./auth');
const { userRouter } = require('./routes/userRoutes');

/* models */
const User = require('./models/user');
const Friendship = require('./models/friendship');
const Invite = require('./models/invite');
const Conversation = require('./models/conversation');
const Message = require('./models/message');

console.clear();
console.log('*************');

/* Authentication routes */
app.use(authRouter);



/* User related routes */
app.use('/users', userRouter);

app.get('/invites', authenticate, async (req, res) => {
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
app.post('/invites/send', authenticate, async (req, res) => {
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
app.post('/invites/cancel', authenticate, async (req, res) => {
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
app.post('/invites/accept', authenticate, async (req, res) => {
	const { username } = req;
	const { friend } = req.body;
	const inviteId = db.buildPairId(friend, username);

	if (await db.isNotPresent(Invite, inviteId)) {
		return res.status(400).send('Invite does not exist');
	}

	const friendship = db.buildRelation(username, friend);

	await Friendship.create(friendship);

	await Invite.destroy({
		where: {
			id: inviteId,
		},
	});

	return res.status(201).send('Invite accepted');
});

// deny a friend request
app.post('/invites/deny', authenticate, async (req, res) => {
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
app.get('/friends', authenticate, async (req, res) => {
	const { username } = req;

	let friends = await Friendship.findAll({
		attributes: ['user', 'friend'],
		where: {
			id: {
				[Op.substring]: username,
			},
		},
	});

	friends = friends.map((f) => {
		if (f.user === username) {
			return f.friend;
		} return f.user;
	});

	return res.status(200).json(friends);
});

// remove friend
app.post('/friends/unfriend', authenticate, async (req, res) => {
	const { username } = req;
	const { friend } = req.body;
	const friendshipId = db.buildRelation(username, friend).id;

	console.log(username);
	console.log(friendshipId);

	if (await db.isNotPresent(Friendship, friendshipId)) {
		return res.status(404).send('Friend not found');
	}

	await Friendship.destroy({
		where: {
			id: friendshipId,
		},
	});

	return res.status(200).send('Removed friend');
});

// get user conversations
app.get('/conversations', authenticate, async (req, res) => {
	const { username } = req;

	let conversations = await Conversation.findAll({
		attributes: ['user', 'friend'],
		where: {
			id: {
				[Op.substring]: username,
			},
		},
	});

	conversations = conversations.map((c) => {
		if (c.user === username) {
			return c.friend;
		} return c.user;
	});

	return res.status(200).json(conversations);
});

app.post('/conversations/new', authenticate, async (req, res) => {
	const { username } = req;
	const { friend } = req.body;

	if (username === friend) {
		return res.status(400).send('Cannot start a conversation with yourself');
	}

	if (await db.isNotPresent(User, friend)) {
		return res.status(404).send('User not found');
	}

	const conversation = db.buildConversationObject(username, friend);

	if (await db.isPresent(Conversation, conversation.id)) {
		return res.status(400).send('Conversation exists already');
	}

	await Conversation.create(conversation);
	return res.status(201).send('Conversation created');
});

// get conversation messages
app.get('/conversations/:friend', authenticate, async (req, res) => {
	const { username } = req;
	const { friend } = req.params;
	const conversationId = db.buildOneWayId(username, friend);

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

// init
const port = process.env.PORT || 4000;
http.listen(port, () => db.connect());
