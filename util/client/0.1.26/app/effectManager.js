window.EffectManager = function() {
    this.list = [];
    this.pool = [];
    
    var buf = new ArrayBuffer(4);
    var data32 = new Uint32Array(buf);
    data32[1] = 0x0a0b0c0d;
    window.isLittleEndian = true;
    if (buf[4] === 0x0a && buf[5] === 0x0b && buf[6] === 0x0c &&
        buf[7] === 0x0d) {
        window.isLittleEndian = false;
    }
};

EffectManager.prototype.createEffect2 = function(period) {
    var eff;
    if (this.pool.length > 0) {
        eff = this.pool.pop();
    } 
        eff = new Effect_2();
    eff.period = period;
    eff.start = new Date().getTime();
    this.list.push(eff);
    return eff;
}

EffectManager.prototype.createEffect1 = function(period) {
    eff = new Effect();
    eff.period = period;
    eff.start = new Date().getTime();
    this.list.push(eff);
    return eff;
}

EffectManager.prototype.clear = function() {
    while (this.list.length > 0) {
        var eff = this.list.pop();
        if (eff.type == "effect2")
            this.pool.push(eff);
    }
}

EffectManager.prototype.update = function(count, time) {
    var curTime = Date.now();
    var counter = this.list.length;
    while ((time == -1 || curTime <= time || count > 0) && counter > 0) {
        counter--;
        var eff = this.list.shift();
        eff.progress = (curTime - eff.start) / eff.period;
        if (eff.progress >= 1.0) {
            if (eff.type == "effect2")
                this.pool.push(eff);
            continue;
        }
        this.list.push(eff);
        eff.innerUpdate();
        count--;
        curTime = (new Date()).getTime();
    }
};

window.effects = new EffectManager();