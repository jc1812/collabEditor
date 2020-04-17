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

// This class holds our editors data structure. It stores the CRDT chars,
// recieves them from across the network and inserts them into ace editor.
class CRDT {
    constructor(id) {
        this.siteId = id;
        this.struct = []; //Stores the characters
    }

    localInsert(value, index) {
        const char = this.generateChar(value, index);
        this.struct.splice(index, 0, char);
        console.log(this.struct);
        return char;
    }

    generateChar(char, index) {
        let before = this.struct[index-1] ?  this.struct[index-1].pos : 0;
        let pos;

        if(this.struct[index]) {
            let after = this.struct[index].pos;
            pos = before + ((after - before)/2);
        } else {
            let after = 1;
            pos = Math.floor(before)+after;
        }

        let newChar = new CRDTChar(char, pos, this.siteId);

        return newChar;
    }

    localDelete(index) {
        let char = this.struct.splice(index, 1)[0];
        console.log(this.struct);
        return char;
    }
}

class CRDTChar {
    constructor(char, pos, siteId) {
        this.pos = pos; // Number between 0 and 1
        this.char = char;
        this.siteId = siteId;
    }
}

let crdt = new CRDT(1);

// This function translates editor input into our CRDT data structure.
// It also sends the instruction across the network.
editor.session.on('change', (e) => {
    if(editor.curOp && editor.curOp.command.name) {
        let lines = editor.session.getLines(0, editor.session.getLength());
        let length = 0;
        for(let i=0; i<e.start.row; i++) {
            length += lines[i].length;
            if(i < lines.length-1) length += 1; //for new line character
        }
        length += e.start.column; 
        if(e.action === "insert") {
            let char = crdt.localInsert(e.lines.join("\n"), length);
        }
        if(e.action === "remove") {
            let char = crdt.localDelete(length);
        }
    }
});