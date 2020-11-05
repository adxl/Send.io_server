require('dotenv').config();

const express = require('express');

const app = express();
app.use(express.json());

const http = require('http').createServer(app);
const cors = require('cors');

app.use(cors());
// const io = require('socket.io')(http);

const db = require('./db');

/* routers */
const { authRouter, authenticate } = require('./auth');
const { userRouter } = require('./routes/userRoutes');
const { friendshipRouter } = require('./routes/friendshipRoutes');

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

/* Friendship related routes */
app.use(friendshipRouter);

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
