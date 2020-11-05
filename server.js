require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { connect } = require('./db');

/* routers */
const { authRouter } = require('./auth');
const { userRouter } = require('./routes/userRoutes');
const { friendshipRouter } = require('./routes/friendshipRoutes');
const { messagingRouter } = require('./routes/messagingRoutes');

const app = express();

app.use(cors());
app.use(express.json());

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
app.listen(port, () => connect());
