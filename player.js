var QueryString = function () {
	// This function is anonymous, is executed immediately and 
	// the return value is assigned to QueryString!
	var query_string = {};
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split("=");
		// If first entry with this name
		if (typeof query_string[pair[0]] === "undefined") {
			query_string[pair[0]] = decodeURIComponent(pair[1]);
			// If second entry with this name
		} else if (typeof query_string[pair[0]] === "string") {
			var arr = [query_string[pair[0]], decodeURIComponent(pair[1])];
			query_string[pair[0]] = arr;
			// If third or later entry with this name
		} else {
			query_string[pair[0]].push(decodeURIComponent(pair[1]));
		}
	}
	return query_string;
}();

var fileName;
var player;
var counter = 0;
var fileReady = false;
var peerFileReady = false;
var watchingYouTube = false;

function handleFileSelect(evt) {
	evt.stopPropagation();
	evt.preventDefault();

	var file = evt.dataTransfer.files[evt.dataTransfer.files.length - 1];
	fileName = file.name;

	var fileURL = URL.createObjectURL(file);
	watchingYouTube = false;
	player.src(fileURL);
}

function handleDragOver(evt) {
	evt.stopPropagation();
	evt.preventDefault();
	evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

function close(peer) {
	document.getElementById("status").innerHTML = peer + " left";
	document.getElementById("pcon").hidden = false;
	counter = 0;
	peerFileReady = false;
	player.pause();
	player.exitFullscreen();
	// player.controls(false);
}

function connect(conn) {
	document.getElementById("drop_zone").hidden = false;
	document.getElementById("pcon").hidden = true;

	conn.on('data', function (data) {
		counter++;
		if (data.indexOf("youtube") > -1) {
			watchingYouTube = true;
			player.controls(false);
			player.src(data);
			player.load();
			// player.controls(true);
			document.getElementById("yt").value = data;
		} else if (data.indexOf("video") > -1) {
			watchingYouTube = false;
			document.getElementById("status").innerHTML = conn.peer + " " + data;
			peerFileReady = true;
			player.controls(fileReady);
		} else if (parseFloat(data[0])) {
			var newTime = parseFloat(data[0]);
			// var dif;
			// if(data[2]){
			// 	var now = new Date().getTime()/1000;
			// 	dif = now-data[2];
			// }
			document.getElementById("status").innerHTML = "connected to: " + conn.peer + " (" + counter + " transers)";
			if (data[1]) {
				if (!player.paused()) {
					player.pause();
					player.currentTime(newTime);
				} else {
					if (Math.abs(player.currentTime() - newTime) > 0.5) {
						player.currentTime(newTime);
					}
				}
			} else {
				if (player.paused()) {
					player.currentTime(newTime);
					player.play();
				} else {
					if (Math.abs(player.currentTime() - newTime) > 0.5) {
						player.currentTime(newTime);
					}
				}

			}
		} else {
			// alert(data);
		}
	});
	if (fileReady) {
		conn.send("finished loading video: " + fileName);
	}
	conn.on('close', function () {
		close(conn.peer);
	});
}

$(document).ready(function () {

	// Setup the dnd listeners.
	if (!util.supports.data) {
		alert("Browser not supported. Please try chrome, firefox or opera");
		return;
	}
	var dropZone = document.getElementById('drop_zone');
	if (dropZone) {
		dropZone.addEventListener('dragover', handleDragOver, false);
		dropZone.addEventListener('drop', handleFileSelect, false);
	}
	var conn;
	$.get("https://service.xirsys.com/ice", {
			ident: "enzosv",
			secret: "703e2ade-4404-11e5-a87c-1b8a11071947",
			domain: "www.enzosv.com",
			application: "default",
			room: "default",
			secure: 1
		},
		function (data, status) {
			// alert("Data: " + data + "nnStatus: " + status);
			// customConfig = data.d;
			if (status === "success") {
				var peer = new Peer({
					key: 'gmjoa8gw79tqpvi',
					config: data.d
				});
				peer.on('open', function (id) {
					$('#pid').text(id);
					if (QueryString.peer) {
						conn = peer.connect(QueryString.peer);
						conn.on('open', function () {
							connect(conn);
							document.getElementById("status").innerHTML = "you connected to: " + conn.peer;
						});
						conn.on('error', function (err) {
							alert(err);
						});
					} else {
						document.getElementById("connect").disabled = false;
						document.getElementById("share").disabled = false;
					}
				});
				$('#connect').click(function () {
					conn = peer.connect($('#rid').val());
					conn.on('open', function () {
						connect(conn);
						document.getElementById("status").innerHTML = "you connected to: " + conn.peer;
					});
					conn.on('error', function (err) {
						alert(err);
					});
				});
				$('#share').click(function () {
					window.prompt("Copy to clipboard: Ctrl+C, Enter", "http://playaway.bitballoon.com?peer=" + peer.id);
				});
				$('#load').click(function () {
					watchingYouTube = true;
					var yt = document.getElementById("yt").value;
					player.controls(false);
					player.src(yt);
					conn.send(yt);
					player.load();

				});

				peer.on('connection', function (c) {
					conn = c;
					connect(c);
					document.getElementById("status").innerHTML = c.peer + " connected to you";
				});

				peer.on('close', function () {
					close(peer.id);
				});
			} else {
				alert("Failed to connect to server. Please refresh");
			}

		});

	_V_('really-cool-video').ready(function () {
		player = this;
		player.on("play", function () {
			conn.send([player.currentTime(), false]);
		});

		player.on("durationchange", function () {
			if (!watchingYouTube) {
				fileReady = false;
				player.exitFullscreen();
			} else {
				if (!player.controls()) {
					player.controls(true);
					player.play();
					player.pause();
					player.currentTime(0.1);
				}
			}
		});
		player.on("pause", function () {
			conn.send([player.currentTime(), true]);
		});
		player.on("ended", function () {
			player.exitFullscreen();
		});
		player.on("loadedalldata", function () {
			if (!watchingYouTube) {
				fileReady = true;
				player.controls(peerFileReady);
				conn.send("finished loading video: " + fileName);
			}
		});
		// player.on("waiting", function () {
		// 	player.pause();
		// });
	});
});