require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const socketio = require('socket.io');

const { connect } = require('./db');

/* routers */
const { authRouter } = require('./auth');
const { userRouter } = require('./routes/userRoutes');
const { friendshipRouter } = require('./routes/friendshipRoutes');
const { messagingRouter } = require('./routes/messagingRoutes');

const Message = require('./models/message');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.json());
app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));

/* Authentication routes */
app.use(authRouter);

/* User related routes */
app.use('/users', userRouter);

/* Friendship related routes */
app.use(friendshipRouter);

/* Messaging related routes */
app.use('/conversations', messagingRouter);

const createMessage = async (message) => {
	await Message.create(message);
};

io.on('connect', (socket) => {
	const { username } = socket.handshake.query;

	console.log(`${username} connected`);
	socket.join(username);

	socket.on('send-message', (m) => {
		createMessage(m);
		// io.emit('receive-message', `${m.sender} said : ${m.text} to ${m.friend}`);
	});

	socket.on('disconnect', () => console.log(`${username} left`));
});

// init
const port = process.env.PORT || 4000;
server.listen(port, () => connect());
