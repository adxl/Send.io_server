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
const { messagingRouter } = require('./routes/messagingRoutes');

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

/* Messaging related routes */
app.use('/conversations', messagingRouter);

// init
const port = process.env.PORT || 4000;
http.listen(port, () => db.connect());
