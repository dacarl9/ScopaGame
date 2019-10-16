var MESSAGE_TYPE = {
    SERVER_MESSAGE: 0,
    CHAT_MESSAGE: 1,
    CLIENT_MESSAGE: 2
};
var Message = require('./message').Message;
var ScopaLogic = require('./scopaLogic').ScopaLogic;
var scopaLogic = null;


function User(socket) {
    this.socket = socket;
    // assign a random number to User. Long enough to make duplication chance less.
    this.id = "1" + Math.floor( Math.random() * 1000000000);
}
User.prototype.setName = function (name) {
    this.name = name;
}


function Room() {
    this.users = [];
}

// Person ins Spiel einloggen
Room.prototype.addUser = function(user){
    this.users.push(user);
    var room = this;

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
    var _userDisplayName = user.id;
    if(user.name){
        _userDisplayName = user.name;
    }
    var message = "Wilkommen " + _userDisplayName+ " zu Scopa. Aktuell eingeloggte Spieler: " + room.users.length;
    var _data = {
        messageType: MESSAGE_TYPE.CHAT_MESSAGE,
        content: message
    };
    room.sendAll(JSON.stringify(_data));
};

// Spiel-Nachricht senden. (Karten auf Tisch/in der Hand,..)
Room.prototype.sendGameData = function(user, room) {
    var _message = scopaLogic.getGameStateMessage();
    room.sendAll(JSON.stringify(_message));
};

// Auf Client Nachrichten reagieren
Room.prototype.handleOnUserMessage = function(user) {
    var room = this;

    // handle on message
    user.socket.on("message", function(message){
        var _data = JSON.parse(message);

        if(_data.messageType === 1){
            var _userDisplayName = user.id;
            if(user.name){
                _userDisplayName = user.name;
            }

            var _content = _userDisplayName + " : " + _data.content;

            var _message = new Message(MESSAGE_TYPE.CHAT_MESSAGE);
            _message.content = _content;

            room.sendAll(JSON.stringify(_message));
        }else{
            console.log("Raum"+room);
            scopaLogic.processPlayerMessage(_data,room);
            console.log("charteli"+_data.content);
            console.log("Raum"+room);
        }
    });
};

// Löscht einen Spieler aus dem Spiel
Room.prototype.removeUser = function(user) {
    // loop to find the user
    for (var i=this.users.length; i >= 0; i--) {
        if (this.users[i] === user) {
            this.users.splice(i, 1);
        }
    }
};

// Nachricht an alle Spieler Senden
Room.prototype.sendAll = function(message) {
    for (var i=0, len=this.users.length; i<len; i++) {
        this.users[i].socket.send(message);
    }
};

module.exports.User = User;
module.exports.Room = Room;