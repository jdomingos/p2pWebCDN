var connections = {};
var peer = new Peer({
	// host: '52.18.51.141',
	// port: 80,
	host: 'localhost',
	port: 8080,
	path: '/peerjs',
	allowDiscovery: true,
	debug: 3
});
var runned = false;
var interval;

// Function to know if image is cached...
// There has to be a better way, loses purpose to fetch from the server...
function cached(url){
	var test = document.createElement("img");
	test.src = url;
	return test.complete || test.width+test.height > 0;
}

function getBase64FromImageUrl(url, done) {
    var img = new Image();

    img.onload = function () {
        var canvas = document.createElement("canvas");
        canvas.width =this.width;
        canvas.height =this.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(this, 0, 0);
        var dataURL = canvas.toDataURL("image/png");
        done(dataURL);
    };

    img.src = url;
}


String.prototype.hashCode = function() {
  var hash = null;
  if (this.length == 0) return hash;
  hash = window.btoa(this);
  return hash;
};

function getImageFromServer(opts) {
	var img = document.querySelector('[data-id="'+opts.id+'"]')

	var first = new Date();

	img.onload = function () {
		var last = new Date();
		console.log(opts.fullurl + ' : server image loading : ' + (last-first) + ' ms');
	};
	img.setAttribute('src', opts.datasrc);

	getBase64FromImageUrl(opts.fullurl, function(content) {
		opts.content = content;
		loggerz('server', content);
		storeContent(opts, true);
	});
}

function loggerz(type, content, peer) {
	var currentcount = document.getElementById(type+'-count').textContent;
	if(currentcount.length > 0) currentcount = parseInt(currentcount);
	currentcount++;
	document.getElementById(type+'-count').textContent = currentcount.toString();

	var currentsize = document.getElementById(type+'-size').textContent;
	if(currentsize.length > 0) currentsize = parseInt(currentsize);
	currentsize += content.length;
	document.getElementById(type+'-size').textContent = currentsize.toString();

	if(peer) {
		var p = document.getElementById(peer);
		if(p == null) {
			var peerlist = document.getElementById('peerlist');
			var el = document.createElement('li');
			el.setAttribute('id', peer);
			el.textContent = peer + ' ';
			var c = document.createElement('span');
			c.setAttribute('id', peer+'-count');
			var s = document.createElement('span');
			s.setAttribute('id', peer+'-size');
			var spacer1 = document.createElement('span');
			spacer1.textContent = ' file(s) / '
			var spacer2 = document.createElement('span');
			spacer2.textContent = ' bytes'
			peerlist.appendChild(el);
			peerlist.appendChild(c);
			peerlist.appendChild(spacer1);
			peerlist.appendChild(s);
			peerlist.appendChild(spacer2);
		}
		var currentcount = document.getElementById(peer+'-count').textContent;
		if(currentcount.length > 0) currentcount = parseInt(currentcount);
		currentcount++;
		document.getElementById(peer+'-count').textContent = currentcount.toString();

		var currentsize = document.getElementById(peer+'-size').textContent;
		if(currentsize.length > 0) currentsize = parseInt(currentsize);
		currentsize += content.length;
		document.getElementById(peer+'-size').textContent = currentsize.toString();
	}
}

function configureConnection(conn, done) {
	conn.on('data', function(data){
		if(data && !data.request && data.hash && window.localStorage) {
			console.log('got data');
			console.log(data);
			console.log('************************');
			document.querySelector('[data-id="'+data.id+'"]').src = data.content;
			loggerz('peer', data.content, conn.peer);
			storeContent(data, true);
		} else if(data && data.request && data.hash && window.localStorage) {
			if(window.localStorage[data.hash] !== undefined) {
				console.log('got request data');
				console.log(window.localStorage[data.hash]);
				var toSend = JSON.parse(window.localStorage[data.hash]);
				console.log(toSend);
				conn.send(toSend);
			}
		} else {
			console.log('alternative');
			console.log(data);
		}
	});

	if(done !== undefined) {
		done();
	} else {
		console.log('no done : ' + conn);
	}
}

function storeContent(opts, announce){
	window.localStorage[opts.hash] = JSON.stringify(opts);
	if(announce) peer.announceContent(opts.hash);
}

function connectAndRequest(opts, list) {

	var chosenOne = list[Math.floor(Math.random()*list.length)];
	//console.log(chosenOne);
	//console.log(connections);
	var conn = connections[chosenOne];
	if (conn === undefined) {
		conn = peer.connect(chosenOne);
		connections[chosenOne] = conn;
		conn.on('open', function(){
			configureConnection(conn, function(){
				console.log('REQ _ '+opts.fullurl);
				conn.send({request: true, hash: opts.hash});
			})
		});
		conn.on('error', function(err) { alert(err); });
	} else {
		var timesTried = 0;
		var random = Math.random();
		var cenas = setInterval(function(){
			if(conn.open) {
				clearTimeout(cenas);
				console.log('REQ _ '+opts.fullurl);
				conn.send({request: true, hash: opts.hash});
			} else {
				timesTried++;
				console.log('closed')
				if(timesTried == 3) {
					clearTimeout(cenas);
					console.log('SREQ _ '+opts.fullurl);
					getImageFromServer(opts);
				}
			}
		},500);
	}

/*
	setConnectionListener(conn);
	if(conn.listeners('open') !== undefined && conn.listeners('open').length == 0){
		console.log('forrealz')
		conn.on('open', function(){
			console.log('2opened connection with: '+ conn.peer);
			conn.send({request: true, hash: opts.hash});
		});
	} else {
		console.log('sendin');
		var timesTried = 0;
		var cenas = setInterval(function(){
			if(conn.open && false) {
				clearTimeout(cenas);
				conn.send({request: true, hash: opts.hash});
			} else {
				timesTried++;
				console.log('closed')
				if(timesTried == 5) {
					clearTimeout(cenas);
					getImageFromServer(opts);
				}
			}
		},500);
	}
	*/
}

peer.on('connection', configureConnection);

window.onload = function() {
	interval = setInterval(function(){
		if(peer.open && !runned) {
			console.log('runnerz')
			runned = true;
			window.clearTimeout(interval);
			var images = document.querySelectorAll("img");
			var index;
			console.log("images " +images.length);
			for (index = 0; index < images.length; index++) {
				(function(idx) {
					var currentImg = images[idx];
					var imgOptions = {};

					var datasrc = currentImg.getAttribute('data-src');
					var hashens = datasrc.hashCode();
					var fullurl = datasrc;

					currentImg.setAttribute('data-id', hashens);

					imgOptions.id = currentImg.getAttribute('data-id');
					imgOptions.datasrc = datasrc;
					imgOptions.hash = hashens;
					imgOptions.fullurl = fullurl;

					if(false) {
						console.log('trueodom')
						images[index].setAttribute('src', imgOptions.datasrc);
					} else {
						peer.listAllPeersWithContent(imgOptions.hash, function(list) {
							if(list && list.length == 0) {
								console.log('servs');
								getImageFromServer(imgOptions);

							} else {
								console.log('peerz');
								connectAndRequest(imgOptions, list);
							}
						});

					}
				})(index);
			}
		}
	}, 500);

};
