(function() {
    "use strict";
    webapp.factory('LoginService', [
        'ConstantKeyValueService',
        '$rootScope',
        'APIService',
        '$q',
        'localStorageService',
        function(ConstantKeyValueService, $rootScope, APIService, $q, localStorageService) {
            var factory = {};

            factory.loginStatus = false;
            factory.buyer = {};

            function loginSuccess(response) {
                factory.loginStatus = true;
                ConstantKeyValueService.token = response.access_token;
                localStorageService.set(ConstantKeyValueService.accessTokenKey, response.access_token);
                var buyerData = {
                    mobile: response.buyer.mobile_number,
                    name: response.buyer.name,
                    id: response.buyer.buyerID,
                    store_url: response.buyer.store_url
                };
                localStorageService.set(ConstantKeyValueService.buyerDetailKey, buyerData);
            }

            factory.getBuyerInfo = function() {
                var buyerData = localStorageService.get(ConstantKeyValueService.buyerDetailKey) || {};
                return buyerData;
            };

            factory.setAccessToken = function(response) {
                loginSuccess(response);
            };

            factory.checkLoggedIn = function() {
                var token = localStorageService.get(ConstantKeyValueService.accessTokenKey);
                if(token) {
                    factory.loginStatus = true;
                    ConstantKeyValueService.token = token;
                } else {
                    factory.loginStatus = false;
                }
                return factory.loginStatus;
            };

            factory.logout = function() {
                factory.loginStatus = false;
                ConstantKeyValueService.token = null;
                localStorageService.remove(ConstantKeyValueService.accessTokenKey);
                localStorageService.remove(ConstantKeyValueService.buyerDetailKey);
            };

            factory.login = function(mobile, password) {
                var deferred = $q.defer();
                var data = {
                    mobile_number: mobile,
                    password: password
                };
                var apicall = APIService.apiCall("POST", APIService.getAPIUrl('buyerLogin'), data, null, true, false, false);
                apicall.then(function(response) {
                    loginSuccess(response.buyer_login);
                    deferred.resolve(response.buyer_login);
                }, function(error) {
                    deferred.reject(error);
                });
                return deferred.promise;
            };

            return factory;
        }
    ]);
})();
