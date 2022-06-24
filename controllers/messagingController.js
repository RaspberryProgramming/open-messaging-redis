const express = require('express');
const { createClient } = require('redis');
const router = express.Router();

class PublicMessage {
    message = "";
    user = "";
    timestamp = "";

    constructor(message, user) {
        this.message = message;
        this.user = user;
        this.timestamp = new Date().toUTCString();
    }
}

class UserMessage extends PublicMessage {
    sendTo = "";
    constructor(message, user, sendTo) {
        super(message, user);

        this.sendTo = sendTo;
    }
}

const client = createClient();

client.on('error', err => console.err('Redis Client Error', err));

client.connect();

router.get('/test', (req, res)=>{
    res.send("Works");
});

router.get('/latestPublic', (req, res)=>{

    client.EXISTS('public').then(result=>{
        
        if (result === 1) {
            client.lRange('public', 0, 20).then(result=>{
                res.send(result);
            }).catch(e=>console.warn(e))
        } else {
            res.send([]);
        }
    })
});

router.post('/messagePublic', (req, res) => {
    if (req.body.message && req.body.user) {
        let message = new PublicMessage(req.body.message, req.body.user);

        client.LPUSH('public', JSON.stringify(message)).then(()=>{
            res.send("Ok");
        }).catch(e=>{
            console.warn(`Redis Error: ${e}`);
            res.send("Database Error");
        });
    } else {
        res.send("Invalid Message");
    }

    res.send("Unknown Error");
});

router.get('/latestUser', (req, res)=>{
    if (req.body.user) {
        let key = `${req.body.user}_messages`;

        client.EXISTS('public').then(result=>{
            
            if (result === 1) {
                client.lRange(`${req.body.user}_messages`, 0, 20).then(result=>{
                    res.send(result);
                }).catch(e=>{
                    console.warn(`Redis Error: ${e}`);
                    res.send("Database Error");
                });
            } else {
                res.send([]);
            }
        });
    } else {
        res.send("Missing User");
    }
});

router.post('/messageUser', (req, res)=>{
    if (req.body.message && req.body.user && req.body.sendTo) {
        let key = `${req.body.sendTo}_messages`;

        let message = new UserMessage(req.body.message, req.body.user, req.body.sendTo);

        client.LPUSH(key, JSON.stringify(message)).then(()=>{
            res.send("Ok");
        }).catch(e=>{
            console.warn(`Redis Error: ${e}`);
            res.send("Database Error");
        });
    } else {
        res.send("Invalid Message");
    }
});

module.exports = router;