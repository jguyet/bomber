var FILTERS = angular.module('filters', [])

FILTERS.filter('tierTitled', function () {
    var TIERS = ['Passerby', 'Friend', 'Supporter', 'Fan', 'Addict'];

    return function (tier) {
        return TIERS[tier];
    }
});

FILTERS.filter('titledRank', function () {
    var RANKS = [
        'Rookie',
        'Private',
        'Private First Class',
        'Corporal',
        'Sergeant',
        'Second Lieutenant',
        'First Lieutenant',
        'Captain',
        'Major',
        'Lieutenant Colonel',
        'Colonel',
        'Brigadier General',
        'Major General',
        'Lieutenant General',
        'General'
    ];

    return function (rank) {
        return RANKS[rank];
    }
});

FILTERS.filter('shortNumber', function () {
    return function (value) {
        if (value < 1000)
            return value;
        else if (value < 10000) {
            var str = value.toString();
            return str.slice(0, 1) + ',' + str.slice(1);
        } else if (value < 1000000) {
            value /= 1000;
            value = value < 100 ? parseFloat(value.toFixed(2)) : parseFloat(value.toFixed(1));
            return value.toString() + 'k';
        } else {
            value /= 1000000;
            value = value < 100 ? parseFloat(value.toFixed(2)) : parseFloat(value.toFixed(1));
            return value.toString() + 'kk';
        }
    }
});

FILTERS.filter('floor', function () {
    return function (value) {
        return ~~Math.floor(value);
    }
});

FILTERS.filter('startFrom', function () {
    return function(input, start) {
        start = +start; //parse to int

        if (!input)
            return;

        return input.slice(start);
    }
});