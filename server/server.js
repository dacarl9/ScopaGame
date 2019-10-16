// Settings
var port = 8000;

// Server code
var WebSocketServer = require('ws').Server;
var server = new WebSocketServer({ port: port });

var User = require('./game').User;
var Room = require('./game').Room;
var room1 = new Room();

// Server welcher Tische mit Spielern befüllt sobald 2 Spieler eingeloggt sind, kann ein Spiel gestartet werden
server.on('connection', function(socket) {
    var user = new User(socket);
    user.setName('TestName')
    room1.addUser(user);
    console.log("A connection established");
});

console.log("WebSocket server is running.");
console.log("Listening to port " + port + ".");