
var CHAT_MAX_MESSAGES = 100;
var chatAutoScroll = true;

var current_line = "";

var onchatpress = function(event)
{
	var key = event.keyCode;
	if (key == 13)
	{
		sendSocketMessage('MN' + current_line);
		current_line = "";
		setTimeout(function()
		{
			document.getElementById("msgText").value = "";
		}, 10);
	}
	else
	{
		var txt = String.fromCharCode(key);
		current_line += txt;
	}
};

var onchatdelete = function(event)
{
	var key = event.keyCode;

	if (key == 8 && current_line != "")
		current_line = current_line.substr(0, current_line.length - 1);
};

function pruneOldMessages() {
	var chatList = document.getElementById("listChat");
	if (!chatList) return;
	var items = chatList.querySelectorAll("li:not(#endchat)");
	while (items.length > CHAT_MAX_MESSAGES) {
		chatList.removeChild(items[0]);
		items = chatList.querySelectorAll("li:not(#endchat)");
	}
}

function initChatScroll() {
	var chatList = document.getElementById("listChat");
	if (!chatList) return;
	chatList.addEventListener("scroll", function() {
		var atBottom = (chatList.scrollTop + chatList.clientHeight >= chatList.scrollHeight - 5);
		chatAutoScroll = atBottom;
	});
}

var addmessagetochat = function(nickname, data)
{
	var isMyMsg = (nickname === playerNickname);
	var myMsgClass = isMyMsg ? ' my-msg' : '';
	var elem = document.createElement("li");
	elem.setAttribute("class", "ng-scope");
	elem.innerHTML = '<span><b class="nickname ng-binding' + myMsgClass + '">' + escapeHtml(nickname) + '</b>'
		+ ':</span><span class="text">'
		+ '<span class="ng-binding ng-scope">' + escapeHtml(data) + '</span>'
		+ '</span>';
	elem.setAttribute("data-category", "chat");
	var chat = document.getElementById("endchat");
	var parentdiv = chat.parentNode;
	parentdiv.insertBefore(elem, chat);
	if (typeof ChatFilters !== 'undefined') ChatFilters.onNewMessage(elem);
	pruneOldMessages();
	if (chatAutoScroll) {
		var chatList = document.getElementById("listChat");
		if (chatList) {
			chatList.scrollTop = chatList.scrollHeight;
		}
	}
};
