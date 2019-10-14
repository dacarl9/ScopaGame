var SERVER_MESSAGE = 0;
var CHAT_MESSAGE = 1;
var CLIENT_MESSAGE = 2;

var Message = require('./message').Message;
var ScopaLogic = require('./scopaLogic').ScopaLogic;


var scopaCards = [
    "1_1","2_1","3_1","4_1","5_1","6_1","7_1","8_1","9_1","10_1",
    "1_2","2_2","3_2","4_2","5_2","6_2","7_2","8_2","9_2","10_2",
    "1_3","2_3","3_3","4_3","5_3","6_3","7_3","8_3","9_3","10_3",
    "1_4","2_4","3_4","4_3","5_4","6_4","7_4","8_4","9_4","10_4"
];

var shuffledCards = [];

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

    scopaLogic = new ScopaLogic();
    scopaLogic.startGame();

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
Room.prototype.sendMessageData = function(user, room) {
    var _userDisplayName = user.id;
    if(user.name){
        _userDisplayName = user.name;
    }
    var message = "Wilkommen " + _userDisplayName+ " zu Scopa. Aktuell eingeloggte Spieler: " + room.users.length;
    var _data = {
        messageType: CHAT_MESSAGE,
        content: message
    };
    room.sendAll(JSON.stringify(_data));
};

Room.prototype.sendGameData = function(user, room) {
    var _message = scopaLogic.getGameStateMessage();

    var _gameData = {
        messageType: SERVER_MESSAGE,
        tableCards: _message.tableCards,
        handCards: _message.playerCards
    };

    room.sendAll(JSON.stringify(_gameData));
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

            var _message = new Message(CHAT_MESSAGE);
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