bombermine.controller('NextRankCtrl', function($location, $scope, $rootScope, $http, localize, Social, Keys, Game) {

  $scope.show = true;

  $scope.scoreboardNextRankClose = function() {
    $scope.show = false;
  }

  $scope.newLevel = {
    number: 27,
    name: "Rookie",
    exp: 2134
  };
  
  $scope.perkUnlock = [
    {name:'perks-autoshield', level:'5'}, 
    {name:'perks-autojetpack', level:'2'}, 
    {name:'perks-immune', level:'1'}, 
    {name:'perks-premium', level:'6'}, 
    {name:'perks-atomic1', level:'3'}, 
    {name:'perks-atomic2', level:'3'}, 
    {name:'perks-money1', level:'4'}, 
    {name:'perks-battle1', level:'2'}];

  $scope.perkPresents = [
    {name:'perks-autoshield', time:'6000'}, 
    {name:'perks-autojetpack', time:'100'}, 
    {name:'perks-immune', time:'13000'}, 
    {name:'perks-premium', time:'900'}, 
    {name:'perks-atomic1', time:'86000'}, 
    {name:'perks-atomic2', time:'7000'}, 
    {name:'perks-money1', time:'200'}, 
    {name:'perks-battle1', time:'600'}];
});