let editor = ace.edit("editor");
editor.setTheme("ace/theme/dracula");
editor.session.setMode("ace/mode/javascript");

let socket = io();

let name = document.getElementById('name');
let color = document.getElementById('chatColor');
let msg = document.getElementById('msg');
let send = document.getElementById('send');
let chat = document.getElementById('chat');

send.addEventListener('click', (e) => {
    e.preventDefault();
    let messageText = msg.value;
    let userName = name.value;

    printMessage(messageText, color.value, userName);

    chat.scrollTop = chat.scrollHeight;

    msg.value = "";

    socket.emit('chat', { messageText: messageText, userName: userName, userColor: color.value });
});

socket.on('chat', (msg) => {
    printMessage(msg.messageText, msg.userColor, msg.userName);
});

function printMessage(messageText, userColor, userName) {
    let message = document.createElement('p');
    let text = document.createTextNode(`${messageText}`);

    // Create a span for the users handle
    let handle = document.createElement('span');
    handle.setAttribute('style', `color: ${userColor}`);
    let handleText = document.createTextNode(`${userName}:  `);
    handle.appendChild(handleText);

    message.appendChild(handle);
    message.appendChild(text);
    chat.appendChild(message);
}