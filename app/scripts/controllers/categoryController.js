(function() {
    'use strict';
    webapp.controller('CategoryController', [
        '$scope',
        '$routeParams',
        '$route',
        '$http',
        '$window',
        '$mdDialog',
        '$location',
        '$log',
        'UtilService',
        'APIService',
        'ngProgressBarService',
        '$rootScope',
        'DialogService',
        '$q',
        'LoginService',
        function($scope, $routeParams, $route, $http, $window, $mdDialog, $location, $log, UtilService, APIService, ngProgressBarService, $rootScope, DialogService, $q, LoginService) {

            var listeners = [];

            $scope.categoryID = UtilService.getIDFromSlug($routeParams.category);
            $scope.settings = {
                isMobile: UtilService.isMobileRequest(),
                enablePagination: false,
                page: UtilService.getPageNumber(),
                noProduct: false,
                displayName: UtilService.getNameFromSlug($routeParams.category)
            };
            $scope.settings.itemsPerPage = $scope.settings.isMobile ? 18 : 24;
            $scope.sellers = [];
            $scope.selectedSellers = [];
            $scope.isShow = [];
            $scope.sellerString = null;
            $scope.filterID = 1;
            $scope.selectedcolours = '';
            $scope.filterChange = false;
            $scope.activeFilterStyle = {
                '-webkit-transition': 'all 0.4s ease',
                '-moz-transition': 'all 0.4s ease',
                '-o-transition': 'all 0.4s ease',
                '-ms-transition': 'all 0.4s ease',
                'transition': 'all 0.4s ease',
                'background-color': '#D8D8D8',
            };

            function getProductsInCart() {
                var deferred = $q.defer();
                APIService.apiCall("GET", APIService.getAPIUrl('cartItem')).then(function(response) {
                    deferred.resolve(response.cart_items);
                }, function(error) {
                    if(error.error == "Authentication failure") {
                        LoginService.logout();
                        $location.url('/');
                    }
                    deferred.reject(error);
                });
                return deferred.promise;
            }

            function parseCartItems(items) {
                var cartItems = {};
                angular.forEach(items, function(value, key) {
                    cartItems[value.product.productID] = value.lots;
                });
                return cartItems;
            }

            function getProducts() {
                var deferred = $q.defer();
                $scope.filterChange = false;

                if (UtilService.currentCategoryID) {
                    if (UtilService.currentCategoryID != $scope.categoryID) {
                        UtilService.setFilterParams(null);
                        UtilService.resetFilterParams();
                    }
                }

                UtilService.setCategory($scope.categoryID);
                $scope.sellerString = UtilService.sellerString;
                $scope.colours = UtilService.colours;
                $scope.fabrics = UtilService.fabrics;
                $scope.priceRanges = UtilService.priceRanges;
                $scope.selectedColours = UtilService.selectedColours;
                $scope.selectedFabrics = UtilService.selectedFabrics;

                ngProgressBarService.showProgressbar();

                var params = {
                    categoryID: $scope.categoryID,
                    sellerID: $scope.sellerString,
                    min_price_per_unit: UtilService.minPrice,
                    max_price_per_unit: UtilService.maxPrice,
                    colour: $scope.selectedColours,
                    fabric: $scope.selectedFabrics,
                    product_show_online: 1
                };

                UtilService.setPaginationParams(params, $scope.settings.page, $scope.settings.itemsPerPage);
                APIService.apiCall("GET", APIService.getAPIUrl("products"), null, params)
                    .then(function(response) {

                        if (UtilService.priceRangeIndex) {
                            var pos = UtilService.priceRangeIndex;
                            if ($scope.priceRanges[pos].min_value == UtilService.minPrice &&
                                $scope.priceRanges[pos].max_value == UtilService.maxPrice) {
                                $scope.priceRanges[pos].active = true;
                            } else {
                                $scope.priceRanges[pos].active = false;
                            }
                        }

                        $scope.minPrice = UtilService.minPrice;
                        $scope.maxPrice = UtilService.maxPrice;

                        $scope.settings.noProduct = false;

                        ngProgressBarService.endProgressbar();

                        deferred.resolve(response);

                    }, function(error) {
                        ngProgressBarService.endProgressbar();
                        $scope.products = [];
                        $scope.settings.noProduct = true;
                        $scope.settings.enablePagination = false;
                        deferred.reject(error);
                    });

                return deferred.promise;
            }

            function getProductsHelper(response, cartItems) {
                if (response.total_pages > 1) {
                    $scope.settings.enablePagination = true;
                    $rootScope.$broadcast('setPage', {
                        page: $scope.settings.page,
                        totalPages: Math.ceil(response.total_products / $scope.settings.itemsPerPage)
                    });
                } else {
                    $scope.settings.noProduct = false;
                    $scope.settings.enablePagination = false;
                }

                angular.forEach(response.products, function(value, key) {
                    value.lotsInCart = cartItems[value.productID] ? cartItems[value.productID] : 0;
                    value.images = UtilService.getImages(value);

                    if (value.images.length) {
                        value.imageUrl = UtilService.getImageUrl(value.images[0], '300x300');
                    } else {
                        value.imageUrl = 'images/200.png';
                    }
                });

                $scope.products = response.products;

                if ($scope.products.length) {
                    $scope.category = response.products[0].category;
                } else {
                    $scope.settings.noProduct = true;
                    $scope.settings.enablePagination = false;
                }
            }

            function assignSellers(sellersArray) {
                var sellers = [];
                angular.forEach(sellersArray, function(value, key) {
                    var seller = value.seller;
                    seller.sellercategoryID = value.sellercategoryID;
                    sellers.push(seller);
                });
                return sellers;
            }

            function checkSelectedSellers() {
                var selectedSellers = '';
                if (UtilService.sellerString) {
                    selectedSellers = UtilService.sellerString.split(',');
                }

                angular.forEach($scope.sellers, function(value, key) {
                    if (selectedSellers.indexOf(value.sellerID.toString()) >= 0) {
                        value.isShow = true;
                    } else {
                        value.isShow = false;
                    }
                });
            }

            $scope.updatePrice = function(position) {
                angular.forEach($scope.priceRanges, function(p, index) {
                    if (position != index) p.active = false;
                });
                if($scope.priceRanges[position].active) {
                    $scope.priceRangeIndex = position;
                    $scope.minPrice = $scope.priceRanges[position].min_value;
                    $scope.maxPrice = $scope.priceRanges[position].max_value;
                } else {
                    $scope.priceRangeIndex = undefined;
                    $scope.minPrice = undefined;
                    $scope.maxPrice = undefined;
                }
                $scope.filterChange = true;
                // $scope.priceRangeIndex = position;
                // $scope.minPrice = $scope.priceRanges[position].min_value;
                // $scope.maxPrice = $scope.priceRanges[position].max_value;
            };

            $scope.updateColour = function(position) {
                $scope.filterChange = true;
                if (!$scope.colours[position].active) {
                    $scope.colours[position].active = true;
                } else {
                    $scope.colours[position].active = false;
                }
            };

            $scope.updateFabric = function(position) {
                if (!$scope.fabrics[position].active) {
                    $scope.fabrics[position].active = true;
                } else {
                    $scope.fabrics[position].active = false;
                }
            };

            $scope.filterChanged = function() {
                $scope.filterChange = true;
            };

            $scope.applyFilters = function(type) {
                $scope.selectedSellers = [];

                var colours = [];
                var fabrics = [];
                angular.forEach($scope.colours, function(value, index) {
                    if (value.active) {
                        colours.push(value.name);
                    }
                });
                angular.forEach($scope.fabrics, function(value, index) {
                    if (value.active) {
                        fabrics.push(value.name);
                    }
                });
                $scope.selectedFabrics = fabrics.toString();
                $scope.selectedColours = colours.toString();
                angular.forEach($scope.sellers, function(value, key) {
                    if (value.isShow) {
                        $scope.selectedSellers.push(value.sellerID);
                    }
                });

                // $scope.settings.page = UtilService.getPageNumber();

                UtilService.setFilterParams($scope.selectedSellers.toString(),
                    $scope.priceRangeIndex, $scope.minPrice, $scope.maxPrice);
                UtilService.setActiveFilterParams($scope.colours, $scope.fabrics, $scope.selectedColours, $scope.selectedFabrics);

                checkSelectedSellers();

                if(UtilService.getPageNumber() == 1) {
                    locationChangeSuccessHelper();
                } else {
                    $location.search('page', '1');
                }

                if (type == 'desktop') {
                    $scope.desktopFilterID = null;
                } else if (type == 'mobile') {
                    // $route.reload();
                    $mdDialog.cancel();
                }
            };

            $scope.showFilterDialog = function() {
                $mdDialog.show({
                    controller: 'FilterDialogController',
                    templateUrl: 'views/partials/filterDialog.html',
                    parent: angular.element(document.body),
                    targetEvent: event,
                    clickOutsideToClose: true,
                    fullscreen: true,
                    scope: $scope,
                    preserveScope: true
                }).finally(function() {
                    if($scope.activeImage >= $scope.imageLimit) {
                        $scope.setActiveImage(0);
                    }
                });
            };

            $scope.cancel = function() {
                $mdDialog.cancel();
            };

            $scope.clear = function() {
                UtilService.setFilterParams(null, null);
                angular.forEach($scope.sellers, function(value, key) {
                    value.isShow = false;

                });
                UtilService.setFilterParams(null);
                UtilService.resetFilterParams();
                $scope.sellerString = UtilService.sellerString;
                $scope.colours = UtilService.colours;
                $scope.fabrics = UtilService.fabrics;
                $scope.priceRanges = UtilService.priceRanges;
                $scope.selectedColours = UtilService.selectedColours;
                $scope.selectedFabrics = UtilService.selectedFabrics;
                $scope.minPrice = UtilService.minPrice;
                $scope.maxPrice = UtilService.maxPrice;
            };


            $scope.buyNow = function(event, categoryID) {
                DialogService.viewDialog(event, {
                    categoryID: categoryID,
                    view: 'views/partials/buyNow.html'
                });
            };

            function locationChangeSuccessHelper() {
                var loggedIn = false,
                    promises = [],
                    cartItems = {};

                if (LoginService.checkLoggedIn()) {
                    loggedIn = true;
                    promises.push(getProductsInCart());
                }
                promises.push(getProducts());

                $q.all(promises).then(function(response) {
                    if (loggedIn) {
                        cartItems = parseCartItems(response[0]);
                        response = response[1];
                    } else {
                        response = response[0];
                    }
                    getProductsHelper(response, cartItems);
                });
            }

            var checkLoginStateListener = $rootScope.$on('checkLoginState', function() {
                getProducts().then(function(response) {
                    getProductsHelper(response, {});
                });
            });
            listeners.push(checkLoginStateListener);

            var loginStateChangeListener = $rootScope.$on('loginStateChange', function() {
                getProducts().then(function(response) {
                    getProductsHelper(response, {});
                });
            });
            listeners.push(loginStateChangeListener);

            var locationChangeListener = $scope.$on('$locationChangeSuccess', function() {
                $scope.settings.page = UtilService.getPageNumber();
                locationChangeSuccessHelper();
            });
            listeners.push(locationChangeListener);

            var destroyListener = $scope.$on('$destroy', function() {
                UtilService.resetFilterParams();
                UtilService.setFilterParams(null);
                angular.forEach(listeners, function(value, key) {
                    if (value) value();
                });
            });
            listeners.push(destroyListener);

            function init() {
                var promises = [],
                    cartItems = {},
                    loggedIn = false;
                $scope.sellersSet = false;

                if (LoginService.checkLoggedIn()) {
                    loggedIn = true;
                    promises.push(getProductsInCart());
                }
                promises.push(getProducts());

                $q.all(promises).then(function(response) {
                    if (loggedIn) {
                        cartItems = parseCartItems(response[0]);
                        response = response[1];
                    } else {
                        response = response[0];
                    }
                    if (response.products && response.products.length > 0 && !$scope.sellersSet) {
                        $scope.sellersSet = true;
                        $scope.sellers = assignSellers(response.products[0].category.seller_categories);
                        checkSelectedSellers();
                    }
                    getProductsHelper(response, cartItems);
                });
            }
            init();
        }
    ]);
})();
