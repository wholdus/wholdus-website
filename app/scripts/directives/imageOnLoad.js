(function() {
    'use strict';
    webapp.directive('imageOnLoad', function() {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {

                element.bind('load', function() {

                    scope.$apply(attrs.imageOnLoad);
                });
                element.bind('error', function(){
                    
                });
            }
        };
    })
})();