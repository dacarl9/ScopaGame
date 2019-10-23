//TODO: Vater hat gesagt mach eine kuuulee schriftrolle wo die spiu regu drin stöid

scopaCards  = [
    "1_1","2_1","3_1","4_1","5_1","6_1","7_1","8_1","9_1","10_1",
    "1_2","2_2","3_2","4_2","5_2","6_2","7_2","8_2","9_2","10_2",
    "1_3","2_3","3_3","4_3","5_3","6_3","7_3","8_3","9_3","10_3",
    "1_4","2_4","3_4","4_4","5_4","6_4","7_4","8_4","9_4","10_4"
];

const Message = require('./message').Message;
const Combinatorics = require('./combinatorics');

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

    // Erstellt anhand der aktuellen Spielsituation eine Message, welche anschliessend an einen Spieler gesendet wird.
    // TODO: Hier müssen noch weitere Infos wie Spieler, Runden, Zeit ,.. gesetzt werden
    getGameStateMessage(){
        let _message = new Message(0);
        _message.tableCards = this.tableCards;
        _message.playerCards = this.player1Cards;
        return _message;
    }

    // Spieler Nachricht verarbeiten. (Aktuell wird nur eine Karte vom Spieler gesendet)
    // TODO: Ev. noch gebrauchte Zeit
    processPlayerMessage(message,aRoom){
        console.log('nachricht von spieler in logik empfangen: '+message.content);
        let _card = message.content;
        // 1. Fall: Gleiche Karte
        let sameCards = this.checkCardNumberIsOnTable(_card);
        // 2. Fall: Kombinationen zur Karte
        let _cardCombinations = this.getPossibleCardCombinationWithCard(_card);

        // TODO nicht nur für gleiche Karten & nicht nur erste Karte
        if(sameCards.length > 0) {
            // TODO Karte zu Spieler Konto
            // Spieler kann Karte nehmen.
            this.removeFromArray(this.tableCards, sameCards[0]);
        }else if(_cardCombinations.length > 0){
            // TODO Karte zu Spieler Konto
            // Spieler kann Karte nehmen.
            console.log(_cardCombinations);

            // TODO: _cardCombinations[0] aktuell nur erst bester genommen
            // TODO: Zum aktuellen Spieler hinzufügen
            let _cardsToRemove = _cardCombinations[0];
            for (let element in _cardsToRemove){
                this.removeFromArray(this.tableCards, _cardsToRemove[element]);
            }
        }else{
            // Karte kann nicht genommen werden.
            this.tableCards.push(_card);
        }

        var _gameData = {
            messageType: 0,
            tableCards: this.tableCards,
            handCards: [],
        };

        console.log("server daten sendet folgende tisch karten"+_gameData.tableCards)
        aRoom.sendAll(JSON.stringify(_gameData));
    }

    // Gibt gemischte Karten
    getNextCards(aCardCount) {
        let _cards = [];

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
        let currentIndex = array.length, temporaryValue, randomIndex;

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
        let a = [], diff = [];

        for (let i = 0; i < a1.length; i++) {
            a[a1[i]] = true;
        }

        for (let j = 0; j < a2.length; j++) {
            if (a[a2[j]]) {
                delete a[a2[j]];
            } else {
                a[a2[j]] = true;
            }
        }

        for (let k in a) {
            diff.push(k);
        }

        return diff;
    }

    // Gibt zurück ob sich die gleiche Karte einer anderen Farbe auf dem Tisch liegt
    checkCardNumberIsOnTable(aCard){
        let cardNumber = aCard.length ===3 ?aCard.charAt(0):aCard.charAt(0)+ aCard.charAt(1);
        let choosableCards = []

        for (let tableCard in this.tableCards){
            var _card = this.tableCards[tableCard];
            var _tableCardNumber =  _card.length ===3 ?_card.charAt(0):_card.charAt(0)+ _card.charAt(1);
            console.log("TABLECARDNUMBER: "+_tableCardNumber);
            if(_tableCardNumber == cardNumber){
                // Zu möglichen gleichen Karten hinzufügen
                choosableCards.push(this.tableCards[tableCard]);
            }
        }
        return choosableCards;
    }

    getPossibleCardCombinationWithCard(aCard){
        let _result = [];
        let _cardValue = parseInt(aCard.charAt(0)+aCard.charAt(1));
        let _allCombinations = this.getAllCardCombinations();
        console.log("das sit der Wert der KArte: "+_cardValue)

        for (let combination in _allCombinations){
            let _combination = _allCombinations[combination];

            if(_combination.length <= 1){
                continue;
            }

            let sum = 0;
            let cardComboIds = []
            for (let entry in _combination){
                sum += parseInt(_combination[entry].cardValue);
                cardComboIds.push(_combination[entry].cardId);
            }

            if(sum === _cardValue){
                _result.push(cardComboIds);
            }
        }

        return _result;
    }

    // Gibt mögliche Karten-Kombinationen, welche in der Summe den Wert der Karte ergeben.
    getAllCardCombinations(){
        let _tableCardWithValues = this.getActualTableCardIdsWithValue();
        let cmb = Combinatorics.power(_tableCardWithValues);
        return cmb.toArray();
    }

    // Löscht ein Element aus Array (TableCard, HandCard)
    removeFromArray(aArray, aElemnt){
        for( let i = 0; i < aArray.length; i++){
            console.log(aArray[i]+" "+aElemnt)
            if ( aArray[i] === aElemnt) {
                aArray.splice(i, 1);
            }
        }
    }

    // Gibt die aktuellen Tischkarten mit deren Wert zurück.
    getActualTableCardIdsWithValue(){
        let tableCardsWithValue = [];

        for (let tableCard in this.tableCards){
            if(!this.tableCards.hasOwnProperty(tableCard)){
                continue;
            }

            let _cardId = this.tableCards[tableCard];
            tableCardsWithValue.push({
                cardId: _cardId,
                cardValue: _cardId.length === 3?_cardId.charAt(0):_cardId.charAt(0)+_cardId.charAt(1)
            });
        }

        return tableCardsWithValue;
    }
}

module.exports.ScopaLogic = ScopaLogic;