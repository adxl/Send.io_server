const express = require('express');

const router = express.Router();

const { Op } = require('sequelize');
const { authenticate } = require('../auth');
const { isPresent, isNotPresent, buildOneWayId, buildRelation } = require('../db');

const User = require('../models/user');
const Conversation = require('../models/conversation');
const Message = require('../models/message');

// get user conversations
router.get('/', authenticate, async (req, res) => {
	const { username } = req;

	let conversations = await Conversation.findAll({
		attributes: ['id', 'user', 'friend'],
		where: {
			id: {
				[Op.substring]: username,
			},
		},
	});

	conversations = conversations.map((c) => {
		if (c.user === username) {
			return { id: c.id, friend: c.friend };
		} return { id: c.id, friend: c.user };
	});

	return res.status(200).json(conversations);
});

// create a new conversation between 2 users
router.post('/new', authenticate, async (req, res) => {
	const { username } = req;
	const { friend } = req.body;

	if (username === friend) {
		return res.status(400).send('Cannot start a conversation with yourself');
	}

	if (await isNotPresent(User, friend)) {
		return res.status(404).send('User not found');
	}

	const conversation = buildRelation(username, friend);

	if (await isPresent(Conversation, conversation.id)) {
		return res.status(400).send('Conversation exists already');
	}

	await Conversation.create(conversation);
	return res.status(201).send('Conversation created');
});

// delete a conversation between 2 users
router.delete('/:friend', authenticate, async (req, res) => {
	const { username } = req;
	const { friend } = req.params;

	const conversation = buildRelation(username, friend);

	if (await isNotPresent(Conversation, conversation.id)) {
		return res.status(404).send('Conversation does not exist');
	}

	await Conversation.destroy({
		where: {
			id: conversation.id,
		},
	});

	return res.status(200).send('Conversation deleted');
});

// get conversation messages
router.get('/:friend/messages', authenticate, async (req, res) => {
	const { username } = req;
	const { friend } = req.params;
	const conversationId = buildOneWayId(username, friend);

	if (await isNotPresent(Conversation, conversationId)) {
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

module.exports = {
	messagingRouter: router,
};
