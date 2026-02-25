window.Effect_2 = function() {
    this.buffer = document.createElement('canvas');
    this.ww = -1;
    this.hh = -1;
};
Effect_2.prototype.dxByDir = [ 1, 0, -1, 0, 0 ];
Effect_2.prototype.dyByDir = [ 0, -1, 0, 1, 0 ];

Effect_2.prototype.type = "effect2";

Effect_2.prototype.ready = function() {
    return this.progress >= 0.99;
}

Effect_2.prototype.init1 = function() {
    var w = this.w, h = this.h;
    var ww = this.ww, hh = this.hh;
    var flag = [];
    for ( var i = 0; i < w * h; i++) {
        flag.push(0);
    }
    this.part_sz = [];
    this.part_speed = [];
    this.part_x = [];
    this.part_y = [];
    var k = 0, num = 0;
    var dir = this.dir;
    var data = this.data.data, orig = this.orig.data;
    var rnd = GenerateRandom(w >> 1, h >> 1);
    for ( var j = 0; j < h; j++) {
        for ( var i = 0; i < w; i++) {
            if (flag[i + j * w])
                continue;
            var sz2 = 1, sz = 2;
            while (sz2 <= 3 && (i & (sz - 1)) == 0 && (j & (sz - 1)) == 0
                    && i + sz <= w && j + sz <= h) {
                sz2++;
                sz <<= 1;
            }
            sz2--;
            if (sz2 != 0)
                sz2 = (Math.random() * sz2 | 0) + 1;
            sz = 1 << sz2;
            this.part_sz.push(sz);
            this.part_x.push(i + this.sx);
            this.part_y.push(j + this.sy);
            var t = 1.0 - i / w;
            /*
             * if (dir==1) t = j/w; if (dir==2) t = i/w; if (dir==3) t =
             * 1.0-j/w; if (dir==4)
             */
            t = 0.5;
            this.part_speed.push(t * 0.5 + rnd[(i >> 1) + (j >> 1) * (w >> 1)]
                    * 0.5);
            for ( var dy = 0; dy < sz; dy++)
                for ( var dx = 0; dx < sz; dx++) {
                    var s = ((i + dx) + (j + dy) * w);
                    flag[s] = 1;
                    s *= 4;
                    data[k++] = orig[s++];
                    data[k++] = orig[s++];
                    data[k++] = orig[s++];
                    data[k++] = orig[s++];
                }
        }
    }
    for ( var i = 0; i < 4 * w * h; i++)
        orig[i] = data[i];
    this.progress = 0.0;
    return this;
}

Effect_2.prototype.init = function(img, imgX, imgY, w, h, dir) {
    var context = this.buffer.getContext("2d");
    var ww = w * (1 + Math.abs(this.dxByDir[dir]));
    var hh = h * (1 + Math.abs(this.dyByDir[dir]));
    var sx = w * Math.max(0, -this.dxByDir[dir]);
    var sy = h * Math.max(0, -this.dyByDir[dir]);
    this.w = w;
    this.h = h;
    if (this.ww != ww || this.hh != hh) {
        this.buffer.width = ww;
        this.buffer.height = hh;
        this.data = context.createImageData(ww, hh);
    }
    this.sx = sx;
    this.sy = sy;
    this.ww = ww;
    this.hh = hh;
    this.dir = dir;
    context = this.buffer.getContext("2d");
    context.clearRect(0, 0, ww, hh);
    context.drawImage(img, imgX, imgY, w, h, 0, 0, w, h);
    this.orig = context.getImageData(0, 0, w, h);
    this.init1();
    if (sx!=0 || sy!=0) {
        context.clearRect(0, 0, w, h);
        context.drawImage(img, imgX, imgY, w, h, sx, sy, w, h);
    }
    return this;
}

Effect_2.prototype.draw = function(context, x, y, w, h) {
    x -= this.sx * w / this.w;
    y -= this.sy * h / this.h;
    var ww = this.ww / this.w * w;
    var hh = this.hh / this.h * h;
    context.drawImage(this.buffer, x, y, ww, hh);
}

function sq(source, target, p) {
    if (p < 0)
        p = 0;
    if (p > 1)
        p = 1;
    p *= p;
    var x = (source + (target - source) * p) | 0;
    if (x < 0)
        x = 0;
    if (x > 255)
        x = 255;
    return x;
}

Effect_2.prototype.innerUpdate = function() {
    var c = 100;
    var data = this.data.data;
    var orig = this.orig.data;
    var h = this.h;
    var w = this.w;
    var hh = this.hh;
    var ww = this.ww;
    var part_sz = this.part_sz;
    var part_speed = this.part_speed;
    var part_x = this.part_x;
    var part_y = this.part_y;
    var p2 = this.progress;
    var k = 0;
    var dir1 = this.dir;
    var dir2 = (this.dir + 1) % 4;
    for ( var ind = 3; ind < ww * hh * 4; ind += 4) {
        data[ind] = 0;
    }
    for ( var ind = 0; ind < part_sz.length; ind++) {
        var sz = part_sz[ind], x = part_x[ind], y = part_y[ind], speed = part_speed[ind];
        if (speed < 0.0) {
            k += 4 * sz * sz;
            continue;
        }
        var p = p2 * 3.0 - 2.0 + 3.0 * speed;

        if (p > 0.0) {
            var v1 = w / 2;
            var v2 = (speed % 0.1 - 0.05) * w * 5;
            x += (this.dxByDir[dir1] * v1 + this.dxByDir[dir2] * v2) * p;
            y += (this.dyByDir[dir1] * v1 + this.dyByDir[dir2] * v2) * p;
            x |= 0;
            y |= 0;
        }
        if (x < 0 || x + sz > ww || y < 0 || y + sz > hh || p > 1.5) {
            part_speed[ind] = -1.0;
            k += 4 * sz * sz;
            continue;
        }

        var alpha = sq(orig[k + 3], 0.5, p - 0.5);
        for ( var j = 0; j < sz; j++)
            for ( var i = 0; i < sz; i++) {
                var s = (x + i) + (y + j) * ww;
                s *= 4;
                data[s] = orig[k++];
                data[s + 1] = orig[k++];
                data[s + 2] = orig[k++];
                data[s + 3] = alpha;
                k++;
            }
    }
    var context = this.buffer.getContext("2d");
    context.putImageData(this.data, 0, 0);
}

Effect_2.prototype.update = function(progress) {
    this.progress += progress;
    this.innerUpdate();
}
