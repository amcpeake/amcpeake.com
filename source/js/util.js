function setCookie(name, value, expires = "") {
		document.cookie = `${name}=${encodeURIComponent(value)}; ${expires}`;
}

function getCookie(name) {
		  var value = "; " + document.cookie;
		  var parts = value.split("; " + name + "=");
		  if (parts.length == 2) return decodeURIComponent(parts.pop().split(";").shift());
}

function removeCookie(name) {
		document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
}
