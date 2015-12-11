// var fileURL;
function handleFileSelect(evt) {
	evt.stopPropagation();
	evt.preventDefault();

	// var file = evt.dataTransfer.files[evt.dataTransfer.files.length - 1];
	// var fileURL = URL.createObjectURL(file);
	// alert(fileURL);

}

function handleDragOver(evt) {
	evt.stopPropagation();
	evt.preventDefault();
	evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

$(document).ready(function () {
	// var uri = "http://cf1.vuze.com/vhdn/channels/55/OV/OVTF/OVTFYA/Manuel_Lima%3A_A_visual_history_of_human_knowledge%5BV005544596%5D.mp4.torrent";
	// var uri = "http://torcache.net/torrent/60B101018A32FBDDC264C1A2EB7B7E9A99DBFB6A.torrent";
	var uri = "http://torcache.net/torrent/BFE426E2A6DCBA5C161353ACD531F0427A06CF55.torrent?title=[kat.cr]mr.robot.s01e08.hdtv.x264.killers.ettv";
	var client = new WebTorrent();
	client.add(uri, function (torrent) {
		// Got torrent metadata!
		client.on('torrent', function (torrent) {
			torrent.files.forEach(function (file) {
				// Display the file by appending it to the DOM. Supports video, audio, images, and
				// more. Specify a container element (CSS selector or reference to DOM node).
				if (file.name.indexOf(".mp4") > -1) {
					// var videoURL = URL.createObjectURL(file);
					// alert(videoURL);
					file.getBlobURL(function (err, url) {
						// if (err) throw err;
						alert(err);
						alert(url);
						var a = document.createElement('a');
						a.download = file.name;
						a.href = url;
						a.textContent = 'Download ' + file.name;
						document.body.appendChild(a);
					});
					// var stream = file.createReadStream();
					console.log(file);
					file.appendTo('body');

					// stream.on('readable', function () {
					// alert("readable");
					// });
				} else {
					file.deselect();
				}
			});
		});
		torrent.on('wire', function (wire, addr) {
			console.log('connected to peer with address ' + addr);
		});
		console.log('Client is downloading:', torrent.infoHash);

	});


});