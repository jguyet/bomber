bombermine.controller('DeathCtrl', function($location, $scope, $rootScope, $http, localize, Game) {

$scope.show = true;

$scope.scoreboardDeathClose = function() {
	$scope.show = false;
}



$scope.loss = [{name:'items-bomb',loss:3,add:1}, {name:'items-power',loss:2}, {name:'items-scate',add:2}, {name:'items-kick',loss:1,add:2}, {name:'items-shield',add:1}];

$scope.perks = [{name:'perks-autoshield',time:'900'}, {name:'perks-autojetpack',time:'180'}, {name:'perks-immune',time:'1000'}, {name:'perks-premium',time:'60000'}, {name:'perks-atomic1',time:'100'}, {name:'perks-atomic2',time:'300'}, {name:'perks-money1',time:'1800'}, {name:'perks-battle1',time:'10'}];

$scope.tasks = [
	{name: "1 Task number uno", part: "1/4", desc: "dlfgd gsrjgs fsdhgldsg dsjgldg dghldsgds gdhgld dslglds dsljglds dgjldfg gsldjgl ds,gjdlks df,jkg d,gnkd d,gdkl glsje;fokep;"},
	{name: "2 Task number uno", part: "1/4", desc: "dlfgd gsrjgs fsdhgldsg dsjgldg dghldsgds gdhgld dslglds dsljglds dgjldfg"},
	{name: "3 Task number uno", part: "1/4", desc: "dlfgd gsrjgs"},
	{name: "4 Task number uno", part: "1/4", desc: "dlfgd gsrjgs fsdhgldsg dsjgldg dghldsgds gdhgld dslglds dsljglds dgjldfg gsldjgl ds,gjdlks df,jkg d,gnkd d,gdkl glsje;fokep;"}
];

/*$scope.sliderPrev = true;
$scope.sliderNext = true;*/
$scope.slider = function(flag, arr, n, name) {
	var nameSlider = 'slider' + name;
	var j = 0;
	for (var i = 0; i < arr.length; i++) {
		if (arr[i]['show']) {
			j = i;
			break;
		}
	};
	//console.log(j);
	if (flag && j+n < arr.length) {
		arr[j]['show'] = 0;
		arr[j+n]['show'] = 1;
		if (j+n+1 == arr.length) {
			$scope[nameSlider].next = false;
			//$scope.sliderNext = false;
		}
		$scope[nameSlider].prev = true;
		//$scope.sliderPrev = true;
	}
	if (!flag && j > 0) {
		arr[j-1]['show'] = 1;
		arr[j+n-1]['show'] = 0;
		if (j-1 == 0) {
			$scope[nameSlider].prev = false;
			//$scope.sliderPrev = false;
		}
		$scope[nameSlider].next = true;
		//$scope.sliderNext = true;
	}
};
$scope.beforeSlider = function(arr, n, name) {
	var nameSlider = 'slider' + name;
	$scope[nameSlider] = {prev: false, next: true};
	if (arr.length <= n)
		$scope[nameSlider].next = false;
	for (var i = 0; i < arr.length; i++) {
		if (i == n) 
			break;
		arr[i]['show'] = 1;
	};
}
$scope.beforeSlider($scope.loss, 14, 'loss');
$scope.beforeSlider($scope.tasks, 2, 'task');

$scope.beforeSlider($scope.perks, 14, 'perks');

});