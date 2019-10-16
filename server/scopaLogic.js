scopaCards  = [
    "1_1","2_1","3_1","4_1","5_1","6_1","7_1","8_1","9_1","10_1",
    "1_2","2_2","3_2","4_2","5_2","6_2","7_2","8_2","9_2","10_2",
    "1_3","2_3","3_3","4_3","5_3","6_3","7_3","8_3","9_3","10_3",
    "1_4","2_4","3_4","4_3","5_4","6_4","7_4","8_4","9_4","10_4"
];

var Message = require('./message').Message;

class ScopaLogic{
    constructor(){
        // Gemischte Karten der Runde
        this.shuffeldCards = [];
        // Karten auf dem Tisch
        this.tableCards = [];
        // Spieler 2 aktuelle Karten
        this.player1Cards = [];
        // Spieler 1 aktuelle Karten
        this.player2Cards = [];
        // Spieler 1 genommene Karten
        this.takenCardsPlayer1 = [];
        // Spieler 2 genommene Karten
        this.takenCardsPlayer2 = [];
        // Karte mischen
        this.shuffleCards();
    }

    startGame(){
        this.tableCards = this.getNextCards(4);
        this.player1Cards = this.getNextCards(3);
        this.player2Cards = this.getNextCards(3);
        this.cardShufflerId = 1;
    }

    getGameStateMessage(){
        var _message = new Message(0);
        _message.tableCards = this.tableCards;
        _message.playerCards = this.player1Cards;
        return _message;
    }

    processPlayerMessage(message,aRoom){
        console.log('nachricht von spieler in logik empfangen: '+message.content);
        var _card = message.content;
        // 1. Fall: Gleiche Karte
        var sameCards = this.checkCardNumberIsOnTable(_card);
        // 2. Fall: Kombinationen zur Karte

        // TODO nicht nur für gleiche Karten & nicht nur erste Karte
        if(sameCards.length >0) {
            // TODO Karte zu Spieler Konto
            // Spieler kann Karte nehmen.
            this.removeFromArray(this.tableCards, sameCards[0]);
        }else{
            // Karte kann nicht genommen werden.
            this.tableCards.push(_card);
        }

        var _gameData = {
            messageType: 0,
            tableCards: this.tableCards,
            handCards: []
        };

        aRoom.sendAll(JSON.stringify(_gameData));
    }

    // Gibt gemischte Karten
    getNextCards(aCardCount) {
        var _cards = [];

        for (let i = 0; i < aCardCount; i++) {
            _cards.push(this.shuffeldCards.shift());
        }
        return _cards;
    }

    // Karten mischen
    shuffleCards(){
        this.shuffeldCards = scopaCards.slice();
        this.shuffeldCards = this.shuffle(this.shuffeldCards);
    }

    // Misch Algorithmus
    shuffle(array) {
        var currentIndex = array.length, temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    }

    // Gibt die unterschiede von 2 Array zurück
    getArrayDiffrence (a1, a2) {
        var a = [], diff = [];

        for (var i = 0; i < a1.length; i++) {
            a[a1[i]] = true;
        }

        for (var j = 0; j < a2.length; j++) {
            if (a[a2[j]]) {
                delete a[a2[j]];
            } else {
                a[a2[j]] = true;
            }
        }

        for (var k in a) {
            diff.push(k);
        }

        return diff;
    }

    // Gibt zurück ob sich die gleiche Karte einer anderen Farbe auf dem Tisch liegt
    checkCardNumberIsOnTable(aCard){
        var cardNumber = aCard.charAt(0);
        var choosableCards = []

        for (var tableCard in this.tableCards){
            if(this.tableCards[tableCard].charAt(0) == cardNumber){
                // Zu möglichen gleichen Karten hinzufügen
                choosableCards.push(this.tableCards[tableCard]);
            }
        }
        return choosableCards;
    }

    // Löscht ein Element aus Array (TableCard, HandCard)
    removeFromArray(aArray, aElemnt){
        for( var i = 0; i < aArray.length; i++){
            if ( aArray[i] === aElemnt) {
                aArray.splice(i, 1);
            }
        }
    }

}

module.exports.ScopaLogic = ScopaLogic;