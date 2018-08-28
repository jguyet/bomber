
/**
 * Squad constructor
 *
 * @param {Object} opts
 * 				@param {Int} id - squad id
 *				@param {OwnerId} ownerId - owner player id
 *				@param {String} name
 *				@param {Array} players - array of players ids
 *				@param {Boolean} full
 *				@param {Boolean} private
 */

function Squad(opts) {
    if(!opts || !opts.id || !opts.ownerId) return;

    this.id = opts.id;
    this.ownerId = opts.ownerId;
    this.players = [];
    this.full = false;
    this.idx = {};
    this.private = opts.private || false;
    if(opts.players) this.add(opts.players);
}

bombermine.run(function(Game) {
    Squad.prototype.Game = Game
})

Squad.prototype = {

    add: function(players) {
        players = players instanceof Array ? players : [players];
        for(var i = 0; i < players.length; i++) {
            var playerId = players[i].id;
            this.idx[playerId] = this.players.push(players[i]) - 1;
        }
    },

    get: function(playerId) {
        return this.players[this.idx[playerId]];
    },

    getAll: function() {
        return this.players;
    },

    del: function(playerId) {
        var idx = this.idx[playerId];
        this.players.splice(idx, 1);
        this.updateIdx(idx);
    },

    delAll: function() {
        this.players = [];
        this.idx = {};
        this.full = false;
    },

    updateIdx: function(fromIdx) {
        for(var i = fromIdx || 0; i < this.players.length; i++) {
            this.idx[this.players[i].id] = i;
        }
    }

}