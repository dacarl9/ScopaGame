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
User.prototype.setPlayerId = function (aPlayerId) {
    this.playerId = aPlayerId;
};

// Raum in dem sich die Spieler befinden.
function Room() {
    this.users = [];
}

// Person ins Spiel einloggen
Room.prototype.addUser = function(user){
    this.users.push(user);
    let room = this;

// TODO: Spieler Registrierung --> Dann Spielinformationen senden...
    this.sendWelcomeMessageData(user, room);
    this.handleOnUserMessage(user);

    // TODO: Pro Spiel eine Scopa Logik (diese Verwaltet jeweil ein Duell)
    if(this.users.length ===2){
        scopaLogic = new ScopaLogic(room);
        scopaLogic.startGame();
    }

    // handle user closing
    user.socket.onclose = function(){
        console.log("A connection left.");
        scopaLogic = new scopaLogic();//TODO: was machen?
        room.removeUser(user);
    }
};

// Text Nachricht senden.
Room.prototype.sendWelcomeMessageData = function(user, room) {
    let _userDisplayName = user.id;
    if(user.name){
        _userDisplayName = user.name;
    }

    console.log("PLAYER ID : "+user.playerId);
    let message = "Wilkommen " + room.users.length+ " zu Scopa. Aktuell eingeloggte Spieler: " + room.users.length;
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
            // Name und ID des Spielers setzen
            user.setName(_data.playerName);
            user.setPlayerId(_data.playerId);
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
Room.prototype.sendToUser = function(aMessage) {
    for (let i=0, len=this.users.length; i<len; i++) {
        if(this.users[i].playerId === aMessage.playerId){
            this.users[i].socket.send(aMessage);
        }
    }
};

module.exports.User = User;
module.exports.Room = Room;