function Squads(squads) {
    this.squads = [];
    this.idx = {};
    this.mySquadId = null;
    this.$el = null;
    if(squads) this.add(squads);
}

Squads.prototype = {

    add: function(squads) {
        if(!squads) return;

        squads = squads instanceof Array ? squads : [squads];
        for(var i = 0; i < squads.length; i++) {
            var squad = squads[i];
            if(squad)
                this.idx[squad.id] = this.squads.push(new Squad(squad)) - 1;
        }

        this.onUpdate();
    },

    get: function(id) {
        return this.squads[this.idx[id]];
    },

    getAll: function() {
        return this.squads;
    },

    del: function(id) {
        var idx = this.idx[id];
        this.squads.splice(idx, 1);
        this.updateIdx(idx);
        if(this.mySquadId == id) this.mySquadId = null;

        this.onUpdate();
    },

    delAll: function() {
        this.squads = [];
        this.idx = {};
        this.mySquadId = null;

        this.onUpdate();
    },

    updateIdx: function(fromIdx) {
        for(var i = fromIdx || 0; i < this.squads.length; i++) {
            this.idx[this.squads[i].id] = i;
        }
    },

    onCreate: function(id) {
        if(this._mySquadId && this.get(this._mySquadId)) {
            delete this.get(this._mySquadId).my;
            delete this._mySquadId;
        }
        this._mySquadId = this.mySquadId;
        this.get(this.mySquadId).my = true;
        this.onUpdate();
        if(this.$el)
            this.$el.animate({'scrollTop': 0}, 100);
        // console.log('Squad created! data: %s', JSON.stringify(this.get(id)));
    },

    onJoin: function(id) {
        if(this._mySquadId && this.get(this._mySquadId)) {
            delete this.get(this._mySquadId).my;
            delete this._mySquadId;
        }
        this._mySquadId = this.mySquadId;
        this.get(this.mySquadId).my = true;
        this.onUpdate();
        if(this.$el)
            this.$el.animate({'scrollTop': 0}, 100);
        // console.log('Joined squad! data: %s', JSON.stringify(this.get(id)));
    },

    onLeave: function(id) {
        if(this._mySquadId && this.get(this._mySquadId)) {
            delete this.get(this._mySquadId).my;
            delete this._mySquadId;
        }
        console.log('Leaved squad! id: %d', this.mySquadId);
        this.onUpdate();
    },

    onInvite: function(id) {
        // console.log('Invited to squad! data: %s', JSON.stringify(this.get(id)));
    },

    onUpdate: function() {
        // console.log('Squads onUpdate event');
    }

}

