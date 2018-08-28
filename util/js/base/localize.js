'use strict';

var common = angular.module('common', []);

common.factory('localize', ['$http', '$rootScope', '$window', '$filter', 'storage', function ($http, $rootScope, $window, $filter, storage) {
    // if these types are used somwhere else, move them to global constants
    var PERK_TYPE_COUNT = 2;
    var PERK_TYPE_SECONDS = 4;
    
    var regexSwitch = /\$(\d+)\[([^\]]+)\]/g
    var regexIfElse = /\$(\d+){([^}]*)}(?:{([^}]*)})?/g
    var regexPlace =  /\$(\d+)/g
    var regexFunc =   /\$t\(([^)]*)\)/g
    var regexChar =   /&#(\d+);/g
    
    var localize = {
        dictionary: null,
        loaded: false,
        success: function(data) {
            $rootScope.currentLocale = storage.getItem('locale', window.config.lang || 'en');
            localize.dictionary = data;
        },
        init: function () {
            localize.success(window.lang)
        },
        /*
            Returns localized string or null
            
            It can return concatenated i18n strings for composite keys like
            key1+key2+key3
            For composite keys index must be null.
            Each key part may end with some non-word characters, they'll be
            removed from the key and added to the result, for example:
            key1. +key2
        */
        getStringOpt: function(key, index) {
            if (localize.dictionary == null)
                return null;
            var obj = localize.dictionary[key];
            if (obj == null) {
                // if the key is not composite, then it's not found
                if (index != null || typeof key !== "string" || key.indexOf('+') < 0)
                    return null;
                
                // the key is composite, check each part independently
                var keys = key.split('+');
                var result = "";
                for(var i=0; i<keys.length; i++) {
                    // save non-word tail characters
                    var tail = '';
                    keys[i] = keys[i].replace(/\W+$/g, function(match) {
                        tail = match;
                        return '';
                    });
                    // translate
                    var r = localize.getStringOpt(keys[i]);
                    // if at least one part is not found, then fail
                    if (r == null)
                        return null;
                    result += r + tail;
                }
                return result;
            }
            while (typeof obj === "string") {
                var objValue = localize.dictionary[obj];
                if (objValue) {
                    // go through references to other objects (aliases) once
                    obj = localize.dictionary[key] = objValue;
                }else {
                    // replace a string to an object holding localize.string once
                    var t = obj;
                    obj = localize.dictionary[key] = {};
                    obj[$rootScope.currentLocale] = t;
                    break;
                }
            }
            // now obj is an object that may hold our value
            var v = obj[$rootScope.currentLocale] || obj["en"];
            if (typeof v === "undefined")
                return null;
            // we assume that v is either a sting or an array of strings
            // no checks for other types are made to increase speed
            if (index == null) { // whole string is requested
                if (typeof v === "string")
                    return v;
                // it should not happen, return the initial string
                return v.join('|');
            }else { // a part is requested
                // turn a string into an array of parts on first request
                if (typeof v === "string")
                    v = obj[$rootScope.currentLocale] = v.split('|');
                return v[index] || '';
            }
        },
        // returns string or key or "key[index]"
        // supports composite keys (see getStringOpt() )
        getString: function(key, index) {
            var res = localize.getStringOpt(key, index);
            return res != null ? res // ok, found localization
                : (index == null ? key : '' + key + '[' + index + ']'); // fail
        },
        withCorrectEnding: function(key, number) {
            var modKey = key;
            switch($rootScope.currentLocale) {
            case "ru":
                if ((~~(number/10))%10 != 1) {
                    number %= 10;
                    if (number == 1) modKey += "_ru1";
                    else if (number >= 2 && number <= 4) modKey += "_ru2";
                }
                break;
            }
            return localize.getStringOpt(modKey) || localize.getString(key);
        },
        /*
            parts[0] is a string with placeholders (indexed from 1)
            parts[1..] are values
            
            // TODO: add withCorrectEnding support here
            
            Let i, j be integer numbers, Ai - i-th argument.
            Placeholders:
              $i - replaced by Ai
              $i[V0,V1,...] - replaced by Vj where j is a numeric value of Ai
                (if Ai can't be converted to a numver, it's not replaced)
              $i{V} is replaced with V if Ai is a symbolic representation of 
                a true-like value, else it's removed
                Exact condition:
                    (arg && arg !== 'false' && arg !== '0' 
                    && arg !== 'null' && arg !== 'undefined')                
              $i{V1}{V2} is replaced with V1 if Ai is a symbolic representation of 
                a true-like value, else V2
            Functions (can contain placeholders or be themselves inside placeholders values):
              $t(text) - translates text if possible
            To use comma or brackets inside [], {} or (), use their HTML codes, 
            e.g. comma is "&#44;".
        */
        formatArr: function(parts) {
            if (!parts || !parts[0] || !parts[0].replace) return parts;
            return parts[0].replace(regexSwitch, function(match, ind, inBrackets) {
                // regexSwitch = /\$(\d+)\[([^\]]+)\]/g
                var arg = parts[ind | 0];
                if (arg === '') return match; // because Number('') === 0
                var argNum = Number(arg);
                return argNum === (argNum | 0) ? inBrackets.split(',')[argNum] : match;
            }).replace(regexIfElse, function(match, ind, inBrackets, inBrackets2) {
                // regexIfElse = /\$(\d+){([^}]*)}(?:{([^}]*)})?/g
                var arg = parts[ind | 0];
                return (arg && arg !== 'false' && arg !== '0' 
                        && arg !== 'null' && arg !== 'undefined')
                    ? inBrackets
                    : inBrackets2 || '';
            }).replace(regexPlace, function(match, ind) {
                // regexPlace = /\$(\d+)/g
                return parts[ind | 0];
            }).replace(regexFunc, function(match, inBrackets) {
                // regexFunc = /\$t\(([^)]*)\)/g
                return localize.getString(inBrackets);
            }).replace(regexChar, function(match, ind) {
                // regexChar = /&#(\d+);/g
                return String.fromCharCode(ind);
            });
        },
        format: function(varArgs) {
            return localize.formatArr(arguments);
        },
        /*
            Used for standard server responses like "msg_key|arg1|arg2|..."
            First msg_key gets localized, then placeholders inside msg_key are replaced.
            If there are no "|", it's the same as getString(), but a bit slower.
        */
        getStringMsgOpt: function(msg) {
            if (typeof msg !== 'string') 
                return null;
            // quick check - if it's a regular string key
            var wholeString = localize.getStringOpt(msg);
            if (wholeString != null)
                return wholeString;
            // it's a message, split and process it
            var parts = msg.split('|');
            if (parts.length <= 1) // we already know that msg i18n is not found
                return null;
            // preprocess
            localize.preprocessSpecialMsg(parts);
            // localize & format
            parts[0] = localize.getStringOpt(parts[0]);
            return parts[0] != null ? localize.formatArr(parts) : null;
        },
        getStringMsg: function(msg) {
            var res = localize.getStringMsgOpt(msg);
            return res != null ? res : msg;
        },
        preprocessSpecialMsg: function(parts) {
            switch(parts[0]) {
            case "msg_perk_added":
                if (parts[2] == PERK_TYPE_SECONDS)
                    parts[1] /= 60; // show the time in minutes
                parts[2] -= PERK_TYPE_COUNT; // make type number starts with 0
                parts[3] = localize.getString("perk_" + parts[3]);
                break;
            }
        }
    };

    localize.init()
    window.setLocale = function(val) {
        localize.success(window.lang);
        $rootScope.$apply(function() {
            $rootScope.currentLocale = val;
        })
    };

    return localize;
}])
.filter('i18n', ['localize', function(localize) {
    return function(input, index) {
        var s = localize.getString(input, index);
        if (s=='') return "`"+input+"`";
        return s;
    };
}]).filter('format', ['localize', function(localize) {
    // This function just formats the string, desn't localize it.
    // It is decoupled from i18n for greater flexibility.
    return localize.format;
}]).filter('i18nHtml', ['$sce', 'localize', function($sce, localize) {
    return function(input, index) {
        var s = localize.getString(input, index);
        if (s=='') return "`"+input+"`";
        return $sce.trustAsHtml(s);
    };
}]);