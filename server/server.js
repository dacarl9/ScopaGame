// Settings
var port = 8000;

// Server code
var WebSocketServer = require('ws').Server;
var server = new WebSocketServer({ port: port });

var Room = require('./game').Room;
var Player = require('./game').Player;
var room = new Room();

// Server welcher Tische mit Spielern befüllt sobald 2 Spieler eingeloggt sind, kann ein Spiel gestartet werden
server.on('connection', function(socket) {
    var player = new Player(socket);
    room.addPlayer(player);
    console.log("A connection established");
});

console.log("WebSocket server is running.");
console.log("Listening to port " + port + ".");
