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

io.on('connect', (socket) => {
	const { id } = socket.handshake.query;
	console.log(`${id} connected`);
	socket.join(id);

	socket.on('send-message', (data) => {
		const { sender } = data;
		const { message } = data;

		io.emit('receive-message', `${sender} said : ${message}`);
		console.log(`${sender} said : ${message}`);
	});

	socket.on('disconnect', () => console.log(`${id} left`));
});

// init
const port = process.env.PORT || 4000;
server.listen(port, () => connect());
