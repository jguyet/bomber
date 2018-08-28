bombermine.controller('NotificationsCtrl', function($scope) {
  var id = 0;
  $scope.notifications = [];

  $scope.$on('addNotification', function(event, data) {
    $scope.notifications.push({
      id: id++,
      msg: data
    });
    console.log(data);
  });

  $scope.close_notification = function(id) {
    $scope.notifications.shift();
    $("#notification" + id).hide()
  }

});