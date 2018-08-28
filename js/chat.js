
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