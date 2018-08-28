bombermine.controller('SliderCtrl', function($http, $scope, $rootScope, $location, i18nFilter) {
	/*slider, new constructor page*/

	$scope.sliderPrev = function(index, items) {
		var ul = angular.element("#slider_"+index);
		slide(ul, true);
	}
	$scope.sliderNext = function(index,items) {
		var ul = angular.element("#slider_"+index)
		slide(ul, false);
	}
	function slide(ul, znak) {
		$scope.sizeUl(ul);
		var wW = ul.parent(".slideUl").width();
		var w = wW*0.5;
		var wUl = ul.width();
		var maxMargin =  (-1)*Math.abs(ul.parent(".slideUl").width() - wUl);
		var prev = ul.parent(".slideUl").parent(".slider").find(".prev_button");
		var next = ul.parent(".slideUl").parent(".slider").find(".next_button");
		var sign = "-";
		if (znak)
			sign = "+";
		var marginUl = ul[0].style.marginLeft;
		marginUl = marginUl.substring(0, marginUl.length - 2) || 0;
		marginUl = +marginUl + +(sign + w);
		var lastLi = ul.children('li').last();
		$(prev).removeClass("noLink");
		$(next).removeClass("noLink");

		if (marginUl < maxMargin) {
			
			$(next).addClass("noLink");
			marginUl = maxMargin;
		}
		if (marginUl > 0) {

			$(prev).addClass("noLink");
			marginUl = 0;
		}
		if ((wUl < wW) || (lastLi[0].innerHTML == "")) {
			marginUl = 0;
			$(prev).addClass("noLink");
			$(next).addClass("noLink");
		}
		ul[0].style.marginLeft = marginUl + "px";
	}

	$scope.addLi = function(ul, wLi, hLi) {
		var wUl = ul.width();
		var wSlide = ul.parent('.slideUl').width();

		var prev = ul.parent(".slideUl").parent(".slider").find(".prev_button");
		var next = ul.parent(".slideUl").parent(".slider").find(".next_button");
		if (wUl < wSlide) {
			var d = wSlide - wUl;
			var n = Math.ceil(d / (wLi+8));
			for (var i = 0; i < n; i++) {
				var li = document.createElement('li');
				$(li).addClass('thumb');
				$(li).css({'width': wLi + 'px', 'height': hLi + 'px'});
				ul[0].appendChild(li);
			}
			$(prev).addClass("noLink");
			$(next).addClass("noLink");
		}
	}

	$scope.sizeUl = function(ul1) {
		var ul = ul1.children();
		var w = ul.eq(0).width();
		var h = ul.eq(0).height();
		for (var i = 1; i < ul.length; i++) {
			if (ul.eq(i).width() > w)
				w = ul.eq(i).width();
			if (ul.eq(i).height() > h)
				h = ul.eq(i).height();
		}
		for (var i = 0; i < ul.length; i++) {
			var elem = angular.element(ul.eq(i));
			elem.css({'width': w + 'px', 'height': h + 'px'});
		}
		$scope.addLi(ul1, w, h);
		//øèðèíó è âûñîòó îïðåäåëÿåì äëÿ .color
		var color = ul1.parent().parent().prev().children();
		color.css({'width': w + 8 + 'px', 'height': h + 8 + 'px'});
		$scope.addLi(ul1, w, h);
	}

	$scope.changeUl = function() {
		setTimeout(function() {
		$scope.sizeUl(angular.element("#slider_0"));
		$scope.sizeUl(angular.element("#slider_1"));
		$scope.sizeUl(angular.element("#slider_2"));
		$scope.sizeUl(angular.element("#slider_3"));
		}, 0);

	}
	
	/*end slider*/
});
