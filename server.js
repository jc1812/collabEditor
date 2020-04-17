const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const port = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname+'/index.html');
});

let userCount = 0;

io.on('connection', (socket) => {
    console.log("A user connected");
    socket.emit('setup', userCount++);
    socket.on('chat', (msg) => {
        socket.broadcast.emit('chat', msg);
    });
    socket.on('remoteInsert', (msg) => {
        socket.broadcast.emit('remoteInsert', msg);
    });
    socket.on('remoteDelete', (msg) => {
        socket.broadcast.emit('remoteDelete', msg);
    });
});

http.listen(port, console.log(`App running on port ${port}`));