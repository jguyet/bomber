bombermine.directive('gamePreview', function(Game) {
    return {
        restrict: 'A',
        scope: {
            selectedSkin: "@gamePreview"
        },
        link: function(scope, elem, attrs) {
            if (!Game.previewAttach) return;
            var canvas = elem[0];
            Game.previewAttach(canvas);
            scope.$watch("selectedSkin", function(newVal, oldVal) {
                Game.previewSetSkin(newVal, canvas);
            });
            scope.$on('$destroy', function () {
                Game.previewDetach(canvas);
            });
        }
    }
});
