const { createClient } = require('redis');
const { PublicMessage, UserMessage } = require('./messages');

// Redis Client
const client = createClient();

client.on('error', err => console.error('Redis Client Error', err));

client.connect();

let onlineUsers = []; // Used to store users that are online

function isOnline (socketId) {
    return onlineUsers.filter(v=>v.socket.id === socketId).length === 0;
}

function getUsername(socketId) {
    if (isOnline(socketId)){
        return onlineUsers.filter(v=>v.socket.id === socketId)[0];
    } else {
        return null;
    }
}

function socketio(socket) {
    console.log(socket.conn.remoteAddress);
    
    let username = null;

    socket.on('login', arg=>{
        
        // Check that user value was sent back, and that the user isn't already logged in
        if (!username && arg.user) {

            username = arg.user;
            
            onlineUsers.push({"user": arg.user, "socket": socket});

            socket.emit('login-success', {"online": [...onlineUsers.map(v=>v.user)]});

            socket.broadcast.emit('new-login', {"user": username});
            socket.broadcast.emit('new-login', {"user": username});

            console.log(`${username} Logged In`)

        } else {

            socket.emit('error', 'login failure');

        }
    });

    socket.on('publicMessage', (arg)=>{

        if (username && arg.message && arg.user) {

            let message = new PublicMessage(arg.message, arg.user, client);

            socket.broadcast.emit('publicMessage', message);
            socket.emit('publicMessage', message);

            message.redisSubmit(
                (result)=>{console.log('Public Message: ', result)},
                (result)=>{console.error('Public Message: ', result)});

        } else {
            if (!username) {
                socket.emit('error', 'Client Not Logged In');

                console.error('Client Not Logged In');
            } else {
                socket.emit('error', 'Invalid userMessage');

                console.error(`User ${getUsername(socket.id)} sent an invalid userMessage`);
            }
        }
    })

    socket.on('userMessage', arg=>{
        if (username && arg.message && arg.user && arg.sendTo) {
            let message = new UserMessage(arg.message, arg.user, arg.sendTo, client);

            let recipient = onlineUsers.filter(v=>v.user === arg.user);

            if (recipient.length === 1) {

                recipient = recipient[0];

                recipient.socket.emit('userMessage', message);

                message.redisSubmit(
                    (result)=>{console.log('User Message: ', result)},
                    (result)=>{console.error('User Message: ', result)});

            } else {
                console.error('Two Users with the same username are logged in: ', arg.user);
            }
        } else {
            if (!username) {
                socket.emit('error', 'Client Not Logged In');

                console.error('Client Not Logged In');
            } else {
                socket.emit('error', 'Invalid userMessage');

                console.error(`User ${getUsername(socket.id)} sent an invalid userMessage`);
            }
        }
    });

    socket.on("disconnect", ()=>{
        if (username) {
            socket.broadcast.emit("user-disconnect", {"user": username});
            
            onlineUsers = onlineUsers.filter(v=>v.user!==username); // Remove user from onlineUsers

            console.log(`${username} Logged Out`);
        }
    })
    
};

module.exports = socketio;