bombermine.directive('hover', function () {
    return {
        restrict: 'A',
        link: function(scope, element) {
            element.bind('mouseenter', function () {
                element.addClass('hover');
            });

            element.bind('mouseleave', function () {
                element.removeClass('hover');
            });
        }
    }
});
bombermine.directive('watchSize', function () {
    return {
        link: function( scope, elem, attrs ) {
            scope.$watch(function() {
                if (scope.__height != elem[0].offsetHeight) {
                    scope.__height = elem[0].offsetHeight;
                    scope.$emit("eventsize", scope.__height);
                }
            });
        }
    }
});
bombermine.directive('perfectScrollbar', function () {
    return {
        link: function( scope, elem, attrs ) {
            function create() {
                if (attrs['perfectScrollbar'] == 'down') {
                    $(elem[0]).scrollTop(9999).perfectScrollbar({
                        wheelSpeed: 20,
                        wheelPropagation: false,
                        suppressScrollX: true,
                        minScrollbarLength: 20
                    });
                }
                else {
                    $(elem[0]).perfectScrollbar({
                        wheelSpeed: 20,
                        wheelPropagation: false,
                        suppressScrollX: true,
                        minScrollbarLength: 20
                    });
                }
            }
            function update() {
                if (attrs['perfectScrollbar'] == 'down') {
                    $(elem[0]).scrollTop(9999).perfectScrollbar('update');
                }
                else {
                    $(elem[0]).perfectScrollbar('update');
                }
            }
            scope.$on("eventsize", update);
            create();
        }
    }
});
bombermine.directive('areaHelper', function () {
    return {
        link: function( scope, elem, attrs ) {
            scope.$on('areaChange', function(event, param) {
                elem.width(param.width).text(param.text + 'w');
                scope.$emit('areaHeight', elem.height());
            });
        }
    }
});
bombermine.directive('areaAuto', function () {
    return {
        link: function( scope, elem, attrs ) {
            elem.on('change keyup paste keydown', function() {
                scope.$emit('areaChange', {width: elem.width(), text: elem.val()})
            })
            scope.$on('areaHeight', function(event, value) {
                elem.height(value);
            })
        }
    }
});
bombermine.directive('areaBottom', function () {
    return {
        link: function( scope, elem, attrs ) {
            scope.$on('areaHeight', function(event, value) {
                var bott = attrs.areaBottom-value;
                if (bott < 0)
                    bott = 0;
                elem.css('bottom', bott+'px');
            })
        }
    }
});
bombermine.directive('dropdownOnEvent', ["dropdownConfig", "dropdownService", '$animate',  function(dropdownConfig, dropdownService, $animate) {
    return {
        link: function( scope, elem, attrs) {
            var scope0 = scope.$new();
            var toggleElement = null;
            var openClass = dropdownConfig.openClass;

            scope.$on(attrs["dropdownOnEvent"], function(event, param) {
                var elem1 = toggleElement = param;

                var topParent = elem.parent().offset().top;
                var leftParent = elem.parent().offset().left;
                var top =  elem1.offset().top - topParent + elem1.height();
                var left = elem1.offset().left - leftParent;
                elem.css({'top': top+'px', 'left': left+'px'});

                dropdownService.open(scope0)
                scope0.isOpen = true;
            })

            scope0.getToggleElement = function() {
                return toggleElement;
            };

            scope0.focusToggleElement = function() {
            };

            scope0.$watch('isOpen', function( isOpen, wasOpen ) {
                $animate[isOpen ? 'addClass' : 'removeClass'](elem, openClass);

                if ( isOpen ) {
                    scope0.focusToggleElement();
                    dropdownService.open( scope0 );
                } else {
                    dropdownService.close( scope0 );
                }
            });

            scope.$on('$destroy', function() {
                scope0.$destroy();
            });

        }
    }
}]);


bombermine.directive('size', function ($window) {
    return {
        link: function (scope, element) {
            scope.getWindowDimensions = function () {
                return {
                    'w': element.width(),
                    'h': element.height()
                };
            };
            scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
                if (scope.elemW && (element.context.classList.contains("ng-hide") ||
                    newValue.w == 0 || newValue.h == 0) )
                    return;
                scope.elemW = newValue.w;
                scope.elemH = newValue.h;
            }, true);
        }
    }
});
bombermine.directive('watchInclude', function () {
    return {
        restrict: 'A',
        scope: {
            text: "@watchInclude"
        },
        link: function( scope, elem, attrs ) {
            scope.$watch("text", function() {
                elem.addClass('rotate');
                setTimeout(function() {elem.removeClass('rotate');}, 1000);
            });
        }
    }
});
bombermine.directive('toggleMenu', function ($document, Keys) {
    return {
        link: function( scope, elem, attrs) {
            $document.bind("keydown", onKey);
            scope.$on("$destroy", function() {
                $document.unbind("keydown", onKey);
            });
            function onKey(e) {
                /*console.log(scope.activeTab);
                console.log(scope.MenuTab);*/
                if (attrs['toggleMenu']>0&&attrs['toggleMenu']<5&&!Keys.isLocked()) {
                    if ((e.which == 65) || (e.which == 37)) {
                        moveMenu(0, scope.MenuTab, scope.activeTab)
                    }
                    if ((e.which == 68) || (e.which == 39)) {
                        moveMenu(1, scope.MenuTab, scope.activeTab)
                    }
                }
            }
            function moveMenu(direction, arrMenu, activeTab) {
                var i = 0;
                for(i; i < arrMenu.length; i++) {
                    if (arrMenu[i].name == activeTab) break;
                }
                if ((direction == 0) && (i > 0)) {
                    while ( i == 0 || arrMenu[i-1].visible != true ) {
                        i--;
                    }
                    scope.activeTab = arrMenu[i-1].name;
                }
                if ((direction == 1) && (i+1 < arrMenu.length)) {
                    var j = i;
                    while ( (i < arrMenu.length - 1) && (arrMenu[i+1].visible != true)) {
                        i++;
                    }
                    if (i==arrMenu.length - 1) i = j - 1;
                    scope.activeTab = arrMenu[i+1].name;
                }
                scope.$digest();
            }
        }
    }
});

bombermine.directive('closeModal', function () {
    return {
        link: function( scope, elem, attrs ) {
            var child = angular.element(elem.children());
            child.bind('click', function(event) {
                event = event || window.event;
                if (event.stopPropagation) {
                    event.stopPropagation()
                } else {
                    event.cancelBubble = true
                }
            });
            elem.bind('click', function() {
                var visible = attrs.ngShow || attrs.ngIf;
                visible = visible.split('.');
                
                if (visible.length == 1) {
                    scope[visible[0]] = false;
                }
                /*if (visible.length == 2) {
                    scope[visible[0]][visible[1]] = false;
                }*/
                else {
                    var scopeVis = scope[visible[0]];
                    for (var i = 1; i < visible.length; i++) {
                        if (i+1 == visible.length) {
                            scopeVis[visible[i]] = false;
                            break;
                        }
                        scopeVis = scopeVis[visible[i]];
                        
                    };
                }
                scope.$digest();
            });
        }
    }
});

bombermine.directive('jplayer', ["$http", "$rootScope", function ($http, $rootScope) {
    return {
        link: function( scope, elem, attrs ) {
            var stream = {
                    title: "Game of Bombs radio"
                }, ready = false;
            var el = $(elem[0]), soundtrackArtists = {};
            el.jPlayer({
                ready: function (event) {
                    ready = true;
                    parseRadioData(config.radio);
                },
                pause: function() {
                    $(this).jPlayer("clearMedia");
                },
                error: function(event) {
                    if(ready && event.jPlayer.error.type === $.jPlayer.error.URL_NOT_SET) {
                        // Setup the media stream again and play it.
                        $(this).jPlayer("setMedia", stream).jPlayer("play");
                    }
                },
                volume: 0.5,
                solution: "html",
                supplied: "oga",
                preload: "none",
                wmode: "window",
                useStateClassSkin: true,
                autoBlur: false,
                keyEnabled: true
            });
            $rootScope.jpPlay = function() {
                el.jPlayer("play");
            };
            function parseRadioData(str) {
                if (!str) return;
                var src = str.icestats.source;
                var t = src.server_url.split(",");
                for (var i=0;i+1< t.length;i+=2)
                    soundtrackArtists[t[i]] = t[i+1];
                var link = soundtrackArtists[src.artist.toLowerCase()];
                if (link && !config.hideExternalLinks) {
                    stream.title = '<a target="_blank" href="'+link+'">' + src.artist + '</a> - '+src.title;
                } else
                    stream.title = src.artist + ' - '+src.title;
                if (!stream.oga || stream.oga != str.icestats.source.listenurl) {
                    stream.oga = str.icestats.source.listenurl;
                    el.jPlayer("setMedia", stream);
                }
                el.parent().find(".jp-title").html(stream.title);
            }
            var interval = setInterval(function () {
                if (ready && (!el.data().jPlayer.status.paused || !stream.oga)) {
                    $.getJSON("/api/v3/radio", parseRadioData)
                }
            }, 10000);
            scope.$on('$destroy', function () {
                clearInterval(interval);
            });
        }
    }
}]);