// Object classes that store messages
class PublicMessage {
    /**
     * PublicMessage - public message that is sent to all users
     */

    message;
    user;
    timestamp;
    key;
    redisClient;

    constructor(message, user, redisClient) {
        this.message = message;
        this.user = user;
        this.timestamp = new Date().toUTCString();
        this.key = 'public';
        this.redisClient = redisClient;
    }

    // Reconstructing message from redis
    reconstruct (jsonString, redisClient) {
        let tmpMessage = JSON.parse(jsonString);
        let timestamp = tmpMessage.timestamp;

        tmpMessage = new this.constructor(tmpMessage.message, tmpMessage.user, redisClient);

        tmpMessage.timestamp = timestamp;

        return tmpMessage;
    }

    redisSubmit(success=()=>{}, failure=()=>{}) {

        this.redisClient.LPUSH(this.key, JSON.stringify(this)).then(()=>{
            success("Ok")
        }).catch(e=>{
            console.warn(`Redis Error: ${e}`);
            failure("Database Failure")
        });
    }
}

class UserMessage extends PublicMessage {
    /**
     * UserMessage - extension of PublicMessage that is used to send to all users.
     */

    sendTo = ""; // Destined user

    constructor(message, user, sendTo, redisClient) {
        super(message, user, redisClient);

        this.key = `${this.user}_messages`;
        //super.key = this.key;

        this.sendTo = sendTo;
    }

    // Reconstructing message from redis
    reconstruct(jsonString, redisClient) {
        let tmpMessage = JSON.parse(jsonString);
        
        let timestamp = tmpMessage.timestamp;

        tmpMessage = new this.constructor(tmpMessage.message, tmpMessage.user, tmpMessage.sendTo, redisClient);
        tmpMessage.timestamp = timestamp;
        
        return tmpMessage;
    }

}

module.exports = {PublicMessage, UserMessage};