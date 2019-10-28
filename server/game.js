let MESSAGE_TYPE = {
    SERVER_MESSAGE: 0,
    CLIENT_CARD: 1,
    CLIENT_CHAT: 2,
    CLIENT_STATE: 3
};
let Message = require('./message').Message;
let ScopaLogic = require('./scopaLogic').ScopaLogic;
let scopaLogic = null;

class Player {
    constructor(aSocket) {
        this.socket = aSocket;
        this.id = this.id = "1" + Math.floor(Math.random() * 1000000000);
        this.playerName = 'unnamed';
        this.playerId = 'not set';
    }
}

// Raum in dem sich die Spieler befinsden.
function Room() {
    this.players = [];
}

// Person ins Spiel einloggen
Room.prototype.addPlayer = function (aPlayer) {
    let _this = this;
    _this.players.push(aPlayer);

// TODO: Spieler Registrierung --> Dann Spielinformationen senden...
    _this.sendWelcomeMessageData(aPlayer, _this);
    _this.handleOnPlayerMessage(aPlayer);

    // handle player closing
    aPlayer.socket.onclose = function () {
        console.log("A connection left.");
       // _this.removePlayer(aPlayer);
        _this.removeAllPlayer();
    }
};

// Text Nachricht senden.
Room.prototype.sendWelcomeMessageData = function (aPlayer, room) {
    let _playerDisplayName = aPlayer.id;
    if (aPlayer.name) {
        _playerDisplayName = aPlayer.name;
    }
    let message = "Wilkommen " + this.players.length + " zu Scopa. Aktuell eingeloggte Spieler: " + this.players.length;
    let _data = {
        messageType: MESSAGE_TYPE.CLIENT_CHAT,
        content: message
    };
    this.sendAll(JSON.stringify(_data));
};

// Spiel-Nachricht senden. (Karten auf Tisch/in der Hand,..)
Room.prototype.sendGameData = function (player) {
    let _message = scopaLogic.getGameStateMessage();
    this.sendAll(JSON.stringify(_message));
};

// Auf Client Nachrichten reagieren
Room.prototype.handleOnPlayerMessage = function (player) {
    let _this = this;

    // handle on message
    player.socket.on("message", function (message) {
        let _data = JSON.parse(message);

        if (_data.messageType === MESSAGE_TYPE.CLIENT_CHAT) {
            let _playerDisplayName = player.id;
            if (player.playerName) {
                _playerDisplayName = player.playerName;
            }
            let _message = new Message(MESSAGE_TYPE.CLIENT_CHAT);
            _message.content = _playerDisplayName + " : " + _data.content;

            _this.sendAll(JSON.stringify(_message));
        } else if (_data.messageType === MESSAGE_TYPE.CLIENT_CARD) {
            // Karte in der Logik verarbeiten.
            scopaLogic.processPlayerMessage(_data, _this);
        } else if (_data.messageType === MESSAGE_TYPE.CLIENT_STATE) {
            // Name und ID des Spielers setzen
            player.playerName = _data.playerName;
            player.playerId = _data.playerId;
            console.log("Spielername: " + _data.playerName + " Spieler ID" + _data.playerId);

            // TODO: Pro Spiel eine Scopa Logik (diese Verwaltet jeweil ein Duell)
            if (_this.players.length === 2) {
                scopaLogic = new ScopaLogic(_this);
                scopaLogic.startGame();
            }
        }
    });
};

// Löscht einen Spieler aus dem Spiel
Room.prototype.removePlayer = function (player) {
    // loop to find the player
    for (let i = this.players.length; i >= 0; i--) {
        if (this.players[i] === player) {
            this.players.splice(i, 1);
        }
    }

    if(this.players.length == 0){
        scopaLogic = new ScopaLogic(this);
    }
};

// Löscht einen Spieler aus dem Spiel
Room.prototype.removeAllPlayer = function () {
    if(this.players.length ==1){
        return;
    }
    // loop to find the player
    for (let i = this.players.length; i >= 0; i--) {
            this.players.splice(i, 1);
    }

    if(this.players.length == 0){
        scopaLogic = new ScopaLogic(this);
    }
};

// Nachricht an alle Spieler senden
Room.prototype.sendAll = function (message) {
    for (let i = 0, len = this.players.length; i < len; i++) {
        this.players[i].socket.send(message);
    }
};

// Nachricht an spezigischen Spieler senden
Room.prototype.sendToPlayer = function (aMessage) {

    for (let i = 0, len = this.players.length; i < len; i++) {
        if (this.players[i].playerId === aMessage.playerId) {
            this.players[i].socket.send(JSON.stringify(aMessage));
        }
    }
};

module.exports.Room = Room;
module.exports.Player = Player;