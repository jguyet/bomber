bombermine.controller('ModalCtrl', function($http, $scope, $rootScope, $modal, i18nFilter, UserService, Social) {
    $rootScope.showPerks = function() {
        var modalInstance = $modal.open({
            animation: false,
            templateUrl: 'tmpl/modal/show_perks.tmpl',
            controller: 'CloseModal'
        });
    }

    $rootScope.showChangePassword = function() {
        var modalInstance = $modal.open({
            animation: false,
            templateUrl: 'tmpl/modal/change_password.tmpl',
            controller: 'CloseModal'
        });
    }

    $rootScope.showChangeEmail = function() {
        var modalInstance = $modal.open({
            animation: false,
            templateUrl: 'tmpl/modal/change_email.tmpl',
            controller: 'CloseModal'
        });
    }

    $rootScope.showChangeNickname = function() {
        return $modal.open({
            animation: false,
            templateUrl: 'tmpl/modal/change_nickname.tmpl',
            controller: 'ChangeNickname'
        }).result;
    }

    $rootScope.messageBox = function(text, buttons, callback) {
        var modalInstance = $modal.open({
            animation: false,
            templateUrl: 'tmpl/modal/message_box.tmpl',
            controller: 'MessageBox',
            resolve: {
                params: function() {
                    return {
                        text: text, 
                        buttons: buttons
                    }
                }
            }
        });
        modalInstance.result.then(callback, function() { callback(1); } );
    }
    
    $rootScope.showBuyChests = function() {
        var modalInstance = $modal.open({
            animation: false,
            templateUrl: 'tmpl/modal/buy_chests.tmpl',
            controller: 'CloseModal'
        });
    }

    $rootScope.showBuyPlut = function() {
    	var modalInstance = $modal.open({
            animation: false,
            templateUrl: 'tmpl/modal/buy_plut.tmpl',
            controller: 'CloseModal'
        });
    }

    $rootScope.showRooms = function(hideTutor) {
    	var modalInstance = $modal.open({
            animation: false,
            templateUrl: 'tmpl/modal/show_rooms.tmpl',
            controller: 'ShowRooms',
            resolve: {
        		params: function() {
        			var trackRoomKey = hideTutor?"tutor_next_room":false;
        			var doFilter = hideTutor || false;
        			return {
        				doFilter: doFilter,
        				trackRoomKey: trackRoomKey
        			}
        		}
        	}
        });
    }

    $rootScope.showChangeButtons = function() {
    	var modalInstance = $modal.open({
            animation: false,
            templateUrl: 'tmpl/modal/show_change_buttons.tmpl',
            controller: 'ShowChangeButtons'
        });
    }

    $rootScope.showBuyItemModal = function(item, curr, hud, cb) {
        if ($rootScope.cantBuyAskRegister())
            return;
    	var modalInstance = $modal.open({
            animation: false,
            templateUrl: 'tmpl/modal/selling_box.tmpl',
            controller: 'SellingBox',
            resolve: {
        		params: function() {
        			return {
        				item: item,
        				curr: curr,
        				hud: hud,
        				cb: cb
        			}
        		}
        	}
        });
    }
	
    $rootScope.showNotEnoughMoney = function(curr, cb) {
        $modal.open({
            animation: false,
            templateUrl: 'tmpl/modal/selling_box.tmpl',
            controller: 'SellingBox',
            resolve: {
                params: function() {
                    return {
                        curr: curr,
                        cb: cb,
                        error: curr == "plut" ? "not_enough_plutonium" : "not_enough_gold"
                    }
                }
            }
        });
    }

    $rootScope.showRegister = function() {
    	if (Social.active) {
            Social.showRegister();
            return;
        }
        else {
	        var modalInstance = $modal.open({
	            animation: false,
	            templateUrl: 'tmpl/modal/register_modal.tmpl',
	            controller: 'RegisterModal'
	        });	
        }
    }

    $rootScope.showBuySlot = function(slots) {
    	var modalInstance = $modal.open({
            animation: false,
            templateUrl: 'tmpl/modal/buy_slot.tmpl',
            controller: 'BuySlot',
            resolve: {
        		params: function() {
        			return {
        				slots: slots
        			}
        		}
        	}
        });
    }

    $rootScope.askLogoutInGame = function() {
    	var modalInstance = $modal.open({
            animation: false,
            templateUrl: 'tmpl/modal/login_in_game.tmpl',
            controller: 'LoginInGame'
        });
    }

    //TODO: user âûäåëèòü â îòäåëüíûé êëàññ, ïîñòàâèòü òóò setUser , â ïðîòîòèïå äîëæåí áûòü ýòîò ìåòîä
    $rootScope.canChangeNickname = function() {
        var user = $rootScope.user;
        if (!user.is_guest) {
            if (user.nickname.indexOf("~") >= 0)
                return "must"
            if (!user.when_update_username || user.when_update_username < Date.now())
                return "yes"
            return "pay"
        }
        return "no"
    }

    $rootScope.checkProblems = function() {
        var user = $rootScope.user;
        var hasReliableProvider = user.identities.filter(function(x) { 
                return window.config.providersWithoutPassword.indexOf(x) < 0;
            }).length > 0;
        if (!user.is_guest && (user.providerId == "recover" && user.pwd_status == 'recovering' ||
            !hasReliableProvider && !user.pwd_status)) {
            $rootScope.showChangePassword();
        }
        if ($rootScope.canChangeNickname() == "must") {
            function changeNicknameRecursive() {
                $rootScope.showChangeNickname().then(function(){}, changeNicknameRecursive);
            }
            changeNicknameRecursive();
        }
    }

    //on login
    $rootScope.checkProblems();
});