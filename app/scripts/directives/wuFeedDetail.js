(function() {
    webapp.directive('wuFeedDetail', function() {
        return {
            restrict: 'AE',
            templateUrl: 'views/directives/wuFeedDetail.html',
            controller: [
                '$scope',
                '$location',
                '$log',
                '$rootScope',
                '$element',
                function($scope, $location, $log, $rootScope, $element) {
                    var listeners = [];

                    $scope.showDetailsButton = true;

                    function init() {
                        $scope.product = null;
                    }

                    var productToShowListener = $rootScope.$on('productToShow', function(event, data) {
                        if(data) {
                            $scope.product = data;
                        } else {
                            $scope.product = null;
                        }
                    });
                    listeners.push(productToShowListener);

                    $scope.showDetails = function(type) {
                        if(type==1) {
                            $scope.showDetailsButton = false;
                        } else {
                            $scope.showDetailsButton = true;
                        }
                    };

                    $scope.favButton = function() {
                        $rootScope.$broadcast('addToFav', $scope.product);
                    };

                    init();

                    $scope.$on('$destroy', function() {
                        angular.forEach(listeners, function(value) {
                            if(value) value();
                        });
                    });
                }
            ]
        };
    });
})();