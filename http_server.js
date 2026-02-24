var fs = require('fs');
var http = require('http');
var url = require('url');
var ROOT_DIR = "./";

var mimeTypes ={
	"js":"text/javascript",
	"json":"text/data",
	"html":"text/html",
	"png":"image/png",
	"jpg":"image/jpg",
	"jpeg":"image/jpeg",
	"br": "text/javascript"
}
http.createServer( function( req, res ) {
	if (req.url.split('?')[0] == '/') {
		req.url = '/index.html';
	}
	var urlObj = url.parse( req.url, true, false );
	var tmp  = urlObj.pathname.lastIndexOf(".");
	var extension  = urlObj.pathname.substring((tmp + 1));
	
	fs.readFile( ROOT_DIR + urlObj.pathname, function( err, data ){
		if( err ){
			res.writeHead(404);
			res.end(JSON.stringify( err ) );
			return;
		}
		if( mimeTypes[ extension ] ){
			if (extension === "br") {
				res.writeHead(200, {'Content-Encoding': 'br'});
			} else {
				res.writeHead(200, {'Content-Type': mimeTypes[extension]});
			}
		}
		else {
			res.writeHead(200, {'Content-Length': data.length});
		}
		res.end(data);
	} )
}).listen( 8060 );
console.log( "listening on port 8060" );