var ipInfo;
$.getJSON('https://json.geoiplookup.io', function(data) {
	setData(data);
	logIP(data);
});

function setData(data) { ipInfo = data; }

function getDate() {
	var d = new Date(),
	months = ["January","February","March","April","May","June","July","August","September","October","November","December"],
	fullDate = '';
	fullDate = months[d.getMonth()] + ' ' + d.getDate() + ', ';
	if (d.getHours() > 12){
		fullDate += d.getHours() - 12 + ':' + d.getMinutes() + ' PM';
	}
	else {
		fullDate += d.getHours() + ':' + d.getMinutes() + ' AM';
	}
	return fullDate;
}

function sendHook(body, hook, callback = null, headers = {'Content-Type': 'application/json'}) {
	fetch(`/source/php/getWebhook.php?key=${hook}`, {
		method: 'GET'
	}).then(resp => {
		return resp.text();
	}).then(text => {
		console.log(text);
		fetch(text, {
			method: 'POST',
			headers: headers,
			body: body
		}).then(resp => {
			if (callback) {
				callback(resp);
			}
		});
	});
}

function logIP(json){
	sendHook(JSON.stringify({
		'embeds': [
			{
				'title': getDate() + ': Connection to ' + window.location.href,
				'description':	json.city + ', ' + json.country_name + ' (' + json.ip + ')',
				'color': 13631488
			}
		]
	}), "log");
}

function reloaded(str){
	if (str){
		var str = str.replace(/ /g, '');
		if (str.charAt(0) != "@"){
			var str = "@" + str;
		}
		if (!webHook) {
			sendHook(JSON.stringify({'content': str}), "concat", 
				(response) => {
					if (response.ok) {
						alert("piped");
					} else if (response.status == "429") {
						alert("Please stop spamming");
					}
				}
			);
		}
	}
}

function comment(str, name){
	if (str.match(/[a-z]/i)){
		var name = '';
		while (!name.match(/[a-z]/i)){
			name = prompt("Please enter your name");
		}
		if (name.match(/[a-z]/i)){
				sendHook(JSON.stringify({'embeds': [
					{
						'title': name + ' from ' + ipInfo.country_name + ' says:',
						'description': '***' + str + '***',
						'color': '1127128',
					}
					]
				}), "comments", (response) => {
					if(response.ok) {
						alert("Thank you for your feedback, " + name);
					}
				});

				return true;
			}
			else {
				alert("Invalid input");
			}
	}
	else {
		alert("Enter text to send a comment");
	}
}

function memeToDiscord(base64){
	var formData = new FormData(),
	file = dataURLtoFile(base64, 'meme.png');
	formData.append('content', file);
	sendHook(formData, "memes",
		(response) => {
			if (response.ok){
				alert("Meme posted");
			}
		},
		{});
}

function dataURLtoFile(dataurl, filename) {
	    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
		        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
	    while(n--){
		            u8arr[n] = bstr.charCodeAt(n);
		        }
	    return new File([u8arr], filename, {type:mime});
}
