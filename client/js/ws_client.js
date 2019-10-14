const websocket = {
    SERVER_MESSAGE : 0,
    CHAT_MESSAGE : 1,
    CLIENT_MESSAGE:2
}

var tableCardArray = [];
var handCardArray = [];
var isGameStart =true;
var lastPlayedCard = "";

$(function(){
    // Rendern des Chatfensters
    renderChatBox();

    // check if existence of WebSockets in browser
    if(window["WebSocket"]){
        websocket.socket = new WebSocket("ws://127.0.0.1:8000");

        // on open event
        websocket.socket.onopen = function (e) {
            console.log('WebSocket connection established');
        };

        // on message event
        websocket.socket.onmessage = function(e) {
            var _data = JSON.parse(e.data);

            if (_data.messageType === websocket.SERVER_MESSAGE){
                // Spiel Informations-Nachricht
                handleGameAction(_data);
            }else {
                // Chat Nachricht
                handleChatMessage(_data);
            }
        };

        //on close event
        websocket.socket.onclose = function (e) {
            console.log('WebSocket connection closed');
        };
    }
    $("#send").click(sendMessage);

    $("#chat-input").keypress(function(event) {
        if (event.keyCode == '13') {
            sendMessage();
        }
    });

});

function sendMessage(aType, aContent){
    var message = $("#chat-input").val();
    var _data = {
        messageType: 1,
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
    $("#chat-form").submit(function(e) {
        e.preventDefault();
    });

    $("#title-button").click(function(){
        if($(this).html() == "-"){
            $(this).html("+");
        }
        else{
            $(this).html("-");
        }
        $("#chat-box").slideToggle();
    });
}

function handleChatMessage(aData) {
    // Chat Nachricht zum Verlauf hinzufügen
    var textarea = document.getElementById('chat-history');
    textarea.append(aData.content+'\n');

    // Inhalt nach unten scrollen
    textarea.scrollTop = textarea.scrollHeight;
}

// Spiel Daten vom Server verarbeiten
function handleGameAction(aData) {
    if(isGameStart){
        this.tableCardArray = aData.tableCards;
        this.handCardArray = aData.handCards;

        for (let i = 0; i < this.tableCardArray.length; i++) {
            var _card = this.tableCardArray[i];
            var _cardNumber = _card.toString().split("_")[0];
            var _cardType = _card.toString().split("_")[1];
            addCardToTable(_cardNumber, _cardType);
        }
        for (let i = 0; i <  this.handCardArray .length; i++) {
            var _card =  this.handCardArray [i];
            var _cardNumber = _card.toString().split("_")[0];
            var _cardType = _card.toString().split("_")[1];
            addCardToHand(_cardNumber, _cardType);
        }
        isGameStart=false;
    }else{
        handleTableCardFromMessage(aData.tableCards);
    }
}

// Karte zum Tisch hinzufügen
function addCardToTable(aCardNumber, aCardType) {
    var _newId = 'card_'+aCardNumber+'_'+aCardType;
    $("#table").append('<div id="'+ _newId+'" class="table_card"></div>');
    $("#"+_newId).css('background', 'url("images/cards/'+aCardNumber+'.'+aCardType+'.png")');
    $("#"+_newId).css('background-size', 'contain');
    $("#"+_newId).css('background-color', 'white');
    $("#"+_newId).css('background-repeat', 'no-repeat');
    $("#"+_newId).css({'transform' : 'rotate('+ getRandomInt(-17,+17) +'deg)'});
}

// Karte vom Spieler hinzufügen
function addCardToHand(aCardNumber, aCardType) {
    var _newId = 'card_' + aCardNumber +'_'+ aCardType;
    $("#hand").append('<div id="' + _newId + '" class="card" ></div>');
    $("#" + _newId).css('background', 'url("images/cards/' + aCardNumber +'.'+ aCardType + '.png")');
    $("#" + _newId).css('background-size', 'contain');
    $("#" + _newId).css('background-color', 'white');
    $("#" + _newId).css('background-repeat', 'no-repeat');
    $("#" + _newId).click(function () {
        selectedCard(_newId);
    });
}

// Klick auf Karte
function selectedCard(id){
    console.log("selectedCard: "+id.toString());
    // var bg = $("#"+id).css("background");
    // var _newId = (id+'_table');
    //
    // $("#table").append('<div id="'+_newId +'" class="table_card"></div>')
    //
    // $("#"+_newId).css('background', bg);
    // $("#"+_newId).css('background-size', 'contain');
    // $("#"+_newId).css('background-color', 'white');
    // $("#"+_newId).css('background-repeat', 'no-repeat');
    // $("#"+_newId).css({'transform' : 'rotate('+ getRandomInt(-17,+13) +'deg)'});

    var _imageId = id.replace('card_','');
    lastPlayedCard= _imageId;
    var _data = {
        messageType: 0,
        content: _imageId
    };
    websocket.socket.send(JSON.stringify(_data));
}

function removeCard(aCard){
    // gespielte Karte entfernen
    $("#"+"card_"+aCard).remove();
}

function handleTableCardFromMessage(aArrivedCards){
    // Welche fehlen in B
    var _cardsToRemove = [];


    for (var i=this.tableCardArray.length; i--;) {
        if (aArrivedCards.indexOf(this.tableCardArray[i]) === -1) {
            _cardsToRemove.push(this.tableCardArray[i]);
        }
    }

    if(_cardsToRemove.length>0){
        for (var _card in _cardsToRemove){
            removeCard(_cardsToRemove[_card]);
        }
        // gespielte Karte löschen.
        removeCard(lastPlayedCard);
    }else{
        // Karte aus Hnad löschen
        var _lastCardNumber = lastPlayedCard.charAt(0);
        var _lastCardType = lastPlayedCard.charAt(2);

       removeCard(lastPlayedCard); //
       addCardToTable(_lastCardNumber,_lastCardType);
    }



}