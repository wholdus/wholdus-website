    (function() {
    webapp.directive('wuSidenav', function() {
         return {
            restrict: 'AE',
            templateUrl: 'views/directives/wuSidenav.html',
            controller: [
                '$scope',
                '$rootScope',
                '$log',
                'APIService',
                '$mdSidenav',
                '$timeout',
                '$location',
                function($scope, $rootScope, $log, APIService, $mdSidenav, $timeout, $location) {

                    var listeners = [];

                    function getCategory(params) {
                        APIService.apiCall("GET", APIService.getAPIUrl("category"))
                            .then(function(response) {
                                $scope.categories = response.categories;
                            }, function(error) {
                                $scope.categories = [];
                        });
                    }
                    getCategory();

                    function closeSidenav() {
                        $mdSidenav('left').close();
                    }

                    $scope.goTo = function(event, url) {
                        event.preventDefault();
                        $location.url(url);
                        $timeout(function() {
                            closeSidenav();
                        }, 500);
                    };

                    function toggleSidenav() {
                        closeSidenav();
                        $mdSidenav('left').toggle();
                    }

                    var toggleSidenavListener = $rootScope.$on('toggleSidenav', function(event, data) {
                        toggleSidenav();
                    });
                    listeners.push(toggleSidenavListener);

                    $scope.$on("$destroy", function() {
                        angular.forEach(listeners, function(value, key) {
                            if(value) value();
                        });
                    });
                }
            ]
        };
    });
})();