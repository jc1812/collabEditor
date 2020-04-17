let editor = ace.edit("editor");
editor.setTheme("ace/theme/dracula");
editor.session.setMode("ace/mode/javascript");

let socket = io();

let crdt;

socket.on('setup', (id) => {
    crdt = new CRDT(id);
    name.value = name.value+'-'+id;
});

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

    remoteInsert(char) {
        let index = this.findCharIndex(char);
        if(index === this.struct.length) {
            this.struct.push(char);
        } else {
            this.struct.splice(index, 0, char);
        }

        return { char: char.char, index: index };
    }

    remoteDelete(char) {
        let index = this.findDeletePos(char);
        if(index !== null) {
            this.struct.splice(index, 1);
        }

        return { char: char.char, index: index };
    }

    // Translate CRDT pos into an array index to delete the char from this.struct
    findDeletePos(char) {
        let index = null;
        for(let i=0; i<this.struct.length; i++) {
            if(char.pos === this.struct[i].pos && 
                char.siteId === this.struct[i].siteId) {
                    index = i;
                    break;
            }
        }
        return index;
    }

    // Translate CRDT pos into an array index to insert the char into this.struct
    findCharIndex(char) {
        if(this.struct.length > 0) {
            if(char.pos < this.struct[0].pos) return 0;
            if(char.pos > this.struct[this.struct.length-1].pos) return this.struct.length;
            for(let i=0; i<this.struct.length-1; i++) {
                if(char.pos === this.struct[i].pos) {
                    if(char.siteId < this.siteId) {
                        return i;
                    } else {
                        return i+1;
                    }
                }
                if(char.pos > this.struct[i].pos) {
                    if(char.pos < this.struct[i+1].pos) {
                        return i+1;
                    }
                }
            }
        }
        return 0;
    }

}

class CRDTChar {
    constructor(char, pos, siteId) {
        this.pos = pos; // Number between 0 and 1
        this.char = char;
        this.siteId = siteId;
    }
}

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
            socket.emit('remoteInsert', { char: char });
        }
        if(e.action === "remove") {
            let char = crdt.localDelete(length);
            socket.emit('remoteDelete', { char: char });
        }
    }
});

socket.on('remoteInsert', (msg) => {
    let char = crdt.remoteInsert(msg.char);
    let pos = getPos(char);
    console.log(pos);
    editor.session.insert(pos, char.char);
});

socket.on('remoteDelete', (msg) => {
    let char = crdt.remoteDelete(msg.char);
    let pos = getPos(char);
    let range;
    if(char.char == "\n") {
        range = new ace.Range(pos.row, pos.column, pos.row+1, 0);
    } else {
        range = new ace.Range(pos.row, pos.column, pos.row, pos.column+1);
    }
    editor.session.remove(range);
});

// Translate an array index for the character position into ace's row, col pos.
function getPos(char) {
    let lines = editor.session.getLines(0, editor.session.getLength());
    let length = 0;
    let pos = { row: 0, column: 0 };
    loopExit:
    for(let i=0; i<lines.length; i++) {
        for(let j=1; j<=lines[i].length; j++) {
            if(length == char.index) break loopExit;
            pos.column = j;
            length++;
        }
        if(length == char.index) break;
        length++;
        pos.row++;
        pos.column = 0;
    }
    return pos;
}