const express = require('express');

const router = express.Router();

const { Op } = require('sequelize');
const { authenticate } = require('../auth');
const {
	isPresent, isNotPresent, buildPairId, buildRelation,
} = require('../db');

const User = require('../models/user');
const Friendship = require('../models/friendship');
const Invite = require('../models/invite');

router.get('/invites', authenticate, async (req, res) => {
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
router.post('/invites/send', authenticate, async (req, res) => {
	const { username } = req;
	const { friend } = req.body;
	const inviteId = buildPairId(username, friend);

	if (username === friend) {
		return res.status(400).send('You can\'t invite yourself');
	}

	if (await isNotPresent(User, friend)) {
		return res.status(404).send('User not found');
	}

	if (await isPresent(Friendship, buildPairId(username, friend))) {
		return res.status(400).send('You are already friends');
	}

	if (await isPresent(Invite, buildPairId(friend, username))) {
		return res.status(400).send('You have already been invited');
	}

	if (await isPresent(Invite, inviteId)) {
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
router.post('/invites/cancel', authenticate, async (req, res) => {
	const { username } = req;
	const { friend } = req.body;
	const inviteId = buildPairId(username, friend);

	if (await isNotPresent(Invite, inviteId)) {
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
router.post('/invites/accept', authenticate, async (req, res) => {
	const { username } = req;
	const { friend } = req.body;
	const inviteId = buildPairId(friend, username);

	if (await isNotPresent(Invite, inviteId)) {
		return res.status(400).send('Invite does not exist');
	}

	const friendship = buildRelation(username, friend);

	await Friendship.create(friendship);

	await Invite.destroy({
		where: {
			id: inviteId,
		},
	});

	return res.status(201).send('Invite accepted');
});

// deny a friend request
router.post('/invites/deny', authenticate, async (req, res) => {
	const { username } = req;
	const { friend } = req.body;
	const inviteId = buildPairId(friend, username);

	if (await isNotPresent(Invite, inviteId)) {
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
router.get('/friends', authenticate, async (req, res) => {
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
router.post('/friends/unfriend', authenticate, async (req, res) => {
	const { username } = req;
	const { friend } = req.body;
	const friendshipId = buildRelation(username, friend).id;

	if (await isNotPresent(Friendship, friendshipId)) {
		return res.status(404).send('Friend not found');
	}

	await Friendship.destroy({
		where: {
			id: friendshipId,
		},
	});

	return res.status(200).send('Removed friend');
});

module.exports = {
	friendshipRouter: router,
};
