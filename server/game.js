let MESSAGE_TYPE = {
    SERVER_MESSAGE: 0,
    CLIENT_CARD: 1,
    CLIENT_CHAT: 2,
    CLIENT_STATE: 3
};
let Message = require('./message').Message;
let ScopaLogic = require('./scopaLogic').ScopaLogic;
let scopaLogic = null;


function User(socket) {
    this.socket = socket;
    // assign a random number to User. Long enough to make duplication chance less.
    this.id = "1" + Math.floor( Math.random() * 1000000000);
}

// Name des Spielers setzten.
User.prototype.setName = function (name) {
    this.name = name;
};

// ID des Spielers setzten
User.prototype.setId = function (aId) {
    this.id = aId;
};


function Room() {
    this.users = [];
}

// Person ins Spiel einloggen
Room.prototype.addUser = function(user){
    this.users.push(user);
    let room = this;

    // TODO: Pro Spiel eine Scopa Logik (diese Verwaltet jeweil ein Duell)
    scopaLogic = new ScopaLogic();
    scopaLogic.startGame();

    // TODO: Spieler Registrierung --> Dann Spielinformationen senden...
    this.sendMessageData(user, room);
    this.sendGameData(user, room);
    this.handleOnUserMessage(user);

    // handle user closing
    user.socket.onclose = function(){
        console.log("A connection left.");
        scopaLogic = new ScopaLogic();
        room.removeUser(user);
    }
};

// Text Nahricht senden.
Room.prototype.sendMessageData = function(user, room) {
    let _userDisplayName = user.id;
    if(user.name){
        _userDisplayName = user.name;
    }
    let message = "Wilkommen " + _userDisplayName+ " zu Scopa. Aktuell eingeloggte Spieler: " + room.users.length;
    let _data = {
        messageType: MESSAGE_TYPE.CLIENT_CHAT,
        content: message
    };
    room.sendAll(JSON.stringify(_data));
};

// Spiel-Nachricht senden. (Karten auf Tisch/in der Hand,..)
Room.prototype.sendGameData = function(user, room) {
    let _message = scopaLogic.getGameStateMessage();
    room.sendAll(JSON.stringify(_message));
};

// Auf Client Nachrichten reagieren
Room.prototype.handleOnUserMessage = function(user) {
    let room = this;

    // handle on message
    user.socket.on("message", function(message){
        let _data = JSON.parse(message);

        console.log("message Type: " + _data.messageType);

        if(_data.messageType === MESSAGE_TYPE.CLIENT_CHAT){
            let _userDisplayName = user.id;
            if(user.name){
                _userDisplayName = user.name;
            }

            console.log("username:" +_userDisplayName)
            let _message = new Message(MESSAGE_TYPE.CLIENT_CHAT);
            _message.content = _userDisplayName + " : " + _data.content;

            room.sendAll(JSON.stringify(_message));
        }else if(_data.messageType === MESSAGE_TYPE.CLIENT_CARD){
            console.log("messge id "+ _data.messageType);
            scopaLogic.processPlayerMessage(_data,room);
            console.log("charteli: "+_data.content);
        }else if(_data.messageType === MESSAGE_TYPE.CLIENT_STATE){
            user.setName(_data.playerName);
            user.setId(_data.playerId);
        }
    });
};

// Löscht einen Spieler aus dem Spiel
Room.prototype.removeUser = function(user) {
    // loop to find the user
    for (let i=this.users.length; i >= 0; i--) {
        if (this.users[i] === user) {
            this.users.splice(i, 1);
        }
    }
};

// Nachricht an alle Spieler senden
Room.prototype.sendAll = function(message) {
    for (let i=0, len=this.users.length; i<len; i++) {
        this.users[i].socket.send(message);
    }
};

// Nachricht an spezigischen Spieler senden
Room.prototype.sendToUser = function(message, aUserId) {
    for (let i=0, len=this.users.length; i<len; i++) {
        if(this.users[i].playerId === aUserId){
            this.users[i].socket.send(message);
        }
    }
};

module.exports.User = User;
module.exports.Room = Room;