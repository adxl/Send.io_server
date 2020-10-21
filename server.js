require('dotenv').config()

const express = require('express')
const app = express()
app.use(express.json())

const { Sequelize } = require('sequelize')
const sequelize = new Sequelize(process.env.PG_URL)

const initdb = async () => {
  try {
    await sequelize.authenticate()
    console.log('Connection OK')
  } catch (error) {
    console.error('ERROR', error)
  }
}

// app.get('/', (req, res) => {
//   return res.status(200).send('Send.io')
// })

// port config
const port = process.env.PORT || 4000
console.clear()

initdb()

app.listen(port, () => console.log(port))
