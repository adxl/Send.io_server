require('dotenv').config();

const express = require('express');
const app = express();
app.use(express.json());

const db = require('./db');
const user = require('./models/user');

// dev
console.clear();

db.connect();

// app.get('/', (req, res) => {
//   return res.status(200).send('Send.io')
// })

// port config
const port = process.env.PORT || 4000;

app.listen(port, () => console.log(port));
