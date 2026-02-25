
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
	// data = "nickname: text" (server prefixes sender name)
	var colonIdx = data.indexOf(': ');
	var sender = colonIdx > 0 ? data.substring(0, colonIdx) : 'Player';
	var text = colonIdx > 0 ? data.substring(colonIdx + 2) : data;

	// Build DOM safely (no innerHTML with user data — XSS safe)
	var li = document.createElement('li');
	li.setAttribute('class', 'ng-scope');

	var b = document.createElement('b');
	b.className = 'nickname ng-binding';
	b.textContent = sender;

	var span = document.createElement('span');
	span.className = 'text';
	span.textContent = text;

	li.appendChild(b);
	li.appendChild(document.createTextNode(': '));
	li.appendChild(span);

	var chat = document.getElementById("endchat");
	var parentdiv = chat.parentNode;
	parentdiv.insertBefore(li, chat);
};
