angular.module('starter.directives', [])
.directive('ngHold', ['$ionicGesture', function($ionicGesture) {

return {
    restrict: 'A',
    link: function($scope, $element, $attr) {
         var scope=$scope;        
        $ionicGesture.on('hold', function(e) {
          scope.$apply($attr.ngHold);
        },$element);
    }
}
}])