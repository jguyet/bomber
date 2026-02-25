/**
 * Chat Filters — Toggle visibility of chat messages by category.
 * Filter buttons already exist in index.html (.chat-filters ul).
 */
var ChatFilters = (function () {

	var activeFilter = 'all'; // 'all' | 'text' | 'kill' | 'mod' | 'common'

	function applyFilter() {
		var chatList = document.getElementById("listChat");
		if (!chatList) return;
		var items = chatList.querySelectorAll("li:not(#endchat)");
		for (var i = 0; i < items.length; i++) {
			var category = items[i].getAttribute("data-category") || "chat";
			if (activeFilter === 'all') {
				items[i].style.display = '';
			} else if (activeFilter === 'text' && category === 'chat') {
				items[i].style.display = '';
			} else if (activeFilter === 'kill' && category === 'kill') {
				items[i].style.display = '';
			} else if (activeFilter === category) {
				items[i].style.display = '';
			} else {
				items[i].style.display = 'none';
			}
		}
	}

	function onNewMessage(elem) {
		if (!elem) return;
		var category = elem.getAttribute("data-category") || "chat";
		if (activeFilter === 'all') {
			elem.style.display = '';
		} else if (activeFilter === 'text' && category === 'chat') {
			elem.style.display = '';
		} else if (activeFilter === 'kill' && category === 'kill') {
			elem.style.display = '';
		} else if (activeFilter === category) {
			elem.style.display = '';
		} else {
			elem.style.display = 'none';
		}
	}

	function setActiveButton(clickedBtn, allButtons) {
		for (var i = 0; i < allButtons.length; i++) {
			allButtons[i].classList.remove('selected');
		}
		clickedBtn.classList.add('selected');
	}

	function init() {
		var filterContainer = document.querySelector('.chat-filters');
		if (!filterContainer) return;

		var allButtons = filterContainer.querySelectorAll('button');
		var buttonMap = {
			'filter-all': 'all',
			'text': 'text',
			'kill': 'kill',
			'mod': 'mod',
			'common': 'common'
		};

		for (var i = 0; i < allButtons.length; i++) {
			(function (btn) {
				// Determine category from button class
				var category = null;
				for (var cls in buttonMap) {
					if (btn.classList.contains(cls)) {
						category = buttonMap[cls];
						break;
					}
				}
				if (!category) return; // skip unknown buttons (e.g. fb)

				btn.addEventListener('click', function () {
					activeFilter = category;
					setActiveButton(btn, allButtons);
					applyFilter();
				});
			})(allButtons[i]);
		}

		// Set filter-all as default selected
		var filterAllBtn = filterContainer.querySelector('.filter-all');
		if (filterAllBtn) {
			filterAllBtn.classList.add('selected');
		}
	}

	return {
		init: init,
		applyFilter: applyFilter,
		onNewMessage: onNewMessage
	};

})();

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function () {
	ChatFilters.init();
});
