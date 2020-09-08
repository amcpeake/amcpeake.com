var ipInfo;

(async () => {
	await fetch("https://json.geoiplookup.io")
	.then((resp) => resp.json())
	.then((json) => {
		setData(json);
		logIP(json);
	})
	.catch((err) => console.log(err));

})();

function setData(data) { ipInfo = data; }

function getDate() {
	var d = new Date(),
	months = ["January","February","March","April","May","June","July","August","September","October","November","December"],
	fullDate = '';
	fullDate = months[d.getMonth()] + ' ' + d.getDate() + ', ';
	if (d.getHours() > 12){
		fullDate += d.getHours() - 12 + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes() + ' PM';
	}
	else {
		fullDate += d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes() + ' AM';
	}
	return fullDate;
}

function sendHook(body, hook, callback = null, headers = {'Content-Type': 'application/json'}) {
	fetch('/webhooks', {
		method: 'POST',
		headers: headers,
		body: JSON.stringify({"body": body, "key": hook})
	}).then(resp => {
		if (callback) {
			callback(resp);
		}
	});
}

function logIP(json){
	let locs = `${json.city ? `${json.city}, ` : ''}${json.country_name} (${json.ip})`;
	sendHook({
		'embeds': [{
				'title': getDate() + ': Connection to ' + window.location.href,
				'description':	locs,
				'color': 13631488
		}]
	}, "log");
}
