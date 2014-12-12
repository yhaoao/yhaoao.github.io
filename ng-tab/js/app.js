angular.module('weixin', ['ngTouch']).controller('MainCtrl', function(Environment) {

		Environment.init();
    })
    .factory('Environment', function($window) {

        var init = function() {
            this.winDimision = {};
            this.winDimision.width = $window.innerWidth
        }
        return {

            init: init
        }
    })
    .factory('Bezier', function() {
        var bezier = function(x1, y1, x2, y2, epsilon) {

            var curveX = function(t) {
                var v = 1 - t;
                return 3 * v * v * t * x1 + 3 * v * t * t * x2 + t * t * t;
            };
            var curveY = function(t) {
                var v = 1 - t;
                return 3 * v * v * t * y1 + 3 * v * t * t * y2 + t * t * t;
            };
            var derivativeCurveX = function(t) {
                var v = 1 - t;
                return 3 * (2 * (t - 1) * t + v * v) * x1 + 3 * (-t * t * t + 2 * v * t) * x2;
            };
            return function(t) {

                var x = t,
                    t0, t1, t2, x2, d2, i;

                for (t2 = x, i = 0; i < 8; i++) {
                    x2 = curveX(t2) - x;
                    if (Math.abs(x2) < epsilon) return curveY(t2);
                    d2 = derivativeCurveX(t2);
                    if (Math.abs(d2) < 1e-6) break;
                    t2 = t2 - x2 / d2;
                }

                t0 = 0, t1 = 1, t2 = x;

                if (t2 < t0) return curveY(t0);
                if (t2 > t1) return curveY(t1);

                while (t0 < t1) {
                    x2 = curveX(t2);
                    if (Math.abs(x2 - x) < epsilon) return curveY(t2);
                    if (x > x2) t0 = t2;
                    else t1 = t2;
                    t2 = (t1 - t0) * .5 + t0;
                }

                return curveY(t2);

            };

        };;

        return {
            bezier: bezier
        }
    })
    .directive('tabs', ['Environment', '$swipe', 'Bezier', function(Environment, $swipe, Bezier) {
        return {
            restrict: 'E',
            transclude: true,
            scope: true,
            templateUrl: 'template/tab_header.html',
            controller: function($scope) {
                var currentIndex = 0;
                $scope.tabs = [];

                $scope.selectTab = function(index, transition) {
                    currentIndex = index;
                    var tabs = document.querySelector('#tab-headers');
                    var tabTransition = document.querySelector('#tabTransition');

                    tabTransition.disabled = !transition;

                    for (var i = 0; i < $scope.tabs.length; i++) {
                        if (i === currentIndex) {
                            $scope.tabs[i].scope.isShowed = true;
                            $scope.tabs[i].scope.style["-webkit-transform"] = 'translate3d(0, 0, 0)';
                            $scope.tabs[i].scope.style["opacity"] = 1;
                        } else if ((i - 1) === currentIndex) {
                            $scope.tabs[i].scope.isShowed = true;
                            $scope.tabs[i].scope.style["-webkit-transform"] = 'translate3d(' + Environment.winDimision.width + 'px, 0, 0)';
                            $scope.tabs[i].scope.style["opacity"] = 0;


                        } else if ((i + 1) === currentIndex) {
                            $scope.tabs[i].scope.isShowed = true;
                            $scope.tabs[i].scope.style["-webkit-transform"] = 'translate3d(' + (-Environment.winDimision.width) + 'px, 0, 0)';
                            $scope.tabs[i].scope.style["opacity"] = 0;

                        } else {
                            $scope.tabs[i].scope.isShowed = false;
                        }
                    }
                };
                $scope.isSelectedTab = function(index) {
                    return currentIndex === index;
                };

                this.registerTab = function(title, icon, scope, element) {
                    $scope.tabs.push({
                        title: title,
                        icon: icon,
                        scope: scope
                    });

                    $scope.selectTab(0);
                    var startX, endX, currentTab, leftTab, rightTab, nextTab;
                    var easyOut = Bezier.bezier(0, 1, 1, 1, (1000 / 60 / 500) / 4);
                    $swipe.bind(element, {
                        'start': function(coords, event) {
                            currentTab = document.querySelector('#tab' + currentIndex);
                            leftTab = document.querySelector('#tab' + (currentIndex - 1));
                            rightTab = document.querySelector('#tab' + (currentIndex + 1));

                            startX = coords.x;
                        },
                        'move': function(coords, event) {
                            var xLength = coords.x - startX;
                            var tabLen = $scope.tabs.length;
                            if ((currentIndex === 0 && xLength > 0) || (currentIndex === (tabLen - 1) && xLength < 0)) {
                                return;
                            }

                            var radiao = Math.abs(xLength / Environment.winDimision.width);

                            

                            var red = Math.floor(64 + (180 - 64) * easyOut(radiao));
                            var blue = Math.floor(169 + (180 - 169) * easyOut(radiao));
                            var green = Math.floor(17 + (180 - 17) * easyOut(radiao));

                            var nextRed = Math.floor(180 - (180 - 64) * easyOut(radiao));
                            var nextBlue = Math.floor(180 - (180 - 169) * easyOut(radiao));
                            var nextGreen = Math.floor(180 - (180 - 17) * easyOut(radiao));

                            nextTab = leftTab;
                            if (xLength < 0) {
                                nextTab = rightTab;
                            }

                            $scope.$apply(function() {
                                currentTab.style.color = 'rgba(' + red + ',' + blue + ',' + green + ',1)';
                                nextTab.style.color = 'rgba(' + nextRed + ',' + nextBlue + ',' + nextGreen + ',1)';
                                for (var i = 0; i < tabLen; i++) {
                                    if ((i + 1) === currentIndex) {
                                        $scope.tabs[i].scope.style['opacity'] = Math.abs(xLength / Environment.winDimision.width);
                                        $scope.tabs[i].scope.style["-webkit-transform"] = 'translate3d(' + (-Environment.winDimision.width + xLength) + 'px, 0, 0)';
                                    } else if (i === currentIndex) {
                                        $scope.tabs[i].scope.style['opacity'] = 1 - Math.abs(xLength / Environment.winDimision.width);
                                        $scope.tabs[i].scope.style["-webkit-transform"] = 'translate3d(' + xLength + 'px, 0, 0)';
                                    } else if ((i - 1) === currentIndex) {
                                        $scope.tabs[i].scope.style["opacity"] = Math.abs(xLength / Environment.winDimision.width);
                                        $scope.tabs[i].scope.style["-webkit-transform"] = 'translate3d(' + (Environment.winDimision.width + xLength) + 'px, 0, 0)';
                                    }

                                }
                            });
                        },
                        'end': function(coords, event) {
                            endX = coords.x;
                            var distence = endX - startX;
                            var tabLen = $scope.tabs.length;
                            currentTab.style.color = '';
                            if(nextTab){
                            	nextTab.style.color = '';
                            }
                            
                            $scope.$apply(function() {
                                if ((currentIndex === 0 && distence > 0) || (currentIndex === (tabLen - 1) && distence < 0)) {

                                    $scope.selectTab(currentIndex, true);
                                    return;
                                }
                                if (Math.abs(distence) * 3 > Environment.winDimision.width) {
                                    if (distence > 0) {
                                        $scope.selectTab(currentIndex - 1, true);
                                    } else {
                                        $scope.selectTab(currentIndex + 1, true);
                                    }
                                } else {
                                    $scope.selectTab(currentIndex, true);
                                }
                            });


                        },
                        'cancel': function() {
                        	currentTab.style.color = '';
                            nextTab.style.color = '';
                            $scope.selectTab(currentIndex, true);
                        }
                    }, ['touch']);

                };



            }
        };
    }])
    .directive('tab', ['Environment', function(Environment) {
        return {
            restrict: 'E',
            transclude: true,
            template: '<div class="tab-content"  ng-show="isShowed" ng-style="style" ng-transclude></div>',
            require: '^tabs',
            scope: true,
            link: function($scope, $element, $attr, tabCtrl) {
                $scope.style = {
                    width: Environment.winDimision.width
                };
                var tabIndex = tabCtrl.registerTab($attr.title, $attr.icon, $scope, $element);

            }
        };
    }])
    .run(function(Environment) {
        
    });