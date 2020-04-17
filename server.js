const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const port = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname+'/index.html');
});

io.on('connection', (socket) => {
    console.log("A user connected");
    socket.on('chat', (msg) => {
        socket.broadcast.emit('chat', msg);
    });
});

http.listen(port, console.log(`App running on port ${port}`));