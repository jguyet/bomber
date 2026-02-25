(function () {
    window.page_params = {};
    var p = location.search.substring(1).split("&");
    for (var i=0;i<p.length;i++) {
        var v = p[i].indexOf("=");
        if (v>=0)
            page_params[p[i].substring(0, v)] = p[i].substring(v+1);
    }
})();


bombermine.service('params', function() {
    var params = { "auth" : config.auth || "b" };
    //VK
    if (page_params['api_id']) {
        params['api_id'] = page_params['api_id'],
            params['viewer_id'] = page_params['viewer_id'],
            params['auth_key'] = page_params['auth_key'],
            params['user_id'] = page_params['user_id'],
            params['group_id'] = page_params['group_id'],
            params['is_app_user'] = page_params['is_app_user'],
            params['api_result'] = page_params['api_result'],
            params['api_settings'] = page_params['api_settings'],
            params['referrer'] = page_params['referrer']
    }
    
    return {
        get: function(key) {
            if (key) return params[key];
            return params;
        },
        getParam: function (key) {
            if (key) return page_params[key] || null;
            return page_params
        }
    }
})

bombermine.factory('myHttpResponseInterceptor', function($q, $location, params, $rootScope) {
    //for iframes!
    var override_params = params.get();
    var apiUri = '/api/';
    
    return {
        request: function(config) {
            if (config.url.substring(0, apiUri.length) == apiUri) {
                config.params = config.params || {}
                for (var key in override_params)
                    if (override_params.hasOwnProperty(key))
                        config.params[key] = override_params[key];
                if (document.cookie.length == 0 && $rootScope.user && $rootScope.user.id > 0) {
                    config.params['cookieToken'] = $rootScope.user.token;
                }
            }
            return config;
        }
    }
})

bombermine.config(function($httpProvider) {
    $httpProvider.interceptors.push('myHttpResponseInterceptor');
    $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
});