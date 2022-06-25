// Imports
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const router = express.Router();
const socketio = require('socket.io');

// Const variables
const app = express();
const port = 40412; // Api port

// Socket.io
const server = http.createServer(app);

const io = socketio(server,{
    cors: {
        origin: `http://localhost`,
        methods: ["GET", "POST"]
      }
});

server.listen(port);

io.on("connection", require('./messagingSocket'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.use('/api/messaging', require('./controllers/messagingController'));
