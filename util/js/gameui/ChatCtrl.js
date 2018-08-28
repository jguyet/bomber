bombermine.controller('ChatCtrl', function($rootScope, $scope, $sce, dropdownService,
        community, Game, serverList, storage, $http, IgnoreService, i18nFilter, localize) {
    // types: s - system, k - kill, m - moderator
    var TYPE_COMMON  = 'c';
    var TYPE_SERVER  = 's';
    var TYPE_KILL    = 'k';
    var TYPE_MOD     = 'm';
    var TYPE_PRIVATE = 'p';
    var TYPE_PRIVATE_MOD = '!'; // this cannot be ignored
    
    var CENS_DISABLED = "C";
    var CHAT_DISABLED = "A";
    var SCROLL_DISABLED = "S";
    
    var actualFilters = /[^ckmCAS]/g
    
    var SHOW_TIME_INTERVAL = 1000 * 60 * 2;
    var SHOW_IGNORED_INTERVAL = 1000 * 60 * 5;
    var MAX_IGNORED = 50;

    var defaultIgnoresHidden = ($scope.user.perm_mask & 2) == 0;
    
    var censorManager = new CensorManager();

    $scope.filtered = storage.getItem('game/chatFilters', "").replace(actualFilters, "");
    
    $scope.chat = [];
    var oldTime = 0, oldCensTime = 0, oldHiddenTime = 0, oldIgnoreTime = 0;
    var chatHistoryRecieved = false;
    var recentlyIgnored = [];
    
    $scope.toggleFilter = function (type) {
        var filtered = $scope.filtered;
        var index = filtered.indexOf(type);
        index === -1
            ? filtered += type
            : filtered = filtered.substring(0, index) + filtered.substring(index+1);
        $scope.filtered = filtered;
        storage.setItem('game/chatFilters', filtered);
        scrollChat();
    }    
    $scope.chatDisabled = function() {
        return $scope.filtered.indexOf(CHAT_DISABLED) !== -1;
    }
    $scope.hasFilter = function (type) {
        return $scope.filtered.indexOf(type) !== -1 || $scope.chatDisabled();
    }
    
    $scope.isVisible = function(msg) {
        return !msg.hidden && !$scope.hasFilter(msg.type) &&
            ($scope.hasFilter(CENS_DISABLED) || !msg.hideCensored);
    }
    
    $scope.getText = function(msg) {
        return $scope.hasFilter(CENS_DISABLED) ? msg.text : (msg.censored || msg.text);
    }
    
    function getServerProperty(key) {
        var server = serverList.activeServer();
        if (server && server[key]) return server[key];
        return $rootScope.config[key];
    }
    
    //$scope.getServerAds = function () {
    //    return getServerProperty("ads");
    //}
    var globalIdByNickname = {};
    
    function sanitizeLite(str) {
        return str.replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\//g, '&#x2F;')
            .replace(/\`/g, '&#96;')
            .replace(/[\x00-\x1F\x7F\u2500-\u259F]/g, '');
            // banned unicode:
            // Box Drawing (U+2500–U+257F)
            // Block Elements (U+2580–U+259F)
    }
    
    function processColor(msg) {
        if (msg.text.slice(0, 2) == '# ') {
            msg.green = true;
            msg.text = msg.text.replace(/^\#\s?/, '');
        } else if (msg.text.slice(0, 2) == '! ') {
            msg.red = true;
            msg.text = msg.text.replace(/\!\s?/, '');
        }
    }
    
    // Format some special server messages "msg|arg1|arg2..."
    // We would have used localize.getStringMsg() if not for some args manipulation
    function formatServerResonse(msg) {
        msg.text = localize.getStringMsgOpt('msg_' + msg.text) || msg.text;
        processColor(msg);
    }

    function createMessage(name, text, admin, secsAgo, obs, rejected, globalUserId, options) {
        var user = $rootScope.user;
        if (globalUserId)
            globalIdByNickname[name] = globalUserId;
        var date_time = Date.now() - secsAgo * 1000;
        var msg = {
            nickname: name,
            text: text,
            admin: admin,
            date_time: date_time,
            obs: obs,
            type: globalUserId == 0 ? TYPE_SERVER : TYPE_COMMON,
            my: false,
            ngclass: ''
        };
        options = options || {};
        for (var key in options)
            msg[key] = options[key];

        if (Game.players.myId >= 0 && Game.players.get(Game.players.myId).nickname == msg.nickname) {
            msg.type = TYPE_PRIVATE;
            msg.my = true;
        }

        if (secsAgo == 0)
            chatHistoryRecieved = true;

        if (secsAgo != 0 && chatHistoryRecieved == true)
            return "";

        if (admin) {
            processColor(msg);
            if ((msg.red || msg.green) && globalUserId)
                msg.type = (msg.type == TYPE_PRIVATE) ? TYPE_PRIVATE_MOD : TYPE_MOD;
        }

        // censoring
        var censors = getServerProperty("censors");
        //censors = ["en", "multi", "ru", "caps"];
        if (name != "SERVER" && !rejected && !msg.red && !msg.green &&
            !msg.my &&
            typeof censors != "undefined")
        {
            var censored = censorManager.process(msg.text, Game.players.getNicknames(), censors);
            if (censored != msg.text) {
                if (censored == "")
                    msg.hideCensored = true;
                else
                    msg.censored = censored;
                // non-mods can't switch between two views quickly to study it
                if ((user.perm_mask & 2) == 0) {
                    if (!$scope.hasFilter(CENS_DISABLED)) {
                        msg.text = msg.hideCensored ? "" : (msg.censored || msg.text);
                    }
                    delete msg.hideCensored;
                    delete msg.censored;
                }
            }
        }
        
        var retText = name == "SERVER" ? "" :
                $scope.hasFilter(CENS_DISABLED) ? msg.text :
                msg.hideCensored ? "" : (msg.censored || msg.text);
        
        // old code (validator.min.js): msg.text = sanitize(msg.text).entityEncode();;
        msg.text = sanitizeLite(msg.text);
        if (msg.censored)
            msg.censored = sanitizeLite(msg.censored);

        if (Game.players.myId) {
            var nickname = Game.players.get(Game.players.myId).nickname;
            if (nickname && nickname.length > 0) {
                nickname = nickname.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
                var regexp = RegExp('@' + nickname + '\\b', 'ig');
                if (regexp.test(msg.text)) {
                    msg.type = msg.type == TYPE_PRIVATE_MOD || msg.type == TYPE_MOD
                        ? TYPE_PRIVATE_MOD : TYPE_PRIVATE;
                    msg.text = msg.text.replace(regexp, '<b class="me">$&</b>');
                    if (msg.censored)
                        msg.censored = msg.censored.replace(regexp, '<b class="me">$&</b>');
                }
            }
        }

        // format special server responses
        if (rejected) {
            if (Game.gameChatReadOnlyExpires > Date.now()) {
                // Check RO first because a server may allow
                // guests to talk, so guest =/=> always ask to register.
                msg.special = 'RO';
                msg.moment = $sce.trustAsHtml(moment(Game.gameChatReadOnlyExpires)
                        .format('[<b>]H:mm[</b>] DD.MM.YY'));
            } else if (!user.isRegistered()) {
                // The user is not fully registered yet, let's see why.
                // Because perm_mask&1==0, he can't have an identity.
                // If he has entered an email, ask to cnofirm it.                
                // If he has no mail, ask him to register.                
                msg.special = user.email ? 'email' : 'guest';
            } else {
                // In case if a server thinks that a user is in RO, but the 
                // client doesn't know the RO date.                
                // Idk if it can happen, maybe this code can be safely removed
                msg.special = 'RO';
                msg.moment = '';
            }
            /* Old logic (for the refence):
            if (user.is_guest) {
                msg.special = 'guest';
            } else if ((user.perm_mask&1) == 0) {
                msg.special = 'email';
            } else {
                msg.special = 'RO';
                msg.moment = moment(Game.gameChatReadOnlyExpires).format('[<b>]H:mm[</b>] DD.MM.YY');
            }
            */
        }else if (options.ignoreList) {
            msg.special = "ignoreList";
        }else if (name == "SERVER") {
            formatServerResonse(msg);
        }
        
        if (IgnoreService.isIgnored(globalUserId) && msg.type != TYPE_PRIVATE_MOD) {
            msg.hidden = defaultIgnoresHidden;
            msg.ngclass += 'ignored ';
            recentlyIgnored.push(msg);
            if (msg.hidden)
                retText = "";
        }
        
        var d = new Date(date_time)
        msg.time = (d.getHours() + ':' + d.getMinutes())
                        .replace(/^(\d{1,2})\:(\d{1})$/, '$1:0$2');
        msg.showTime = false;
        if (date_time - oldTime > SHOW_TIME_INTERVAL && !msg.hideCensored && !msg.hidden) {
            oldTime = date_time;
            msg.showTime = true;
        }
        if (msg.hideCensored && date_time - Math.max(oldTime, oldCensTime) > SHOW_TIME_INTERVAL) {
            oldCensTime = date_time;
            msg.showTime = true;            
        }
        if (msg.hidden && date_time - Math.max(oldTime, oldHiddenTime) > SHOW_TIME_INTERVAL) {
            oldHiddenTime = date_time;
            msg.showTime = true;            
        }

        pushMessage(msg);
        
        return retText;
    }
    function scrollChat() {
        if (!$scope.hasFilter(SCROLL_DISABLED))
            Utils.scroll($scope, document.querySelector('#chat ul.chat-list'), 1e7);
    }    
    function pushMessage(msg) {
        if (msg.text == "" && msg.special == null)
            return;
        
        msg.ngclass = msg.ngclass || '';
        if (msg.obs) msg.ngclass += 'obs ';
        if (msg.red) msg.ngclass += 'red ';
        if (msg.green) msg.ngclass += 'green ';
        if (msg.killinfo) msg.ngclass += 'kill-info ';
        
        msg.text = $sce.trustAsHtml(msg.text);
        if (msg.censored)
            msg.censored = $sce.trustAsHtml(msg.censored);        
        
        $scope.chat.push(msg);
        Utils.digest($scope);

        if (!msg.hidden)
            scrollChat();
    }
    Game.on('gameEventChat', createMessage);

    Game.on('gameNecroLog', function(who, whom, me){
        if (!me)
            return;
        var d, now = ((d = new Date).getHours() + ':' + d.getMinutes()).replace(/^(\d{1,2})\:(\d{1})$/, '$1:0$2');
        $li = $('<li>');

        if (who.length != 0){
            $li.append(
                '<i class="ico grid"></i> ',
                $('<span class="who">').text(who.join(', ')),
                ' <i class="ico bombed"></i> ',
                $('<span class="whom">').text(whom.join(', '))
            )
        } else {
            $li.append(
                '<i class="ico grid"></i> <i class="ico self-bombed"></i> ',
                $('<span class="whom">').text(whom[0])
            )
        }

        pushMessage({
            killinfo: true,
            text: $li.html(),
            time: now,
            type: TYPE_KILL
        });
    })

    var myLastChatMsg = '';

    Game.on('gameEventSendChat', function(msg) {
        if (~msg.indexOf('--s'))
            return '';

        if (msg == '.щиы' || msg == '/obs') {
            Game.appObserverMode(!Game.appObserverMode());
            return '';
        }
        var m = msg.match(/^\/(\w+)\s+@(\S+)\s*(.*)$/);
        if (m) {
            m = m.slice(1);
            switch (m[0]) {
            case 'watch':
                Game.appObserverWatchPlayer(m[1]);
                return '';
            case 'w':
            case 'warn':
                var hasText = m[2].replace(/\s|@(\S+)/g, '').length > 0;
                return '! @' + m[1] + ' ' + m[2] + (hasText ? '' : i18nFilter('chat_warn'));
            }
        }
        return msg;
    })
    
    $scope.nicknameChat = '';
    var idChat = null;
    $scope.chatClickHandler = function () {
        var msg = $('#msgText');
        var nickname = $scope.nicknameChat;
        window.setTimeout(function() {
            msg.val(msg.val() + '@' + nickname + ' ')[0].focus();
            //console.log(msg);
            msg[0].selectionStart += nickname.length+2;
            msg[0].selectionEnd += nickname.length+2;
        }, 0);
    }
    $(document).on('click', '#chat ul li b.nickname', function() {
        var self = this;
        $scope.$apply(function() {
            var nickname = $(self).text().replace('[obs] ', '');
            $scope.nicknameChat = nickname;
            idChat = globalIdByNickname[$scope.nicknameChat];
            $scope.$emit("nicknamePopup", $(self));
        })
    });

    $scope.postToCommunity = function(type) {
        if (idChat)
            community.open({type: type, userId: idChat});
    }
    $scope.openCommunity = function() {
        community.open(null);
    }
    
    $scope.canShowWhoIs = function() {
        var name = $scope.nicknameChat;
        return ($rootScope.user.perm_mask & 2) && name &&
            (globalIdByNickname[name] || (name.indexOf('*') < 0 && name != "SERVER"));
    }
    $scope.showWhoIs = function() {
        var req = idChat ? "id="+idChat : "name=" + $scope.nicknameChat;
        $http.get('/api/v2/whois?' + req).success( function(data) {
            var res = "# ";
            if (data.id == null) {
                res += "no results";
            }else {
                res += data.name;
                if ($rootScope.user.perm_mask & 4)
                    res += " (id=" + data.id + ")";
                res += data.oldNames.length ? " was known as: " + data.oldNames.join(', ') : ", no other names";
            }
            createMessage("SERVER", res, true, 0, false, false, 0);
        });
    }
    
    $scope.canIgnore = function() {
        return idChat && idChat != $rootScope.user.id &&
            !IgnoreService.isIgnoredByMe(idChat);
    }
    $scope.canStopIgnoring = function() {
        return idChat && IgnoreService.isIgnoredByMe(idChat);
    }
    $scope.ignore = function(hours) {
        function cb() {
            pushMessage({
                nickname: "SERVER",
                text: i18nFilter(hours ? 'you_started_ignoring' : 'you_stopped_ignoring') +
                        ' ' + $scope.nicknameChat,
                time: Date.now(),
                type: TYPE_SERVER
            });
        }
        if (hours)
            IgnoreService.add(idChat, $scope.nicknameChat, hours, cb);
        else
            IgnoreService.remove(idChat, cb);
    }
    $scope.showIgnored = function(msg) {
        msg.ignoresHidden = !msg.ignoresHidden;
        for(i=0; i<msg.ignoreList.length; i++)
            msg.ignoreList[i].hidden = msg.ignoresHidden;
        Utils.digest($scope);
        scrollChat();
    }
    function pushRecentlyIgnored() {
        if (oldIgnoreTime == 0 && recentlyIgnored.length > 0)
            oldIgnoreTime = recentlyIgnored[0].date_time || Date.now();
        if (recentlyIgnored.length > 0 &&
            (recentlyIgnored.length >= MAX_IGNORED ||
            Date.now() - oldIgnoreTime > SHOW_IGNORED_INTERVAL))
        {
            oldIgnoreTime = Date.now();
            options = {
                ignoreList: recentlyIgnored,
                ignoresHidden: defaultIgnoresHidden
            };
            recentlyIgnored = [];
            createMessage("SERVER", "", true, 0, false, false, 0, options);
        }
    }
    var ignoredInerval = setInterval(pushRecentlyIgnored, 1000);

    //$scope.msgHello = function() {
    //    Game.emit("gameEventChat",
    //        'bombermine',
    //        '! Hey! We\'re inviting:\n 1. Country community leaders\n2. Moderators\n3. Translators\n4. Artists/Illustrators\n5. Skinmakers\n\nAlso we\'re welcome for partnership in hosting servers for your country.\nLet us know via bombermine.com@gmail.com',
    //        true,
    //        0
    //    );
    //}

    $scope.clearChat = function () {
        $scope.chat = [];
        oldTime = oldCensTime = oldHiddenTime = oldIgnoreTime = 0;
        chatHistoryRecieved = false;
        recentlyIgnored = [];
        $(".chat_list").scrollTop(0);
    }
    $scope.$on('clear chat', $scope.clearChat);

    $scope.$on('$destroy', function() {
        clearInerval(ignoredInerval);
        storage.setItem('game/chatFilters', $scope.filtered);
        $(document).unbind('click', chatClickHandler);
    });

});
