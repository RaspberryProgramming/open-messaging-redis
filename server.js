const express = require('express');
const bodyParser = require('body-parser');

const app = express();

const port = 40412; // Api port

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.use('/api/messaging', require('./controllers/messagingController'));

app.get('/', (req, res) => {
    res.send('Hello, This is an API. Please connect using a supported client.');
});

app.listen(port, () => {
    console.log(`Server Started on Port ${port}`);
});