const express = require('express');

const router = express.Router();

const { authenticate } = require('../auth');
const { isPresent, isNotPresent, buildPairId } = require('../db');

const User = require('../models/user');
const Friendship = require('../models/friendship');
const Invite = require('../models/invite');

// get list of users
router.get('', async (req, res) => {
	const users = await User.findAll();
	return res.status(200).json(users);
});

// get current user (from token)
router.get('/me', authenticate, async (req, res) => {
	const { username } = req;
	return res.status(200).json({ username });
});

// get public user
router.get('/:x', authenticate, async (req, res) => {
	const { username } = req;
	const { x } = req.params;

	if (await isNotPresent(User, x)) {
		return res.status(404).send('User not found');
	}

	const user = await User.findByPk(x);
	const isFriend = await isPresent(Friendship, buildPairId(username, x));
	const isRequested = await isPresent(Invite, buildPairId(username, x));
	const isInvitedBy = await isPresent(Invite, buildPairId(x, username));
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

module.exports = { userRouter: router };
