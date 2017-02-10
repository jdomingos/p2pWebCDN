var express = require('express');
var app = express();
var ExpressPeerServer = require('peer').ExpressPeerServer;

app.use(function(req, res, next){
	if(req.path.indexOf('img') != -1) console.log('serving an image: ' + req.path);
	next();
});

app.use(express.static(__dirname + '/public', { etag: false, lastModified: false}));


var server = app.listen(8080, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});

var options = {
    debug: true,
	 allowDiscovery: true,
	 allow_discovery: true
}

app.use('/peerjs', ExpressPeerServer(server, options));
