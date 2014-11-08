(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// warning global variable
var tinyMceConfig = {
    resize: false,
    plugins: [
        "advlist autolink lists link image charmap print preview anchor",
        "searchreplace visualblocks code fullscreen", "image",
        "insertdatetime media table contextmenu paste"
    ],
    toolbar: "insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image",
    file_browser_callback: function (field_name, url, type, win) {

        if (type == 'image' || type == 'file') {
            var ed = tinyMCE.activeEditor;
            ed.windowManager.open({
                file: '/admin/uribrowser/index?runningFromTinyMce=true&type=' + type + '&inputId=none',
                title: cms.adminResources.get('PAGES_LABEL_URIBROWSERTITLE'),
                width: 500,
                height: 600,
                scrollbars: "yes",
                inline: "yes"
            }, {
                window: win,
                input: field_name,
                oninsert: function (passedurl) {
                    var field = win.document.getElementById(field_name);
                    field.value = passedurl;
                    tinyMCE.activeEditor.dom.fire(field, "change");
                }
            });
        }
        return false;
    },

    extended_valid_elements: "iframe[src|width|height|name|align|style]",
    relative_urls: false,
    convert_urls: false
    //language: $.cookie("cmslanguage")
};

var app = angular.module('contentPagesApp', ['services', 'contentServices', 'ui.tinymce', 'ui.bootstrap', 'cms.growlers', 'cms.ichecker'
    , 'sharedmodule', 'ngResource', 'ngRoute', 'httpRequestInterceptors']).
    config(['$routeProvider', '$httpProvider', function($routeProvider, $httpProvider) {
        $routeProvider
            .when('/pages', { templateUrl: '/admin/contentpages/listcontentpages', controller: 'pagesController' })
            .when('/addpage', { templateUrl: '/admin/contentpages/addcontentpage', controller: 'addPageController' })
            .when('/editpage/:pageId', {
                templateUrl: '/admin/contentpages/editcontentpage',
                controller: 'editPageController',
                resolve: {
                    page: ["pagesService", "$route", "$q", function(pagesService, $route, $q) {
                        var deferred = $q.defer();

                        pagesService.get({ pageid: $route.current.params.pageId }, function (successData) {
                            deferred.resolve(successData);
                        }, function() {
                            deferred.reject();
                        });

                        return deferred.promise;
                    }]
                }
            })
            .otherwise({ redirectTo: '/all' });
    }]);

app.controller('pagesController', ['$scope', 'pagesService', 'notificationService', '$http',
    function ($scope, pagesService, notificationService, $http) {
    
        loadPages();

        $scope.deletePage = function (index) {

            var page = $scope.pages[index];

            var pageName = page.name;
            if (confirm(cms.adminResources.get("ADMIN_PAGES_NOTIFY_DELETEPAGE", pageName))) {
                page.$delete(function () {

                    notificationService.addSuccessMessage(cms.adminResources.get('ADMIN_PAGES_NOTIFY_PAGEDELETED', pageName));

                    loadPages();
                });
            }
        };

        $scope.clearCache = function () {

            $http({
                method: 'POST',
                url: '/admin/api/pages/clearcache'
            }).success(function () {
                notificationService.addSuccessMessage(cms.adminResources.get('ADMIN_PAGES_NOTIFY_ALLCACHECLEARED'));
            });
        };

        function loadPages() {
            $scope.pages = pagesService.query();
        }
}]);

app.controller('addPageController', ['$scope', 'pagesService', '$location', 'notificationService',
    function ($scope, pagesService, $location, notificationService) {

        $scope.page = {};

        $scope.defaultTinyMceConfig = tinyMceConfig;

        $scope.saveAndCloseButtonClicked = function () {

            pagesService.save($scope.page, function () {

                notificationService.addSuccessMessage(cms.adminResources.get('ADMIN_PAGES_NOTIFY_PAGEADDED', $scope.page.name));

                $location.path('#/contentpages');
            });
        };
    }]);

app.controller('editPageController', ['$scope', 'page', '$location', 'notificationService', 'pagesService', '$http',
    function ($scope, page, $location, notificationService, pagesService, $http) {

        $scope.page = page;

        $scope.defaultTinyMceConfig = tinyMceConfig;

        $scope.saveButtonClicked = function () {
            updatePage(false);
        };

        $scope.saveAndCloseButtonClicked = function () {
            updatePage(true);
        };

        $scope.clearCacheButtonClicked = function () {

            $http({
                method: 'POST',
                url: '/admin/api/pages/clearcacheforpage/' + $scope.page._id
            }).success(function () {

                notificationService.addSuccessMessage(cms.adminResources.get('ADMIN_PAGES_NOTIFY_PAGECACHECLEARED', $scope.page.name));
            });
        };

        function updatePage(closePage) {

            $scope.page.$update(function () {

                notificationService.addSuccessMessage(cms.adminResources.get('ADMIN_PAGES_NOTIFY_PAGEUPDATED', $scope.page.name));

                if (closePage) {
                    $location.path('#/contentpages');
                }
            });
        }
    }]);
},{}],2:[function(require,module,exports){
var widgetsModule = angular.module('contentwidgets', []);

widgetsModule.directive('latestupdates', function(){
	return {
      restrict: 'E',
      controller: function($scope, $http){
      	$scope.latestContentPages = [];

      	$http.get('/admin/api/contentpages/latestchanged/5').then(function(result){
      		$scope.latestContentPages = result.data;
      	});
      },
      template: '<div class="panel-heading">' +
                    cms.adminResources.get('ADMIN_DASHBOARD_LABEL_LATESTCHANGEDPAGES') +
                '</div>' +
                '<div class="panel-body">' +
                    '<ul class="list-group">' +
                      '<li class="list-group-item" ng-repeat="page in latestContentPages">' +
                        '<i class="fa fa-file-text-o fa-fw"></i>' +
                        '<a href="/admin/contentpages#/edit/{{ page._id }}">{{ page.name }}</a>' +
                        '<span class="pull-right">{{ page.changed }}</span>' +
                        '</li>' +
                    '</ul>' +
                '</div>'      
    };
});
},{}],3:[function(require,module,exports){
angular.module('contentSettingsApp', ['contentServices', 'services', 'cms.growlers', 
	'ngResource', 'sharedmodule', 'httpRequestInterceptors'])

    .value('settingKeys', ['website_description', 'website_keywords', 'website_landingpage'])

    .directive('pagesSelector', function () {

        return {
        	restrict: 'A',
        	scope: {
        		selectedPage: '=pagesSelector'
        	},
            controller: function($scope, pagesService){
            	$scope.availablePages = pagesService.query();
            },
            templateUrl: '/assets/content/templates/contentsettings/pagesselector.html'
        };
    });
},{}],4:[function(require,module,exports){
var app = angular.module('menusApp', ['ui.bootstrap', 'cms.growlers', 'services', 'sharedmodule', 'ngResource', 
    'ngRoute', 'httpRequestInterceptors', 'cms.sortableMenu', 'filters']).
    config(['$routeProvider', '$httpProvider', function($routeProvider, $httpProvider) {
        $routeProvider
            .when('/all', { templateUrl: '/admin/menus/list', controller: 'menusController' })
            .when('/add', { templateUrl: '/admin/menus/add', controller: 'addMenuController' })
            .when('/edit/:menuId', {
                templateUrl: '/admin/menus/edit',
                controller: 'editMenuController',
                resolve: {
                    menu: ["menusService", "$route", "$q", function(menusService, $route, $q) {
                        var deferred = $q.defer();

                        menusService.get({ menuid: $route.current.params.menuId }, function (successData) {
                            deferred.resolve(successData);
                        }, function() {
                            deferred.reject();
                        });

                        return deferred.promise;
                    }]
                }
            })
            .otherwise({ redirectTo: '/all' });
    }]);


app.factory('menusService', ['$resource', function ($resource) {
    return $resource('/admin/api/menus/:menuid', { menuid: '@_id' },
    {
        update: { method: 'PUT' },
    });
}]);

app.controller('menusController',     function ($scope, menusService, notificationService, $http) {
    
    loadMenus();

    $scope.deleteMenu = function (index) {

        var menu = $scope.menus[index];

        var menuName = menu.name;
        if (confirm(cms.adminResources.get("ADMIN_MENUS_NOTIFY_DELETEMENU", menuName))) {
            menu.$delete(function () {

                notificationService.addSuccessMessage(cms.adminResources.get('ADMIN_MENUS_NOTIFY_MENUDELETED', menuName));

                loadMenus();
            });
        }
    };

    function loadMenus() {
        $scope.menus = menusService.query();
    }
});

app.controller('addMenuController', 
    function ($scope, menusService, $location, notificationService) {

        $scope.menu = {};

        $scope.saveAndCloseButtonClicked = function () {

            menusService.save($scope.menu, function () {

                notificationService.addSuccessMessage(cms.adminResources.get('ADMIN_MENUS_NOTIFY_MENUADDED', $scope.menu.name));

                $location.path('#/all');
            });
        };
    });

app.controller('editMenuController', 
    function ($scope, menu, $location, notificationService, menusService, $http, $modal) {

        menu.children = menu.children || [];
        $scope.menu = menu;
        $scope.addMenuItem = function(){
            var modalInstance = $modal.open({
                templateUrl: 'newMenuItem',
                controller: function($scope, $modalInstance) {

                    $scope.saveAndClose = function (name, url) {
                        $modalInstance.close({name: name, url: url});
                    };

                    $scope.closeModal = function() {
                        $modalInstance.close();
                    }
                }
            });

            modalInstance.result.then(function(data) {

                if (data) {
                    $scope.menu.children.push({ 
                        id: Math.floor((Math.random() * 1000000) + 1).toString(),
                        name: data.name, 
                        url: '/' + data.url,
                        children: [] 
                    });
                }
            });
        };
        
        $scope.saveButtonClicked = function () {
            updateMenu(false);
        };

        $scope.saveAndCloseButtonClicked = function () {
            updateMenu(true);
        };
        
        function updateMenu(close) {

            menusService.update($scope.menu, function(){
                notificationService.addSuccessMessage(cms.adminResources.get('ADMIN_MENUS_NOTIFY_MENUUPDATED', $scope.menu.name));

                if (close) {
                    $location.path('#/all');
                }
            });
        }
    });
},{}],5:[function(require,module,exports){
angular.module('cms.sortableMenu', [])

    .directive('sortableMenu', function () {

        var _scope, menu;

        // this method is used to find the original nested array of an item
        // it can be used to remove the item from that array
        function findArray(array, item){
            for (var i = 0; i < array.length; i++) {
                if(array[i] === item){
                    return array;
                }
                if(array[i].children){
                    var result = findArray(array[i].children, item);
                    if(result){
                        return result;
                    }
                }
            }
        }

        // whenever the nested sortable is updated with a drag event
        // we rebuild the complete hierarchy for angular to draw the nested menu again.
        // after that we reinit the nested menu again
        function rebuildMenuHierarchy(){
            var hierarchy = menu.nestedSortable('toHierarchy');
            menu.nestedSortable("destroy");
            var newChildren = [];

            for (var i = 0; i < hierarchy.length; i++) {
                buildupNewChildren(hierarchy[i], _scope.menu.children, newChildren);
            };
            _scope.menu.children = newChildren;

            if (!_scope.$$phase) {
              _scope.$apply();
            }

            initNestedSortable();
        }

        // this method is building up the new children nested array based on the 
        // hierarchy and the previous values of the menu
        function buildupNewChildren(hierarchyItem, originalMenu, newChildren){
            
            var originalItem = searchInOriginalMenu(originalMenu, hierarchyItem.id);
            
            if(originalItem){
                
                var newItem = angular.copy(originalItem);
                newItem.children = [];
                newChildren.push(newItem);

                if(hierarchyItem.children){
                
                    for (var i = 0; i < hierarchyItem.children.length; i++) {
                        buildupNewChildren(hierarchyItem.children[i], originalMenu, newItem.children);
                    };
                }
            }
        }

        // recursively loop through the previous menu to find an item
        function searchInOriginalMenu(children, id){
                        
            for (var i = 0; i < children.length; i++) {
                
                if(children[i].id === id){
                    return children[i];
                } 
                if(children[i].children){
                    var result = searchInOriginalMenu(children[i].children, id);
                    if(result){
                        return result;
                    }
                } 
            }
        }

        function initNestedSortable(){

            setTimeout(function() {
                menu.nestedSortable({
                    forcePlaceholderSize: true,
                    helper: 'clone',
                    items: 'li.listitem',
                    maxLevels: 3,
                    opacity: .6,
                    revert: 250,
                    update: function(){
                        rebuildMenuHierarchy();
                    }
                }).disableSelection();
            });
        }

        return {
            restrict: 'E',
            templateUrl: '/assets/content/templates/menus/sortablemenu.html',
            link: function (scope, elm) {
                _scope = scope;

                _scope.toggle = function(el){
                    
                    $(el.target).closest('.panel').find('.panel-body').slideToggle();
                    var togglebuttons = $(el.target).closest('.btn-group').find('button.togglebuttons');
                    togglebuttons.toggle();

                    return false;
                };

                 _scope.remove = function(item){
                    var array = findArray(_scope.menu.children, item);
                    if(array){
                        array.splice(array.indexOf(item), 1);
                    };

                    return false;
                };

                menu = $('#nestedMenu')
                
                initNestedSortable();
            }
        };
    });
},{}],6:[function(require,module,exports){
angular.module('contentServices', ['ngResource'])
	.factory('pagesService', ['$resource', function ($resource) {
	    return $resource('/admin/api/contentpages/:pageid', { pageid: '@_id' },
	        {
	            update: { method: 'PUT' },
	            //clearCache: { method: 'POST', params: { clearcache: 'true' } },
	            //clearCacheForPage: { method: 'POST', params: { 'clearCacheForPage': '@Id' } }
	        });
	}]);

},{}],7:[function(require,module,exports){
angular.module('loginApp', ['cms.focus', 'cms.growlers', 'cms.loginshaker', 'services'])
	
	.factory('authenticationService', ["$http", function ($http) {
	    return {
	        authenticate: function(username, password, language) {
	            return $http({
	                method: 'POST',
	                url: '/public/api/login',
	                data: { username: username, password: password, language: language }
	            });
	        }
	    };
	}])
	.controller('loginController', ['$scope', 'authenticationService', 'notificationService', '$window',
    	function ($scope, authenticationService, notificationService, $window) {

        $scope.availableLanguages = ['en', 'nl'];
        $scope.username = '';
        $scope.password = '';
        $scope.unauthorizedLogin = false;
        setLanguageBasedOnCookieOrBrowser();

        $scope.login = function() {
            $scope.unauthorizedLogin = false;
            authenticationService.authenticate($scope.username, $scope.password, $scope.language)
                .then(onSuccessLogin, onErrorLogin);
        };

        function onSuccessLogin() {
            
            $.cookie("lang", $scope.language)
            $window.location.href = '/admin';
        }

        function onErrorLogin(data) {

            if (data.status === 401) {
                if (data.data) {
                    notificationService.addErrorMessage(data.data);
                }
                $scope.unauthorizedLogin = true;
                $scope.password = '';
            }
        }

        function setLanguageBasedOnCookieOrBrowser() {
            var langaugeToSet = $.cookie("lang");

            if (!langaugeToSet) {

                var browserLanguage = window.navigator.userLanguage || window.navigator.language;

                for (var i = 0; i < $scope.availableLanguages.length; i++) {
                    if($scope.availableLanguages[i] === browserLanguage){
                        langaugeToSet = browserLanguage;
                        break;
                    }
                };
                if(!langaugeToSet){
                    langaugeToSet = 'en';
                }
            }

            $scope.language = langaugeToSet;
        }
    }]);


},{}],8:[function(require,module,exports){
angular.module('usersApp', ['cms.growlers', 'cms.ichecker', 'services', 'ngRoute',
    'ngResource', 'sharedmodule', 'httpRequestInterceptors']).
    config(['$routeProvider', function($routeProvider) {
        $routeProvider
            .when('/users', { templateUrl: '/admin/users/listusers', controller: 'usersController' })
            .when('/adduser', { templateUrl: '/admin/users/adduser', controller: 'addUserController' })
            .when('/edituser/:userId', {
                templateUrl: '/admin/users/edituser',
                controller: 'editUserController',
                resolve: {
                    user: ["usersService", "$route", "$q", function(usersService, $route, $q) {
                        var deferred = $q.defer();

                        usersService.get({ id: $route.current.params.userId }, function(successData) {
                            deferred.resolve(successData);
                        }, function() {
                            deferred.reject();
                        });

                        return deferred.promise;
                    }]
                }
            })
            .otherwise({ redirectTo: '/users' });
    }])
.controller('usersController', ['$scope', 'usersService', 'notificationService',
    function ($scope, userService, notificationService) {
    
        loadUsers();

        $scope.deleteUser = function (index) {

            var user = $scope.users[index];

            var username = user.username;
            if (confirm(cms.adminResources.get("ADMIN_USERS_NOTIFY_DELETEUSER", username))) {
                user.$delete(function () {

                    notificationService.addSuccessMessage(cms.adminResources.get("ADMIN_USERS_NOTIFY_USERDELETED", username));

                    loadUsers();
                });
            }
        };

        function loadUsers() {
            $scope.users = userService.query();
        }
}])

.controller('addUserController', ['$scope', 'usersService', '$location', 'notificationService',
    function ($scope, usersService, $location, notificationService) {

        $scope.user = {};

        $scope.saveAndCloseButtonClicked = function () {

            usersService.save($scope.user, function () {

                notificationService.addSuccessMessage(cms.adminResources.get("ADMIN_USERS_NOTIFY_USERADDED", $scope.user.username));
                $location.path('#/users');
            });
        };
    }])

.controller('editUserController', ['$scope', 'user', '$location', 'notificationService',
    function ($scope, user, $location, notificationService) {

        $scope.user = user;

        $scope.saveButtonClicked = function () {
            updateUser(false);
        };

        $scope.saveAndCloseButtonClicked = function () {
            updateUser(true);
        };

        function updateUser(closePage) {
            $scope.user.$update(function () {

                notificationService.addSuccessMessage(cms.adminResources.get("ADMIN_USERS_NOTIFY_USERUPDATED", $scope.user.username));
                if (closePage) {
                    $location.path('#/users');
                }
            });
        }
    }])
.factory('usersService', ['$resource', function ($resource) {
    return $resource('/admin/api/users/:id', { id: '@_id' },
        {
            update: { method: 'PUT' },
        });
}]);
},{}],9:[function(require,module,exports){
'use strict';

// Add ECMA262-5 method binding if not supported natively
//
if (!('bind' in Function.prototype)) {
    Function.prototype.bind = function (owner) {
        var that = this;
        if (arguments.length <= 1) {
            return function () {
                return that.apply(owner, arguments);
            };
        } else {
            var args = Array.prototype.slice.call(arguments, 1);
            return function () {
                return that.apply(owner, arguments.length === 0 ? args : args.concat(Array.prototype.slice.call(arguments)));
            };
        }
    };
}

// Add ECMA262-5 string trim if not supported natively
//
if (!('trim' in String.prototype)) {
    String.prototype.trim = function () {
        return this.replace(/^\s+/, '').replace(/\s+$/, '');
    };
}

// Add ECMA262-5 Array methods if not supported natively
//
if (!('indexOf' in Array.prototype)) {
    Array.prototype.indexOf = function (find, i /*opt*/) {
        if (i === undefined) i = 0;
        if (i < 0) i += this.length;
        if (i < 0) i = 0;
        for (var n = this.length; i < n; i++)
            if (i in this && this[i] === find)
                return i;
        return -1;
    };
}
if (!('lastIndexOf' in Array.prototype)) {
    Array.prototype.lastIndexOf = function (find, i /*opt*/) {
        if (i === undefined) i = this.length - 1;
        if (i < 0) i += this.length;
        if (i > this.length - 1) i = this.length - 1;
        for (i++; i-- > 0;) /* i++ because from-argument is sadly inclusive */
            if (i in this && this[i] === find)
                return i;
        return -1;
    };
}
if (!('forEach' in Array.prototype)) {
    Array.prototype.forEach = function (action, that /*opt*/) {
        for (var i = 0, n = this.length; i < n; i++)
            if (i in this)
                action.call(that, this[i], i, this);
    };
}
if (!('map' in Array.prototype)) {
    Array.prototype.map = function (mapper, that /*opt*/) {
        var other = new Array(this.length);
        for (var i = 0, n = this.length; i < n; i++)
            if (i in this)
                other[i] = mapper.call(that, this[i], i, this);
        return other;
    };
}
if (!('filter' in Array.prototype)) {
    Array.prototype.filter = function (filter, that /*opt*/) {
        var other = [], v;
        for (var i = 0, n = this.length; i < n; i++)
            if (i in this && filter.call(that, v = this[i], i, this))
                other.push(v);
        return other;
    };
}
if (!('every' in Array.prototype)) {
    Array.prototype.every = function (tester, that /*opt*/) {
        for (var i = 0, n = this.length; i < n; i++)
            if (i in this && !tester.call(that, this[i], i, this))
                return false;
        return true;
    };
}
if (!('some' in Array.prototype)) {
    Array.prototype.some = function (tester, that /*opt*/) {
        for (var i = 0, n = this.length; i < n; i++)
            if (i in this && tester.call(that, this[i], i, this))
                return true;
        return false;
    };
}
},{}],10:[function(require,module,exports){
(function (cms, $) {
    'use strict';
    function initContentSettings() {
        $('#createSitemapLinkButton').click(function (event) {
            event.preventDefault();

            createSitemap();
        });
    }

    function createSitemap() {
        $.ajax({
            url: '/admin/contentsettings/createsitemap',
            timeout: 1000,
            type: 'POST',
            traditional: true,
            success: function (data) {
                if (data.success == true) {
                    alert('sitemap created');
                }
                else {
                    alert('error while creating sitemap');
                }
            },
            error: function (xhr) {
                alert('error while creating sitemap: ' + xhr);
            }
        });
    }

    cms.options = {
        initContentSettings: initContentSettings,
    };

} (window.cms = window.cms || {}, jQuery));   
},{}],11:[function(require,module,exports){
(function (cms, $) {
    'use strict';

    var enableTinyMCe;

    function init(tinyMce) {

        enableTinyMCe = tinyMce;

        registerClickHandlersOnAnchors();
    }

    function registerClickHandlersOnAnchors() {
        $('#uriBrowserTree li a').click(function () {
            var type = $(this).data('type');
            var navigateUrl = $(this).data('navigateurl');
            var inputId = $(this).data('inputid');

            uriSelected(type, navigateUrl, inputId);
        });
    }

    function uriSelected(type, url, inputId) {

        if (type == 'image' || type == 'file') {

            if (enableTinyMCe) {
                
                top.tinymce.activeEditor.windowManager.getParams().oninsert(url);
                top.tinymce.activeEditor.windowManager.close();
                
            } else {

                $("#" + inputId + "", window.opener.document).val(url);
                top.tinymce.activeEditor.windowManager.close();
            }
            
        }
    }

    cms.uriBrowser =  {
        init: init
    };
}(window.cms = window.cms || {}, jQuery));
},{}],12:[function(require,module,exports){
(function (cms) {
    'use strict';
    
    var _clientId, _gaAccount, _gaHistory, googleLoginButton, callBackFunction;
    var scopes = 'https://www.googleapis.com/auth/analytics.readonly';

    function init(gaAccount, gaHistory, callBack) {

        _gaAccount = gaAccount;
        _gaHistory = gaHistory;
        googleLoginButton = document.getElementById('googlelogin-button');
        callBackFunction = callBack;
    }

    function handleClientLoad(apiKey, clientId) {
        _clientId = clientId;
        gapi.client.setApiKey(apiKey);

        window.setTimeout(checkAuth, 1);
    }

    function checkAuth() {
        // Call the Google Accounts Service to determine the current user's auth status.
        gapi.auth.authorize({ client_id: _clientId, scope: scopes, immediate: true }, handleAuthResult);
    }

    function handleAuthResult(authResult) {
        if (authResult) {
            loadAnalyticsClient();
        } else {
            handleUnAuthorized();
        }
    }

    function loadAnalyticsClient() {
        // Load the Analytics client and set handleAuthorized as the callback function
        gapi.client.load('analytics', 'v3', handleAuthorized);
    }

    function handleAuthorized() {
        googleLoginButton.style.visibility = 'hidden';
        callBackFunction(_gaAccount, _gaHistory);
    }

    // Unauthorized user
    function handleUnAuthorized() {
        googleLoginButton.style.visibility = '';
        googleLoginButton.onclick = handleAuthClick;
    }

    function handleAuthClick(event) {
        gapi.auth.authorize({ client_id: _clientId, scope: scopes, immediate: false }, handleAuthResult);
        return false;
    }

    cms.googleAnalyticsAuthorisation = {
        handleClientLoad: handleClientLoad,
        init: init
    };

}(window.cms = window.cms || {}));
},{}],13:[function(require,module,exports){
(function(cms, $) {
    'use strict';

    var googleAnalyticsBusyIndicator;

    cms.home = {
        init: init,
        googleApiAuthorised: googleApiAuthorised
    };

    function init() {

        initControls();
    }

    function initControls() {
        googleAnalyticsBusyIndicator = $('#googleAnalyticsBusyIndicator');
    }

    function googleApiAuthorised(gaAccount, gaHistory) {

        googleAnalyticsBusyIndicator.show();

        var endDate = new Date().format("yyyy-mm-dd");

        var days = (24 * 60 * 60 * 1000) * gaHistory;
        var startDate = new Date();
        startDate.setTime(startDate.getTime() - days);
        startDate = startDate.format("yyyy-mm-dd");

        var apiQuery = gapi.client.analytics.data.ga.get({
            'ids': 'ga:' + gaAccount,
            'start-date': startDate,
            'end-date': endDate,
            'dimensions': 'ga:date',
            'metrics': 'ga:visits',
            'max-results': 50
        });

        apiQuery.execute(printResults);
    }
    
    function printResults(results) {

        googleAnalyticsBusyIndicator.hide();

        var googleAnalyticsResult = document.getElementById('googleAnalyticsResult');

        if (results.rows && results.rows.length) {

            var chartData = getVisitorChartData(results);

            new google.visualization.AreaChart(googleAnalyticsResult).
            draw(chartData.data, {
                curveType: "none",
                width: googleAnalyticsResult.clientWidth -20, height: 150, // 20px is the offset of the padding of the fluid-container
                vAxis: {
                    maxValue: chartData.maxVisits,
                    minValue: 0,
                    gridlines: { color: '#ccc', count: 1 },
                },
                hAxis: {
                    showTextEvery: 3,
                    textStyle: { fontSize: 10 },
                    slantedTextAngle: 45
                },
                series: [{ color: 'blue', areaOpacity: 0.20 }, { areaOpacity: 0 }]
            }
            );
        }
        else {
            googleAnalyticsResult.innerHtml = "no google analytics result found!";
        }
    }

    function getVisitorChartData(result) {
        var arrayNumber = 0;
        var rows = result.rows;
        var arrayOfData = new Array(rows.length);
        var maxVisits = 0;
        var avg = 0, total = 0;

        for (var j = 0; j < rows.length; j++) {
            total = total + parseInt(rows[j][1], 10);
        }
        avg = total / rows.length;

        arrayOfData[arrayNumber] = new Array(3);
        arrayOfData[arrayNumber][0] = 'x';
        arrayOfData[arrayNumber][1] = 'Visits';
        arrayOfData[arrayNumber][2] = 'avg.';

        for (var i = 0; i < rows.length; i++) {

            arrayNumber++;
            arrayOfData[arrayNumber] = new Array(2);

            var row = rows[i];
            var day = row[0];
            var numVisits = parseInt(row[1], 10);

            var dayPart = day.substring(6, 8);
            var monthPart = day.substring(4, 6);
            var yearPart = day.substring(0, 4);

            var formattedDate = dayPart + '-' + monthPart + '-' + yearPart;

            arrayOfData[arrayNumber][0] = formattedDate;
            arrayOfData[arrayNumber][1] = numVisits;
            arrayOfData[arrayNumber][2] = avg;

            if (numVisits >= maxVisits) {
                maxVisits = numVisits;
            }
        }

        return {
            maxVisits: maxVisits,
            data: google.visualization.arrayToDataTable(arrayOfData)
        };
    }

}(window.cms = window.cms || { }, jQuery));
},{}],14:[function(require,module,exports){
var angular = require('_angular');
var angularResource = require('_angular-resource');
var angularRoute = require('_angular-route');
// needs some serious refactoring
require('bootstrap')
require('jquery.metisMenu')
require('sbadmin');
require('ui-bootstrap');

window.cms = window.cms || {}

window.cms.init = function (widgetModules){

    var modules = ['sharedmodule', 'services', 'filters', 'ngRoute', 'logsApp', 'contentPagesApp'].concat(widgetModules);

    angular.module('adminApp', modules)
    
    .config(['$routeProvider', '$httpProvider', function($routeProvider, $httpProvider) {
        $routeProvider
            .when('/dashboard', { 
                templateUrl: '/admin/dashboard', 
                controller: 'dashboardController' })
            .otherwise({ redirectTo: '/dashboard' });
    }])

    .controller('dashboardController', function($scope, logsService){
        $scope.showLogMessagesLoader = true;
        
        logsService.query({ limit: 5 }).$promise.then(function(data){
            $scope.latestLogMessages = data;
            $scope.showLogMessagesLoader = false;
        });
    })

    .directive('contentStats', function(){
        return {
          restrict: 'E',
          controller: function($scope, $http){
            
            $scope.showBusyIndicator = true;

            $http.get('/admin/api/dashboard/getcontentstats').then(function(result){
                $scope.showBusyIndicator = false;
                $scope.contentstats = result.data;
            });
          },
          template: '<div class="busy" ng-show="showBusyIndicator"></div>' +
                    '<div class="contentstats">' +
                        '<h5 ng-repeat="stat in contentstats"><span class="label label-primary">{{ stat.count }}</span>' +
                        '<a href="{{ stat.url }}">{{ stat.resourcekey | __  }}</a></h5>' +
                    '</div>'      
        };
    });
};    
},{"_angular":undefined,"_angular-resource":undefined,"_angular-route":undefined,"bootstrap":undefined,"jquery.metisMenu":undefined,"sbadmin":undefined,"ui-bootstrap":undefined}],15:[function(require,module,exports){
angular.module('cms.focus', [])
    //
    // Directive that registers a focus on an element 
    //
    .directive('uiFocus', [function () {
    	return {
    		restrict: 'A',
    		link: function (scope, elm) {
    			elm.focus();
    		}
    	};
    }])
},{}],16:[function(require,module,exports){

angular.module('cms.growlers', [])
    //
    // Directive that shows a growl message when a error messaged is pushed to 
    //
    .directive('uiGrowler', ["notificationService", function(notificationService) {
        return {
            restrict: 'A',
            controller: function ($scope, $element, $attrs) {

                notificationService.addListener(showErrorMessages, 'error');

                notificationService.addListener(showSuccessMessages, 'success');

                function showSuccessMessages(message) {
                    showGrowl('success', message);
                }

                function showErrorMessages(message) {
                    showGrowl('error', message);
                }
            }
        };
    }])
},{}],17:[function(require,module,exports){

angular.module('cms.ichecker', [])
    //
    // This directive is needed to make the icheck plugin work in angularjs enabled forms
    //
    .directive('uiIchecker', function() {
        return {
            restrict: 'A',
            scope: {
                isSelected: '@selectedproperty',
                localModel: '=ngModel'
            },
            link: function (scope, elm) {

                setTimeout(function () {
                    var originalCheckbox = $(elm);

                    if (scope.isSelected === "true") {
                        originalCheckbox.attr('checked', 'checked');
                    }

                    originalCheckbox.iCheck({
                        checkboxClass: 'icheckbox_flat-aero',
                        radioClass: 'iradio_flat-aero'
                    });

                    originalCheckbox.on('ifChecked', function() {

                        scope.$apply(function () {
                            scope.localModel = true;
                        });
                    });

                    originalCheckbox.on('ifUnchecked', function() {

                        scope.$apply(function () {
                            scope.localModel = false;
                        });
                    });
                });
            }
        };
    });
},{}],18:[function(require,module,exports){
/**
 * Binds a TinyMCE widget to <textarea> elements.
 * Downloaded from: https://github.com/angular-ui/ui-tinymce/blob/master/src/tinymce.js
 * and changed a bit by adding default tinymce behaviour
 */
angular.module('ui.tinymce', [])
    .value('uiTinymceConfig', {})
    .directive('uiTinymce', ['uiTinymceConfig', function(uiTinymceConfig) {
        uiTinymceConfig = uiTinymceConfig || {};
        var generatedIds = 0;
        return {
            require: 'ngModel',
            link: function(scope, elm, attrs, ngModel) {
                var expression, options, tinyInstance,
                    updateView = function() {
                        ngModel.$setViewValue(elm.val());
                        if (!scope.$$phase) {
                            scope.$apply();
                        }
                    };
                // generate an ID if not present
                if (!attrs.id) {
                    attrs.$set('id', 'uiTinymce' + generatedIds++);
                }

                if (attrs.uiTinymce) {
                    expression = scope.$eval(attrs.uiTinymce);
                } else {
                    expression = {};
                }
                options = {
                    // Update model when calling setContent (such as from the source editor popup)
                    setup: function(ed) {
                        var args;
                        ed.on('init', function(args) {
                            ngModel.$render();
                        });
                        // Update model on button click
                        ed.on('ExecCommand', function(e) {
                            ed.save();
                            updateView();
                        });
                        // Update model on keypress
                        ed.on('KeyUp', function(e) {
                            ed.save();
                            updateView();
                        });
                        // Update model on change, i.e. copy/pasted text, plugins altering content
                        ed.on('SetContent', function(e) {
                            if (!e.initial) {
                                ed.save();
                                updateView();
                            }
                        });
                        if (expression.setup) {
                            scope.$eval(expression.setup);
                            delete expression.setup;
                        }
                    },
                    mode: 'exact',
                    elements: attrs.id
                };
                // extend options with initial uiTinymceConfig and options from directive attribute value
                angular.extend(options, uiTinymceConfig, expression);
                setTimeout(function() {
                    tinymce.init(options);
                });


                ngModel.$render = function() {
                    if (!tinyInstance) {
                        tinyInstance = tinymce.get(attrs.id);
                    }
                    if (tinyInstance) {
                        tinyInstance.setContent(ngModel.$viewValue || '');
                    }
                };
            }
        };
    }]);
},{}],19:[function(require,module,exports){
/**
 * creates a jquery fileupload
 */
angular.module('ui.upload', [])
    .directive('uiUpload', [function () {
        var generatedIds = 0;
        return {

            link: function(scope, elm, attr) {
                var options;

                if (attr.uiUpload) {
                    options = scope.$eval(attr.uiUpload);
                } else {
                    options = {};
                }

                if (!attr.id) {
                    attr.$set('id', 'uiUpload' + generatedIds++);
                }

                $('#fileupload').fileupload(options);
            }
        };
    }]);
},{}],20:[function(require,module,exports){
angular.module('logsApp', ['services', 'ngResource', 'sharedmodule'])

.config(['$routeProvider', '$httpProvider', function($routeProvider, $httpProvider) {
        $routeProvider
            .when('/logs', { 
                templateUrl: '/admin/logs', 
                controller: 'logsController' });
    }])

.controller('logsController', ['$scope', 'logsService',
    function ($scope, logsService) {

        $scope.logs = logsService.query({ limit: 75 });
    }]);
},{}],21:[function(require,module,exports){
angular.module('mainSettingsApp', ['services', 'cms.growlers', 
	'ngResource', 'sharedmodule', 'httpRequestInterceptors'])

    .value('settingKeys', ['website_mainurl', 'website_title', 'email_address', 'mainaddress']);
},{}],22:[function(require,module,exports){
angular.module("httpRequestInterceptors", [])

.config(['$httpProvider', function ($httpProvider) {
    
    $httpProvider.interceptors.push(function($q, notificationService){
        
        return {
                'responseError': function (response) {

                    if (response.data.UnhandledExceptionMessage) {
                        notificationService.addErrorMessage(response.data.UnhandledExceptionMessage);
                    }

                    if (response.data.RuleViolationExceptions) {

                        for (var i = 0; i < response.data.RuleViolationExceptions.length; i++) {
                            notificationService.addErrorMessage(response.data.RuleViolationExceptions[i]);
                        }
                    }

                    return $q.reject(response);
                }
            };
    });
 }]);
},{}],23:[function(require,module,exports){
angular.module('services', ['ngResource'])

	.factory('logsService', ['$resource', function ($resource) {
	    return $resource('/admin/api/logs');
	}])

	.factory('settingsService', ['$http', function ($http) {

	    return {
	        findByKeys: function (keys) {

	            var keysData = '';

	            for (var i = 0; i < keys.length; i++) {
	                if (i === 0) {
	                    keysData = '?keys=' + keys[i];
	                } else {
	                    keysData += '&keys=' + keys[i];
	                }
	            }

	            return $http.get('/admin/api/settings/' + keysData);
	        },
	        saveSettings: function (keyValues) {

	            var data = JSON.stringify(keyValues);

	            return $http.post('/admin/api/settings', data);
	        }
	    };
	}])

	.factory('uploadsService', ["$http", function ($http) {
	    return {
	        getFolderContents: function(path) {

	            return $http({
	                method: 'GET',
	                url: '/admin/api/uploadmanagement/getfoldercontents' + createQueryStringFromPath(path)
	            });
	        },
	        deleteFile: function(path, fileName) {

	            var pathQueryString = createQueryStringFromPath(path);

	            return $http({
	                method: 'DELETE',
	                url: '/admin/api/uploadmanagement/deletefile{0}filename={1}'.format(pathQueryString, fileName)
	            });
	        },
	        deleteFolder: function(path, folderName) {
	            
	            var pathQueryString = createQueryStringFromPath(path);
	            
	            return $http({
	                method: 'DELETE',
	                url: '/admin/api/uploadmanagement/deletefolder{0}foldername={1}'.format(pathQueryString, folderName)
	            });
	        },
	        createFolder: function (path, folderName) {

	            var pathQueryString = createQueryStringFromPath(path);

	            return $http({
	                method: 'POST',
	                url: '/admin/api/uploadmanagement/createfolder{0}foldername={1}'.format(pathQueryString, folderName)
	            });
	        }
	    };
    
	    function createQueryStringFromPath(path) {
	        var queryString = '?';

	        for (var i = 0; i < path.length; i++) {
	            if (i === 0) {
	                queryString = '?folders=' + path[i] + '&';
	            } else {
	                queryString += 'folders=' + path[i] + '&';
	            }
	        }

	        return queryString;
	    }
	}])
	
	.factory('notificationService', ['$rootScope', function($rootScope) {
	    var listeners = [];

	    $rootScope.$on("$routeChangeStart", function() {
	        listeners = [];
	    });

	    return {
	        addErrorMessage: function(message) {
	            for (var i = 0; i < listeners.length; i++) {

	                if (listeners[i].messageType === 'error') {
	                    listeners[i].handler(message);
	                }
	            }
	        },
	        addSuccessMessage: function(message) {
	            for (var i = 0; i < listeners.length; i++) {

	                if (listeners[i].messageType === 'success') {
	                    listeners[i].handler(message);
	                }
	            }
	        },

	        addListener: function(func, messageType) {
	            listeners.push({ handler: func, messageType: messageType });
	        }
	    };
	}]);
},{}],24:[function(require,module,exports){
function showGrowl(type, message) {

    if(message === undefined) {
        message = "an error occured!";
    }

    if (type === 'success') {
        $.growl.notice({
            title: cms.adminResources.get('ADMIN_GROWL_TITLE_SUCCESS'),
            message: message
        });
    }

    if (type === 'error') {
        $.growl.error({
            title: cms.adminResources.get('ADMIN_GROWL_TITLE_ERROR'),
            message: message
        });
    }
}


},{}],25:[function(require,module,exports){
var angular = require('_angular');

angular.module('filters', [])
	.filter('__', function() {
        return function(input, args) {
            return cms.adminResources.get(input, args);
        }
    });
},{"_angular":undefined}],26:[function(require,module,exports){
'use strict';

// Add ECMA262-5 method binding if not supported natively
//
if (!('bind' in Function.prototype)) {
    Function.prototype.bind = function (owner) {
        var that = this;
        if (arguments.length <= 1) {
            return function () {
                return that.apply(owner, arguments);
            };
        } else {
            var args = Array.prototype.slice.call(arguments, 1);
            return function () {
                return that.apply(owner, arguments.length === 0 ? args : args.concat(Array.prototype.slice.call(arguments)));
            };
        }
    };
}

// Add ECMA262-5 string trim if not supported natively
//
if (!('trim' in String.prototype)) {
    String.prototype.trim = function () {
        return this.replace(/^\s+/, '').replace(/\s+$/, '');
    };
}

// Add ECMA262-5 Array methods if not supported natively
//
if (!('indexOf' in Array.prototype)) {
    Array.prototype.indexOf = function (find, i /*opt*/) {
        if (i === undefined) i = 0;
        if (i < 0) i += this.length;
        if (i < 0) i = 0;
        for (var n = this.length; i < n; i++)
            if (i in this && this[i] === find)
                return i;
        return -1;
    };
}
if (!('lastIndexOf' in Array.prototype)) {
    Array.prototype.lastIndexOf = function (find, i /*opt*/) {
        if (i === undefined) i = this.length - 1;
        if (i < 0) i += this.length;
        if (i > this.length - 1) i = this.length - 1;
        for (i++; i-- > 0;) /* i++ because from-argument is sadly inclusive */
            if (i in this && this[i] === find)
                return i;
        return -1;
    };
}
if (!('forEach' in Array.prototype)) {
    Array.prototype.forEach = function (action, that /*opt*/) {
        for (var i = 0, n = this.length; i < n; i++)
            if (i in this)
                action.call(that, this[i], i, this);
    };
}
if (!('map' in Array.prototype)) {
    Array.prototype.map = function (mapper, that /*opt*/) {
        var other = new Array(this.length);
        for (var i = 0, n = this.length; i < n; i++)
            if (i in this)
                other[i] = mapper.call(that, this[i], i, this);
        return other;
    };
}
if (!('filter' in Array.prototype)) {
    Array.prototype.filter = function (filter, that /*opt*/) {
        var other = [], v;
        for (var i = 0, n = this.length; i < n; i++)
            if (i in this && filter.call(that, v = this[i], i, this))
                other.push(v);
        return other;
    };
}
if (!('every' in Array.prototype)) {
    Array.prototype.every = function (tester, that /*opt*/) {
        for (var i = 0, n = this.length; i < n; i++)
            if (i in this && !tester.call(that, this[i], i, this))
                return false;
        return true;
    };
}
if (!('some' in Array.prototype)) {
    Array.prototype.some = function (tester, that /*opt*/) {
        for (var i = 0, n = this.length; i < n; i++)
            if (i in this && tester.call(that, this[i], i, this))
                return true;
        return false;
    };
}

String.prototype.format = function () {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined'
          ? args[number]
          : match
        ;
    });
};
},{}],27:[function(require,module,exports){
angular.module('sharedmodule', [])
.controller("maincontroller", function($scope, $http, $window){
	$scope.logout = function () {
        
    	$http({ method: 'POST',
                url: '/admin/api/logout'
            })
    		.then(function() {
            	$window.location.href = '/admin';
        	});
    }
})
.controller('settingsController', function($scope, $parse, settingsService, 
       settingKeys, notificationService){

    function retrieveAndBindScopeVariables() {

        settingsService.findByKeys(settingKeys).then(function(result) {

            for (var i = 0; i < result.data.length; i++) {

                (function(keyValue) {

                    $parse('settings.' + keyValue.key).assign($scope, keyValue.value);

                })(result.data[i]);
            }
        });
    }

    retrieveAndBindScopeVariables();
    
	$scope.saveButtonClicked = function () {
            var keyValues = [];

            for (var i = 0; i < settingKeys.length; i++) {
                
                var key = settingKeys[i];
                var value = $parse('settings.' + key)($scope);

                keyValues.push({ key: key, value: value });
            }

            settingsService.saveSettings(keyValues).then(function(){
            	 notificationService.addSuccessMessage(cms.adminResources.get("ADMIN_SETTINGS_NOTIFY_SETTINGSSAVED"));
            });
        };
});;

},{}],28:[function(require,module,exports){
cms = window.cms || {};

cms.uploadsApp = angular.module('uploadsApp', ['cms.growlers', 'ui.upload', 'services']).
    config(['$httpProvider', function($httpProvider) {

        $httpProvider.responseInterceptors.push('httpInterceptor');
    }]);
},{}],29:[function(require,module,exports){
cms.uploadsApp.controller('uploadsController', [
    '$scope', 'notificationService', '$http', 'uploadsService',
    function($scope, notificationService, $http, uploadsService) {

        $scope.folders = [];
        $scope.createFolderName = '';
        $scope.uploadConfig = {
            url: '/admin/api/uploadmanagement/uploadfiles',
            dataType: 'json',
            dropZone: $('#dropzone'),
            complete: function(xhr) {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    if (xhr.status == 200) {
                        notificationService.addSuccessMessage(cms.adminResources.get("UPLOADS_NOTIFY_FILEUPLOADED"));
                        retrieveFolderContents();

                    } else {
                        notificationService.addErrorMessage(cms.adminResources.get("UPLOADS_NOTIFY_FILENOTUPLOADED"));
                    }
                }
            },
            start: function() {
                updateProgress(0);
            },
            progressall: function(e, data) {
                var progress = parseInt(data.loaded / data.total * 100, 10);
                updateProgress(progress);
            },
            submit: function(e, data) {
                data.formData = { 'folders[]': JSON.stringify($scope.folders) };
            }
        };

        $scope.createFolder = function() {

            uploadsService.createFolder($scope.folders, $scope.createFolderName).success(function() {
                retrieveFolderContents();
                notificationService.addSuccessMessage(cms.adminResources.get("UPLOADS_NOTIFY_FOLDERCREATED", $scope.createFolderName));
                $scope.createFolderName = '';
            });

        };

        $scope.openFolder = function(folder) {
            $scope.folders.push(folder);
            retrieveFolderContents();

            return false;
        };

        $scope.deleteFolder = function(folderName) {

            if (confirm(cms.adminResources.get("UPLOADS_NOTIFY_DELETEFOLDER", folderName))) {
                uploadsService.deleteFolder($scope.folders, folderName).success(function() {
                    retrieveFolderContents();

                    notificationService.addSuccessMessage(cms.adminResources.get("UPLOADS_NOTIFY_FOLDERDELETED", folderName));
                });
            }
        };

        $scope.deleteFile = function(fileName) {

            if (confirm(cms.adminResources.get("UPLOADS_NOTIFY_DELETEFILE", fileName))) {
                uploadsService.deleteFile($scope.folders, fileName).success(function() {
                    retrieveFolderContents();
                    notificationService.addSuccessMessage(cms.adminResources.get("UPLOADS_NOTIFY_FILEDELETED", fileName));
                });
            }
        };

        $scope.gotoFolder = function(folder) {

            var index = $scope.folders.indexOf(folder);
            var length = $scope.folders.length - index;

            if (index !== -1) {
                $scope.folders.splice(index, length, folder);
            } else {
                $scope.folders = [];
            }

            retrieveFolderContents();
        };

        function updateProgress(percentage) {
            $scope.uploadProgress = percentage + '%';

            if (!$scope.$$phase) {
                $scope.$apply();
            }
            console.log('upload progress: ' + $scope.uploadProgress);
        }

        function retrieveFolderContents() {
            uploadsService.getFolderContents($scope.folders).success(function(data) {

                $scope.folderContent = data;
            });
        }

        retrieveFolderContents();

        updateProgress(0);
    }
]);
},{}]},{},[9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,1,2,3,4,5,6,7,8]);