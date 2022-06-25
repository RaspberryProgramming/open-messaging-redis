const { createClient } = require('redis');
const { PublicMessage, UserMessage } = require('./messages');

// Redis Client
const client = createClient();

client.on('error', err => console.err('Redis Client Error', err));

client.connect();

const onlineUsers = []; // Used to store users that are online

function socketio(socket) {
    let username;

    socket.on('login', arg=>{
        // Check that user value was sent back, and that the user isn't already logged in
        if (arg.user && onlineUsers.filter(v=>v.user === arg.user).length === 0) {

            username = arg.user;
            
            onlineUsers.push({"user": arg.user, "socket": socket});

            socket.emit('login-success', {"online": onlineUsers.map(v=>v.user)});

        } else {

            socket.emit('error', 'login failure');

        }
    });

    socket.on('publicMessage', arg=>{
        if (username && arg.message && arg.user) {

            let message = new PublicMessage(arg.message, arg.user);



            io.emit('publicMessage', message);

            message.redisSubmit(
                (result)=>{console.log('Public Message: ', result)},
                (result)=>{console.err('Public Message: ', result)});
            
        } else {
            if (!username) {
                socket.emit('error', 'Client Not Logged In');

                console.err('Client Not Logged In');
            } else {
                socket.emit('error', 'Invalid userMessage');

                console.err(`User ${username} sent an invalid userMessage`);
            }
        }
    })

    socket.on('userMessage', arg=>{
        if (username && arg.message && arg.user && arg.sendTo) {
            let message = new UserMessage(arg.message, arg.user, arg.sendTo);

            let recipient = onlineUsers.filter(v=>v.user === arg.user);

            if (recipient.length === 1) {

                recipient = recipient[0];

                recipient.socket.emit('userMessage', message);

                message.redisSubmit(
                    (result)=>{console.log('User Message: ', result)},
                    (result)=>{console.err('User Message: ', result)});

            } else {
                console.err('Two Users with the same username are logged in: ', arg.user);
            }
        } else {
            if (!username) {
                socket.emit('error', 'Client Not Logged In');

                console.err('Client Not Logged In');
            } else {
                socket.emit('error', 'Invalid userMessage');

                console.err(`User ${username} sent an invalid userMessage`);
            }
        }
    });

    socket.on("disconnect", ()=>{
        if (username) {
            io.emit("user-disconnect", {"user": username});
            onlineUsers = onlineUsers.filter(v=>v.user!==username); // Remove user from onlineUsers
        }
    })
};

module.exports = socketio;