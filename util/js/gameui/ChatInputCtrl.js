bombermine.controller('ChatInputCtrl', function($scope, Game) {
    function fuzzyMatch(input, query, re){
        var index = found = distance = 0, len = query.length, query = query.toLowerCase();

        if (~(distance = input.toLowerCase().indexOf(query.toLowerCase()))){
            return {'distance': distance, 'name': input.replace(RegExp(query.replace('*', '\\*'), 'i'), '<b>$&</b>')}
        } else distance = 0;

        if(!re.test(input)) return false;

        while (~index && found < len) {

            index = input.toLowerCase().indexOf(query.substr(found++, 1), found == 1 ? 0 : index + 7);

            if (!~index && found < len) return false;

            distance += found == 1 ? index : index - 7 * (found - 1);
            input = input.substr(0, index) + '<b>' + input.substr(index, 1) + '</b>' + input.substr(index + 1, input.length - 1);
        }

        return {'distance': distance, 'name': input}
    }

    translit = function(s){
        var letters = {'а':'a', 'б':'b', 'в':'v', 'г':'g', 'д':'d', 'е':'e', 'ё':'e', 'ж':'zh', 'з':'z', 'и':'i', 'й':'y', 'к':'k', 'л':'l', 'м':'m', 'н':'n', 'о':'o', 'п':'p', 'р':'r', 'с':'s', 'т':'t', 'у':'u', 'ф':'f', 'х':'h', 'ц':'ts', 'ч':'ch', 'ш':'sh', 'щ':'sch', 'ъ':'', 'ь':'', 'ы':'y', 'э':'e', 'ю':'yu', 'я':'ya'};

        return s.toLowerCase()

        .replace(/си/, 'c')
        .replace(/дж/, 'j')
        .replace(/кс/, 'x')
        .replace(/ье|ьё/g, 'je')
        .replace(/ый/g, 'y')
        .replace(/[а-яё]/g, function(i){return letters[i]});
    }
	
	Game.on("isMentionsOpened", function() {
		$("#msgText .mentions").is(":visible")
	})

    $('#msgText').attr('placeholder', 'Message (ENTER — send)').mentionsInput({
        elastic: false,
        minChars: 1,
        showAvatar: false,
        onDataRequest: function (mode, query, callback) {
            if (query.length == 0)
                return false;
			
            if (/[а-яё]+/.test(query))
                query = translit(query);

            var data = [], results = [], matched;

            try {
				var s1 = query.split('').map(function(s) { return s=='*'?'\\'+s:s }).join(').*?(');
                var re = new RegExp(('(' + s1 +')').replace(/\(\.\)/g, '(\\.)'), 'i');
            } catch(e) {
                return;
            }

            data = Game.players.getNicknames();

            if (data.length == 1)
                return;

            data.forEach(function(name) {

                if (matched = fuzzyMatch(name, query, re)) {
                    matched.id = 0;
                    matched.type = 'player';
                    results.push(matched);
                }

            });

            if (results.length > 0)
                callback.call(this, results.sort(function(a, b){ return a.distance - b.distance }).splice(0, 5));
            else
                return;

        }
    })
    
})
