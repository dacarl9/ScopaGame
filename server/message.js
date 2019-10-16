class Message {
    constructor(type){
        this.messageType = type;
        this.playerId = create_UUID();
        this.startDate = new Date();
        this.endDate = new Date();
        this.tableCards = [];
        this.playerCards = [];
        this.roundNumber = 0;
        this.cardShufflerId = this.playerId;
        this.actionCard = '';
        this.content ='';
    }

    test(){
        return 'Das isch Test';
    }
}

function create_UUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}

module.exports.Message = Message;
