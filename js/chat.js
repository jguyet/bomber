
var onchatpress = function(event)
{
	var key = event.keyCode;
	if (key == 13)
	{
		var msg = document.getElementById("msgText").value;
		sendSocketMessage('MN' + msg);
		document.getElementById("msgText").value = "";
	}
};

var onchatdelete = function(event)
{
};

var addmessagetochat = function(data)
{
	var elem = document.createElement("li");
	elem.setAttribute("class", "ng-scope");
	elem.innerHTML = "<span ng-show=\"!msg.killinfo\"><b class=\"nickname ng-binding\" ng-class=\"{'my-msg': msg.my}\">unknow</b>"
						+ ":</span><span class=\"text\" ng-switch=\"msg.special\">"
						+ "<span class=\"time colorFFF ng-binding ng-hide\" ng-show=\"msg.showTime\">23:18</span>"
						+ "<span ng-switch-default=\"\" ng-bind-html=\"getText(msg)\" class=\"ng-binding ng-scope\">" + data + "</span>"
						+ "</span>";
	var chat = document.getElementById("endchat");
	var parentdiv = chat.parentNode;
	parentdiv.insertBefore(elem, chat);
};