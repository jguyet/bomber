bombermine.directive('animatedPreview', function($rootScope, skinModel) {
    return {
        restrict: 'A',
        scope: {
            selectedSkin: "@animatedPreview",
            size: "@previewSize",
        },
        template: '<div class="platform"></div><div class="shadow"></div><div class="skin"><canvas width="{{size}}" height="{{size}}"></canvas></div>',
        link: function(scope, elem, attrs) {
            var canvas = elem.find("canvas")[0];
            var shadow = elem.find(".shadow");
            var ap = new AnimatedPreview(skinModel, canvas, {
                shadow: shadow
            });

            scope.$watch("selectedSkin", function(newVal, oldVal) {
                ap.stop();
                ap.startName(newVal);
            });
            scope.$on("$destroy", function() { ap.stop() });
        }
    }
});

bombermine.directive('animatedPreviewAds', function($rootScope, $state, Game, skinModel) {
    var size = 72;
    return {
        restrict: 'A',
        scope: {
            skinType: "@skinType",
            size: "@previewSize"
        },
        template: '<canvas width="{{size}}" height="{{size}}"></canvas>',
        link: function(scope, elem, attrs) {
            var activeSkin = null;
            
            elem.bind('click', function() {
                $rootScope.proposedSkin = scope.skinType || ap.curSkin;
                /*  GA */	_gaq.push(['_trackEvent', 'animatedPreviewAds', 'click', $rootScope.proposedSkin]);
                $rootScope.menu();
                $state.go(scope.skinType ? "skins.character" : "skins.skins");
            });
      
            var canvas = elem.find("canvas")[0];
            var ap = new AnimatedPreview(skinModel, canvas, {
                randomness: true,
                changeInterval: 1000,
                size: scope.size
            });
            var timeout = null;
            
            function startNextSkin() {
                function start(name) {
                    activeSkin = name;
                    skinModel.getSpriteWithCnavas(name, function(sprite, img) {
                        if (name == activeSkin) {
                            ap.start(sprite, img);
                            var t = ~~(8000+Math.random()*12000);
                            timeout = setTimeout(startNextSkin, t);
                        }
                    });
                }
                if (scope.skinType == null) {
                    var awaited = activeSkin = "_wait" + Math.random();
                    skinModel.whenReady(function() {
                        if (activeSkin == awaited)
                            start(skinModel.shopList[~~(Math.random()*skinModel.shopList.length)].name);
                    });
                }else
                    start(scope.skinType + Math.random());
            }
            
            startNextSkin();
            
            function stop() {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                activeSkin = null;
                ap.stop();
            }
            
            scope.$on("$destroy", function() {
                stop();
                off_tabMenuOpen();
                off_tabMenuClose();
            });
            var off_tabMenuOpen = $rootScope.$on('tabMenuOpen', function(e, tab) {
                if (tab == 'skins' && activeSkin == null)
                    startNextSkin();
            });
            var off_tabMenuClose = $rootScope.$on('tabMenuClose', stop);
        }
    }
});

// options: shadow (element id), size (pixels)
AnimatedPreview = function(skinModel, canvas, options) {
    var self = this;
    options = options || {};
    var animTempCanvas;
    var timeout = null;
    var curShadowStyle = false;
    var thumbSize = options.size || sprites.shopThumbSize;
    this.curSkin = null;
    
    this.stop = function() {
        if (timeout != null) {
            clearTimeout(timeout);
            timeout = null;
        }
        canvas.getContext('2d').clearRect(0, 0, canvas.height, canvas.width);
        curShadowStyle = null;
        this.curSkin = null;
    }
    
    this.startName = function(name) {
        skinModel.getSpriteWithCnavas(name, function(sprite, img) { self.start(sprite, img) });
    }

    this.start = function(sprite, img) {
        var ctx = canvas.getContext('2d');
        this.stop();
        //this.clear();

        this.curSkin = sprite.name;
        if (!this.curSkin)
            return;
        this.sprite = sprite;
        this.img = img;

        var skin = sprite.skin;
        
        var modes;
        if (skin.alwaysRun) {
            modes = ["alwaysRun"];
        }else {
            modes = [skin.idleAnim ? "idle" : "stand"];
            if (options.randomness)
                modes.push("run");
        }
        
        var sx, sy = 0, dir, mode, col, interval, timeToModeChange, changeMode = true;
        function initMode() {
            timeout = -1; // indicates a change of animation mode
            timeToModeChange = (options.changeInterval || 0xFFFFFFFF) * (Math.random() + 1);
            var rows = skin.animMirrorLeft ? 3 : 4;
            var oldMode = mode;
            var oldSy = sy % rows;
            do {
                mode = modes[~~(Math.random()*modes.length)];
                
                var pf = getPublicFrame(skin);
                sx = pf[1];
                sy = pf[0];
                if (options.randomness) {
                    sy = 1 + (~~(Math.random()*2));
                    if (skin.row)
                        sy = skin.row[sy];
                }
                // change 1 value at a time
            }while( options.randomness && oldMode &&
                    (mode == oldMode && sy == oldSy || mode != oldMode && sy != oldSy));
            var dir = sy;
            if(skin.row && options.randomness) {
                for(dir=0; dir<4; dir++) {
                    if (skin.row[dir] == sy)
                        break;
                }
            }
            if (mode == "idle" && sy < rows)
                sy += rows;
            
            if (mode == "stand") {
                col = [sx];
                sx = 0;
                interval = 100; // so we can change mode
            }else {
                if (mode == "idle") {
                    col = skin.idleCol || defArray(dir % 2 ? skin.idleAnimCountSide : skin.idleAnimCount);
                }else {
                    col = skin.col || defArray(dir % 2 ? skin.animCountSide : skin.animCount);
                    if (skin.animStand && !skin.col)
                        col = col.map(function(v) {return v+1});
                }
                if (mode == "run") {
                    interval = skin.animSpeed / Math.max(skin.animCount, skin.animCountSide) / 4;
                }else {
                    interval = skin.idleAnimSpeed / Math.max(skin.idleAnimCount, skin.idleAnimCountSide) / 4;
                }
            }
        }
        
        function defArray(n) {
            var r = [];
            for(var i=0; i<n; i++) r.push(i);
            return r;
        }

        function updateShadow() {
            // calculate shadow after generating the first frame
            if (options.shadow && curShadowStyle == null) {
                var meta = calcShadow(ctx, 0, 0, thumbSize, thumbSize);
                curShadowStyle = shadowStyle(meta);
                options.shadow.css(curShadowStyle);
            }
        }

        function drawFrame(sx) {
            if (canvas.clientHeight == 0) // if canvas is not visible
                return;
            ctx.clearRect(0, 0, canvas.height, canvas.width);
            var pixelScale = options.randomness
                ? 2 * skin.renderWidth / skin.frameWidth
                : thumbSize / Math.max(skin.frameWidth, skin.frameHeight);
            // try to make it crisp
            if (pixelScale > 2 && pixelScale <= 2.5) pixelScale = 2;
            var rw = ~~(skin.frameWidth * pixelScale);
            var rh = ~~(skin.frameHeight * pixelScale);
            var dx = ~~((thumbSize - rw) / 2);
            var dyDown = ~~Math.min((thumbSize - rh) / 2, 4);
            var dy = thumbSize - rh - dyDown;
            if (options.randomness) {
                var renderShiftY = (skin.renderShiftY || 0) * pixelScale / (skin.renderWidth / skin.frameWidth);
                dy = ~~((thumbSize - skin.frameHeight * pixelScale + renderShiftY) / 2);
            }

            var smoothing = pixelScale != ~~pixelScale;
            ctx.imageSmoothingEnabled = smoothing;
            ctx.webkitImageSmoothingEnabled = smoothing;
            ctx.mozImageSmoothingEnabled = smoothing;

            ctx.drawImage(img,
                sx*skin.frameWidth, sy*skin.frameHeight, skin.frameWidth, skin.frameHeight,
                dx, dy, rw, rh);
            updateShadow();
        }

        var timeoutSkin = this.curSkin;
        function playAnim() {
            if (timeoutSkin != self.curSkin || timeout == null)
                return;
            if (mode == null || (timeToModeChange < 0 && sx == 0)) // sx == 0 to let it finish anim cycle
                initMode();
            drawFrame(col[sx]);
            var delay = interval;
            if (mode == "idle" && sx == 0 && skin.idlePauseMax) {
                delay = timeout == -1
                    ? Math.min(skin.idlePauseMin, 700)
                    : skin.idlePauseMin + Math.random()*(skin.idlePauseMax - skin.idlePauseMin);
            }
            sx = (sx + 1) % col.length;
            timeout = setTimeout(playAnim, delay);
            timeToModeChange -= delay;
        }

        function drawThumb() {
            var pf = getPublicFrame(skin);
            if (undef(animTempCanvas))
                animTempCanvas = document.createElement("canvas");
            animTempCanvas.width = img.width;
            animTempCanvas.height = img.height;
            var srcCtx = animTempCanvas.getContext("2d");
            srcCtx.drawImage(img, 0, 0);
            drawBigThumb(animTempCanvas, srcCtx,
                skin.frameWidth, skin.frameHeight, default_(skin.renderWidth, skin.frameWidth),
                ctx, thumbSize,
                0, pf[1]*skin.frameWidth, pf[0]*skin.frameHeight);
            updateShadow();
        }
        
        if (modes.length == 1 && modes[0] == "stand") {
            drawThumb();
        }else {
            timeout = -1; // invalid value other than null
            playAnim();
        }
    }
}