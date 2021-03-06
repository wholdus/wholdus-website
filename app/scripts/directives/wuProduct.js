(function() {
    'use strict';
    webapp.directive('wuProduct', function() {
        return {
            restrict: 'AE',
            scope: {
                product: '=',
                store: '=',
            },
            replace: true,
            templateUrl: 'views/directives/wuProduct.html',
            controller: [
                '$scope',
                '$log',
                'APIService',
                'LoginService',
                '$rootScope',
                'DialogService',
                '$mdDialog',
                '$mdMedia',
                '$q',
                'ConstantKeyValueService',
                '$routeParams',
                '$window',
                function($scope, $log, APIService, LoginService, $rootScope, DialogService, $mdDialog, $mdMedia, $q, ConstantKeyValueService, $routeParams, $window) {

                    $scope.shortlistApiCall = null;

                    function toggleShortlistHelper() {
                        $scope.shortlisted = !$scope.shortlisted;
                        if(!$scope.shortlistApiCall) {
                            $scope.shortlistApiCall = APIService.apiCall('PUT', APIService.getAPIUrl('allBuyerProducts'), {
                                productID: $scope.product.productID,
                                responded: $scope.shortlisted ? 1 : 2
                            });
                            $scope.shortlistApiCall.then(function(response) {
                                $scope.shortlistApiCall = null;
                            }, function(error) {
                                $scope.shortlistApiCall = null;
                            });
                        }
                    }

                    $scope.toggleShortlist = function(ev) {
                        if(LoginService.checkLoggedIn()) {
                            toggleShortlistHelper();
                        } else {
                            DialogService.viewDialog(ev, {
                                view: 'views/partials/loginPopup.html',
                            }).finally(function() {
                                if(LoginService.checkLoggedIn()) {
                                    $rootScope.$broadcast('checkLoginState');
                                    // toggleShortlistHelper();
                                }
                            });
                        }
                    };

                    function openLotPopup(event, product, lots) {
                        return $mdDialog.show({
                            controller: 'LotPopupController',
                            templateUrl: 'views/partials/lotSelectPopup.html',
                            parent: angular.element(document.body),
                            targetEvent: event,
                            clickOutsideToClose: true,
                            fullscreen: $mdMedia('xs') || $mdMedia('sm'),
                            locals: {
                                product: product,
                                lots: lots
                            }
                        });
                    }

                    function addToCartHelper(product, lots) {
                        if($scope.atcAPICall) return;
                        var deferred = $q.defer();

                        var data = {
                            productID: product.productID,
                            lots: lots,
                            added_from: ConstantKeyValueService.cartTrack.added_from.homepage
                        };
                        $scope.atcAPICall = APIService.apiCall("POST", APIService.getAPIUrl('cartItem'), data);
                        $scope.atcAPICall.then(function(response) {
                            $scope.atcAPICall = null;
                            $scope.product.lotsInCart = lots;
                            deferred.resolve();
                        }, function(error) {
                            $scope.atcAPICall = null;
                            ToastService.showActionToast("Sorry! Couldn't add product to consignment", 5000, "ok");
                            deferred.reject();
                        });

                        return deferred.promise;
                    }

                    $scope.productEditPopup = function(event) {
                        return $mdDialog.show({
                            controller: 'ProductDiscountPopupController',
                            templateUrl: 'views/partials/productDiscountPopup.html',
                            parent: angular.element(document.body),
                            targetEvent: event,
                            clickOutsideToClose: true,
                            fullscreen: $mdMedia('xs'),
                            locals: {
                                product: $scope.product,
                            }
                        }).then(function(details) {
                            $scope.product.buyerstore = details.product.buyerstore;
                        });
                    };

                    $scope.toggleCartStatus = function(event) {
                        if($scope.product.lotsInCart > 0) {
                            addToCartHelper($scope.product, 0);
                        } else {
                            if(LoginService.checkLoggedIn()) {
                                openLotPopup(event, $scope.product, 1).then(function(lots) {
                                    addToCartHelper($scope.product, lots);
                                });
                            } else {
                                DialogService.viewDialog(event, {
                                    view: 'views/partials/loginPopup.html',
                                }).finally(function() {
                                    if(LoginService.checkLoggedIn()) {
                                        $rootScope.$broadcast('checkLoginState');
                                        openLotPopup(event, $scope.product, 1).then(function(lots) {
                                            addToCartHelper($scope.product, lots);
                                        });
                                    }
                                });
                            }
                        }
                    };

                    $scope.placeOrder = function(event, product) {
                        return $mdDialog.show({
                            controller: 'PlaceOrderPopupController',
                            templateUrl: 'views/store/placeOrder.html',
                            parent: angular.element(document.body),
                            targetEvent: event,
                            clickOutsideToClose: true,
                            fullscreen: $mdMedia('xs'),
                            locals: {
                                product: product,
                            }
                        });
                    };

                    function init() {
                        if($scope.store) {
                            $scope.product.url = "/store/" + $routeParams.storeUrl + '/' + $scope.product.slug + '-' + $scope.product.productID;
                        }
                        if(LoginService.checkLoggedIn()) {
                            $scope.shortlisted = $scope.product.response.response_code == 1;
                            $scope.loggedIn = true;
                        } else {
                            $scope.shortlisted = false;
                            $scope.loggedIn = false;
                        }
                    }
                    init();

                }
            ]
        };
    });
})();
