/**
 * Class `Players` constructor
 */

function Players(){
    this.playersModified = false;
    this.players = [];
    // Associative massive (hash) for fast fetch by `id`
    this.idx_ids = {};
    this.myId;
    this.sorted = [];
}

/**
 * Class `Players` prototype
 */

Players.prototype = {


    /**
     * Add player
     * @param {Object} player
     *
     * {id: Int, nickname: String, status: Int}
     * `nickname` converted to lower-case for case-insensitive compare
     *
     * Statuses:
     * 0 - joined (but not spawned yet)
     * 1 - ingame (playing in the game)
     * 2 - nyan
     * 3 - spectator
     */

    add: function(players){
        if(!Object.keys(players).length) return;
        var index;
        // console.log('add (players): ', players);
        if(typeof players == 'object' && players instanceof Array) {
            for(var i = 0, l = players.length, player; i < l; i++) {
                player = players[i];
                index = this.players.push(player) - 1;
                this.idx_ids[player.id] = index;
                player.pos = index + 1;
            }
        } else {
            var player = players;
            index = this.players.push(player) - 1;
            this.idx_ids[player.id] = index;
            player.pos = index + 1;
        }
        this.onChange();
    },

    /**
     * Get player by `id`
     * @param {Int}
     *
     * @return {Object} player
     */

    get: function(id){
        if(!id) return;
        return this.players[this.idx_ids[id]];
    },

    update: function(ids) {
        // console.log('update (ids): ', ids);
        this.onChange();
    },

    /**
     * Delete player by `id`
     * @param {Int} id
     */

    del: function(id){
        if(!id) return;
        var index = this.idx_ids[id],
                player;

        if(index === undefined) return;
        // console.log('del (index, id): ', index, id);
        // Remove from array
        player = this.players[index];
        this.players.splice(index, 1);
        // Remove from hash
        delete this.idx_ids[player.id];
        // Refresh hash
        for(var i = 0; i < this.players.length; i++){
            this.idx_ids[this.players[i].id] = i;
        }
        this.onChange();
    },

    /**
     * Delete all players
     */

    delAll: function(){
        this.players = [];
        this.idx_ids = {};
        this.myId = null;
        this.onChange();
        // console.log('delAll');
    },

    /**
     * getNicknames - returns all nicknames for chat message @mention
     */

    getNicknames: function(){
        var result = [];
        for(var i in this.players){
            result.push(this.players[i].nickname);
        }
        return result;
    },
    getIdByNickname: function(nickname) {
        for(var i in this.players){
            if (this.players[i].nickname==nickname)
                return this.players[i].id;
        }
        return 0;
    },
    updateIndex: function(fromIdx) {
        var self = this;
        for(var i = fromIdx || 0; i < this.players.length; i++){
            this.players[i].pos = i+1;
            this.idx_ids[this.players[i].id] = i;
        }
        // this.players.map(function(player, i) {
        // 	self.idx_ids[player.id] = i;
        // 	player.pos = i+1;
        // 	return player;
        // });
    },

    onChange: function() {},

    onSort: function() {}

}