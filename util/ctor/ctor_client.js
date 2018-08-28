var isOnServer = false;

function checkSupportsSubarray() {
	var data;
	if (typeof document != "undefined") {
		var canvas = document.createElement('canvas');
		canvas.height = canvas.width = 8;
		data = canvas.getContext('2d').getImageData(0, 0, 8, 8).data;
	}else { // in web worker
		data = new Uint8Array(10);
	}
	return def(data.subarray);
}
var supportsSubarray = checkSupportsSubarray();

//======================  "this" hack ========================
var __nativeST__ = (typeof window == "undefined" ? self : window).setTimeout;
var mySetTimeout = function (vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */) { var oThis = this, aArgs = Array.prototype.slice.call(arguments, 2); return __nativeST__(vCallback instanceof Function ? function () { vCallback.apply(oThis, aArgs); } : vCallback, nDelay); };
	
/**
 * json loader
 */
function loadJson(url, onSuccess, onFail) {
	$.getJSON(url)
		.done( function(data, textStatus, jqxhr) {
			if (typeof onSuccess != "undefined")
				onSuccess(data);
		} )
		.fail( function(jqxhr, textStatus, error) {
			console.log("Loading JSON error: " + error);
			if (typeof onFail != "undefined")
				onFail();
		} );	
}

function createCanvas (w, h) {
	var canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	return canvas;
}

base64decode = base64.decode;
base64encode = base64.encode;