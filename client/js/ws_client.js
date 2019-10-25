let websocket = null;

const MESSAGE_TYPE = {
    SERVER_MESSAGE: 0,
    CLIENT_CARD: 1,
    CLIENT_CHAT: 2,
    CLIENT_STATE: 3
};

let tableCardArray = [];
let handCardArray = [];
let isGameStart = true;
let lastPlayedCard = "";
let playerName = "";
let playerId = 'client not set';
let startDate = new Date();
let endDate = new Date();
let roundNumber = 1;

$(function () {
    //TODO: Nach Deployment wieder einfügen
    // $("#formPlayerName" ).submit(function( event ) {
    //     startScopa()
    //     event.preventDefault();
    // });

    //TODO: Test1
    startScopa();
});

// Spiel
function startScopa() {
    $("#login").hide();
    $("#chat-widnow").css("display", "block");

    // Gleich zu Beginn die ID des Spielers setzen und speichern.
    playerId = create_UUID();
    playerName = $("#userName").val()!='' ?$("#userName").val():'unnamed';
    // Rendern des Chatfensters
    renderChatBox();
    websocket = {};

    // Überprüft auf Existenz von "WebSeockets" im Browser.
    if (window["WebSocket"]) {
        websocket.socket = new WebSocket("ws://127.0.0.1:8000");

        // Verbindungsaufbau. Client meldet seine ID und seinen Namen.
        websocket.socket.onopen = function (e) {
            console.log('WebSocket Verbindung aufgebaut.');
            let _data = {
                messageType: MESSAGE_TYPE.CLIENT_STATE,
                playerId:  playerId,
                playerName: playerName
            };
            websocket.socket.send(JSON.stringify(_data));
        };

        // on message event
        websocket.socket.onmessage = function (e) {
            let _data = JSON.parse(e.data);

            if (_data.messageType === MESSAGE_TYPE.SERVER_MESSAGE) {
                // Spiel Informations-Nachricht
                handleGameAction(_data);
            } else {
                // Chat Nachricht
                handleChatMessage(_data);
            }
        };

        //on close event
        websocket.socket.onclose = function (e) {
            console.log('WebSocket connection closed');
        };
    }
    $("#send").click(sendChatMessage);

    $("#chat-input").keypress(function (event) {
        if (event.keyCode == '13') {
            sendChatMessage();
        }
    });
}

function sendChatMessage(aType, aContent) {
    let message = $("#chat-input").val();
    console.log("chatfenster Message "+playerId+"  "+message)
    let _data = {
        messageType: MESSAGE_TYPE.CLIENT_CHAT,
        playerId: playerId,
        content: message
    };
    websocket.socket.send(JSON.stringify(_data));
    $("#chat-input").val("");
}

// Gibt eine Random Zahl zwischen min un max zurück.
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Chat-Box Funktionalität anpassen
function renderChatBox() {
    // Button deaktivieren
    $("#chat-form").submit(function (e) {
        e.preventDefault();
    });

    $("#title-button").click(function () {
        if ($(this).html() == "-") {
            $(this).html("+");
        } else {
            $(this).html("-");
        }
        $("#chat-box").slideToggle();
    });
}

// Chat-Nachricht
function handleChatMessage(aData) {
    // Chat Nachricht zum Verlauf hinzufügen
    let textarea = document.getElementById('chat-history');
    textarea.append(aData.content + '\n');

    // Inhalt nach unten scrollen
    textarea.scrollTop = textarea.scrollHeight;
}

// Spiel Daten vom Server verarbeiten
function handleGameAction(aData) {
    if (isGameStart) {

        this.tableCardArray = aData.tableCards;
        this.handCardArray = aData.playerCards;

        console.log("tablecards received:"+this.tableCardArray)
        console.log("tablecards received:"+this.handCardArray)

        for (let i = 0; i < this.tableCardArray.length; i++) {
            let _card = this.tableCardArray[i];
            let _cardNumber = _card.toString().split("_")[0];
            let _cardType = _card.toString().split("_")[1];
            addCardToTable(_cardNumber, _cardType);
        }
        for (let i = 0; i < this.handCardArray.length; i++) {
            let _card = this.handCardArray [i];
            let _cardNumber = _card.toString().split("_")[0];
            let _cardType = _card.toString().split("_")[1];
            addCardToHand(_cardNumber, _cardType);
        }
        isGameStart = false;
    } else {
        handleTableCardFromMessage(aData.tableCards, aData.playerCards);
    }
}

// Erhaltene Karten auf dem Tisch handeln.
function handleTableCardFromMessage(aArrivedCards) {

    // SCOPA !!!
    if(aArrivedCards.length === 0){
        scopaNotification();
    }


    // Welche fehlen in B
    let _cardsToRemove = [];

    for (let i = this.tableCardArray.length; i--;) {
        if (aArrivedCards.indexOf(this.tableCardArray[i]) === -1) {
            _cardsToRemove.push(this.tableCardArray[i]);
        }
    }

    if (_cardsToRemove.length > 0) {
        for (let _card in _cardsToRemove) {
            removeCard(_cardsToRemove[_card]);
        }
        // gespielte Karte löschen.
        removeCard(lastPlayedCard);
    } else {
        let _is10 = lastPlayedCard.length ===3;

        // Karte aus Hnad löschen
        let _lastCardNumber = _is10 ?lastPlayedCard.charAt(0):lastPlayedCard.charAt(0)+lastPlayedCard.charAt(1);
        let _lastCardType = _is10? lastPlayedCard.charAt(2): lastPlayedCard.charAt(3);

        removeCard(lastPlayedCard); //
        addCardToTable(_lastCardNumber, _lastCardType);
    }
    this.tableCardArray = aArrivedCards;
}

// Karte zum Tisch hinzufügen
function addCardToTable(aCardNumber, aCardType) {
    let _newId = 'card_' + aCardNumber + '_' + aCardType;
    $("#table").append('<div id="' + _newId + '" class="table_card"></div>');
    $("#" + _newId).css('background', 'url("images/cards/' + aCardNumber + '.' + aCardType + '.png")');
    $("#" + _newId).css('background-size', 'contain');
    $("#" + _newId).css('background-color', 'white');
    $("#" + _newId).css('background-repeat', 'no-repeat');
    $("#" + _newId).css({'transform': 'rotate(' + getRandomInt(-17, +17) + 'deg)'});
}

// Karte vom Spieler hinzufügen
function addCardToHand(aCardNumber, aCardType) {
    let _newId = 'card_' + aCardNumber + '_' + aCardType;
    $("#hand").append('<div id="' + _newId + '" class="card" ></div>');
    $("#" + _newId).css('background', 'url("images/cards/' + aCardNumber + '.' + aCardType + '.png")');
    $("#" + _newId).css('background-size', 'contain');
    $("#" + _newId).css('background-color', 'white');
    $("#" + _newId).css('background-repeat', 'no-repeat');
    $("#" + _newId).click(function () {
        selectedCard(_newId);
    });
}

// Klick auf Karte
function selectedCard(id) {
    console.log("selectedCard: " + id.toString());

    let _imageId = id.replace('card_', '');
    lastPlayedCard = _imageId;
    let _data = {
        messageType: MESSAGE_TYPE.CLIENT_CARD,
        playerId: playerId,
        content: _imageId
    };
    websocket.socket.send(JSON.stringify(_data));
}

// Spezifische Karte entfernen.
function removeCard(aCard) {
    // gespielte Karte entfernen
    $("#" + "card_" + aCard).remove();
}

// Funktion wenn ein Scopa gemacht wird. (wird für Audio und Dialog-Einblendung gebraucht)
function scopaNotification() {
    $("#scopa_info").show(600).delay(3000).hide(0);
    var audio = new Audio('media/scopa.mp3');
    audio.play();
}

// Generierung einer UUID.
function create_UUID(){
    let dt = new Date().getTime();
    let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        let r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}