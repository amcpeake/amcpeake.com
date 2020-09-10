'use strict';

var fs = require('fs');
var path = require('path');
var express = require('express');
var http = require('http');
var https = require('https');
var pug = require('pug');
var fetch = require('node-fetch');
var multer = require('multer');
var FormData = require('form-data'); 
var jsdom = require('jsdom'); 
var { JSDOM } = jsdom;


var app = express();
var upload = multer();

app.use('/source', express.static(getAbs('source'))); // Serve static files from the /source directory
app.use(express.json());

app.set('view engine', 'pug');
app.set('views', getAbs('source/templates')); // Set the pug template folder

//=============================================================================
// Express Route Handlers

app.post('/pyde', (req, res) => { // Simply proxies requests from the website to PyDE
	let reqJSON = req.body;
	getConfig('pyde_url', (url) => {
		fetch(url, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify(reqJSON)
		}).then(resp => {
			res.status(resp.status);
			return resp.json();
		}).then(json => {
			res.end(JSON.stringify(json));
		});
	});
});

app.post('/webhooks', upload.single('content'), (req, res) => {
	let reqJSON = req.body;
	if (!('key' in reqJSON) || (!('body' in reqJSON) && !req.file)) {
		res.sendStatus(400).end();
		return;
	}

	getConfig("webhooks", (hooks) => {
		let headers = {'Content-Type': 'application/json'};
		let body = JSON.stringify(reqJSON['body']);
			
		if (req.file) { // formdata
			headers = {};
			body = new FormData();
			body.append('content', req.file.buffer, {filename: "meme.png"});
		}

		fetch(hooks[reqJSON['key']], {
			method: 'POST',
			headers: headers,
			body: body
		}).then(resp => {
			res.sendStatus(resp.status).end();
			return;
		});
	});
});

app.get(/^\/.*\/$/, (req, res) => { // Any directory (ends in /)
	let folder = getAbs('source');
	let fp = getAbs(req.url);
	
	if (fp.substr(0, folder.length) == folder) { // Make sure the folder is a subdirectory of ./source/
		fs.readdir(fp, {withFileTypes: true}, (err, files) => {
			if (err) {
				res.sendStatus(404).end();
				return;
			} else {
				res.render('dir', {
					url: req.url, 
					files: files.map(file => {
						if (file.isDirectory()) {
							return {name: file.name, type: "folder"};
						} else {
							return {name: file.name, type: "file"};
						}
					})
				});
			}
		});
	}
});

app.get('/*', (req, res) => { // Catch-all (Given https://example.com/<str>, returns <str>.html)
	if (req.url == '/favicon.ico') { // Special case for favicon
		res.sendFile(getAbs('source/files/favicon.ico'));
		return;
	}

	let folder = getAbs('source/html/');
	let fp = path.resolve(path.join(folder, `${req.url}.html`)); // Look for file at source/html/<str>.html
	if (req.url == '/') {
		fp = path.resolve(path.join(folder, 'home.html'));
	}
	
	if (fp.substr(0, folder.length) == folder) { // If files abs path is in the HTML folder
		fs.access(fp, err => { // Make sure the file exists
			if (err) {
				res.sendStatus(404).end();
				return;
			}
		});

		fs.readFile(path.join(__dirname, 'config/navbar.json'), 'utf8',
		(err, data) => { // If the file needs a navbar
			if (err) {
				res.sendFile(fp);
				return;
			}
			
			let pages = JSON.parse(data);
			if (req.url in pages) { // Load page as dom and add navbar render
				let navbar;
				
				if (isMobile(req)) {
					navbar = pug.renderFile(getAbs('source/templates/mobile-navbar.pug'),
						{pages: pages, url: req.url});
				} else {
					navbar = pug.renderFile(getAbs('source/templates/navbar.pug'), 
						{pages: pages, url: req.url});
				}
				JSDOM.fromFile(fp)
				.then((dom) => {				
					dom.window.document.body.innerHTML = navbar 
						+ dom.window.document.body.innerHTML;
					res.send(dom.serialize());
					return;
				})
				.catch((err) => {
					res.sendFile(fp);
				});
					
			} else {
				res.sendFile(fp);
				return;
			}
		});
	}
});

// ============================================================================
// Server Definition

var httpServer = http.createServer(app);
var httpsServer = https.createServer({
	key: fs.readFileSync(getAbs('certs/server.key', 'utf8')),
	cert: fs.readFileSync(getAbs('certs/server.crt', 'utf8'))
}, app);

httpServer.listen(80, () => {
	console.log("Running HTTP on port 80");
});
httpsServer.listen(443, () => {
	console.log("Running HTTPS on port 443");
});

//=============================================================================
// Function Declarations

function isMobile(req) { // Attempt to detect if a user is mobile based on user-agent
	let keywords = ["mobile", "android"];
	return new RegExp(keywords.join('|')).test(req.get('User-Agent').toLowerCase());
}

function getAbs(rel) { // Returns an absolute path from a relative one
	return path.resolve(path.join(__dirname, rel)); 
}

function getConfig(key, callback = console.log()) { // Return the value of key in JSON file
	fs.readFile(getAbs('config/ignore_config.json'), 'utf8',
		(err, data) => {
			if (err) {
				res.sendStatus(500).end();
				return;
			}
			
			let json = JSON.parse(data);
			
			if (!(key in json)) {
				res.sendStatus(400).end();
				return;
			}

			callback(json[key]);
	});
}
