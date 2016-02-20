'use strict';

/*
 * modules
 * */

var http = require('http');
var https = require('https');
var fs = require('fs');
var url = require('url');
var path = require('path');
var querystring = require('querystring');
var assert = require('assert');

var mongodb = require('mongodb');
var requestIp = require('request-ip');

//TODO: test:start
var mongoose = require('mongoose');
var nodeUUID = require('node-uuid');
var ipLocation = require('ip-location');//TODO: implement

/*
 * variables
 * */

var server = http.createServer();
var port = process.env.PORT || 8001;

var MongoClient = mongodb.MongoClient;
var dbname = 'sv';
var dburl = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/' + dbname;

var mimeTypes = {
	"txt":  "text/plain",
	"html": "text/html",
	"css":  "text/css",
	"jpeg": "image/jpeg",
	"jpg":  "image/jpeg",
	"png":  "image/png",
	"js":   "application/javascript",
	"json": "application/json",
	"xml":  "application/xml",
	"svg":  "image/svg+xml",
	"mp4": "video/mp4",
	"m4v": "video/mp4",
	"webm": "video/webm"
};

//TODO: confirm.start
var dirSpacesBeforeDate = 51;
var dirSpacesBeforeSize = 9;
var dirMonths = 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'.split(',');
//TODO: confirm.end

var parsedURL;
var parsedQueryString;

/*
 * execution
 * */

require("console-stamp")(console, {
	pattern : "HH:MM:ss",
	//label: false,
	colors: {
		stamp: ["gray"],
		label: ["gray"]
	}
});

//set handler
server.on('request', requestHandler);

//listen to server
server.listen(port, callbackAfterServerListening);

/*
* functions
* */

function callbackAfterServerListening() {

	var serverAddress = server.address();
	var ipAddress = serverAddress.address;
	var host = ipAddress ===  '::' ? 'localhost' : ipAddress;
	var port = serverAddress.port;

	console.log("Server is running at http://%s:%s", host, port);
}


/*
 * functions - database
 * */

function dbHandler(req, res, path, store, location) {

	var json = JSON.parse(store);

	var parsedCookieObj = cookieParse(req.headers.cookie);
	var isNoCookie = parsedCookieObj._sv === undefined || parsedCookieObj._sv === 'undefined';
	var uuid;

	if(isNoCookie) {
		//var ObjectID = mongodb.ObjectID;
		//uuid = new ObjectID();
		//uuid = nodeUUID.v4(null, new Buffer(16));
		//uuid = mongodb.Binary(uuid, mongodb.Binary.SUBTYPE_UUID);
		uuid = nodeUUID.v4();
		res.setHeader('Set-Cookie', setCookie('_sv', uuid));
	} else {
		uuid = parsedCookieObj._sv;
	}

	return function(err, db) {

		assert.equal(null, err, 'Unable to connect to the MongoDB server.');
		console.log("Connected correctly to MongoDB");

		json.uuid = uuid;

		if(location) {
			json.location = location;
		}

		var log = db.collection('log');
		var user = db.collection('user');

		log.insert(json, {}, function(err, records) {

			assert.equal(null, err, 'Unable to insert to the MongoDB server.');
			console.log('Inserted data completely to Database');

			user.update({uuid: uuid}, {$inc: {count: 1}}, {upsert: true}, function(err, records) {

				assert.equal(null, err, 'Unable to insert to the MongoDB server.');
				console.log('Updated data completely to Database');

				var log = location ? {location: location, date: json.date} : {location: {}, date: json.date};
				user.update({uuid: uuid}, {$push: {log: log}}, {upsert: true}, function(err, records) {

					assert.equal(null, err, 'Unable to insert to the MongoDB server.');
					console.log('Updated data completely to Database');
					db.close();
				});
			});
		});

		//TODO: remove below
		//fs.writeFile("./log.json", JSON.stringify(json, null, '\t'));
	}
}

/*
 * functions - web server
 * */


function cookieParse(cookie) {
	var parsedCookieObj = {};
	if(cookie !== undefined) {
		var cookieArray = cookie.split(';');
		for(var i = 0, len = cookieArray.length; i < len; i++) {
			var trimmedCookie = cookieArray[i].trim();
			var splitCookie = trimmedCookie.split('=');
			var cookieKey = splitCookie[0];
			var cookieValue = splitCookie[1];
			parsedCookieObj[cookieKey] = cookieValue;
		}
	}
	return parsedCookieObj;
}
function setCookie(key, value) {
	return key + '=' + value + '; path=/; expires=Tue, 1-Jan-2030 00:00:00 GMT;'
}

function requestHandler(req, res){

	parsedURL = url.parse(req.url);
	var path = parsedURL.pathname;
	var requestMethod = req.method;

	switch(requestMethod) {
		case 'POST':
			serveData(req, res, path);
			break;
		case 'GET':
			serveFiles(req, res, path);
			break;
		default:
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.end(requestMethod + ' request');
			break;
	}
}

function serveData(req, res, path) {

	var store = '';

	req.on('data', function(chunk) {

		store += chunk;

	});

	req.on('end', function() {

		res.setHeader("Content-Type", "application/json");
		res.setHeader("Access-Control-Allow-Origin", "*");

		switch(path) {

			case '/saveJSON':
				saveJSON(store);
				break;

			case '/send2db':

				var hostname = getClientIP(req, res, path);
				if(hostname && hostname !== 'localhost') {
					ipLocation(hostname).then(function (location) {
						MongoClient.connect(dburl, dbHandler(req, res, path, store, location));
					});
				} else {
					MongoClient.connect(dburl, dbHandler(req, res, path, store));
				}
				break;

			default:
				break;
		}

		res.end(store);
	});
}

function serveFiles(req, res, path) {

	var extension = path.split('.').pop();

	//override
	path = ('./' + path).replace('//', '/');

	if(path === './getMyIP.js') {
		return sendClientIP(req, res, path);
	}

	//Deny if hostname is style-validator.herokuapp.com
	//Because, this app has already hosted with style-validator.github.io
	if(req.headers.host === 'style-validator.herokuapp.com') {
		return sendNotFound(req, res, path);
	}

	//video
	if(/^mp4|m4v|webm/.test(extension)) {
		return sendVideo(req, res, path, extension);
	}

	fs.stat(path, function(err, stats){

		if(err){

			return sendNotFound(req, res, path);

		} else {

			//Directory
			if(stats.isDirectory()) {

				//if last char is not '/', then redirect with '/'
				if(path.charAt(path.length-1) !== '/') {
					return sendRedirect(req, res, path + '/');
				}

				fs.stat(path + 'index.html', function(err2, stats2) {
					if(err2) {
						return sendDirectory(req, res, path);
					}
					return sendFile(req, res, path + '/index.html');
				});

			//Not directory
			} else {

				return sendFile(req, res, path);

			}

		}
	});
}

function sendVideo(req, res, path, extension) {

	fs.readFile(path, function (err, data) {

		if (err) {
			throw err;
		}

		var total = data.length;

		var range = req.headers.range;

		var positions = range.replace(/bytes=/, "").split("-");
		var start = parseInt(positions[0], 10);
		// if last byte position is not present then it is the last byte of the video file.
		var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
		var chunksize = (end-start)+1;

		res.writeHead(206, {
				"Content-Range": "bytes " + start + "-" + end + "/" + total,
				"Accept-Ranges": "bytes",
				"Content-Length": chunksize,
				"Content-Type": mimeTypes[extension]
			}
		);

		res.end(data.slice(start, end+1), "binary");

	});
}

function getClientIP(req, res, path) {
	var clientIP = requestIp.getClientIp(req);
	return clientIP === '::1' ? 'localhost' : clientIP;
}

function sendClientIP(req, res, path) {

	parsedQueryString = querystring.parse(parsedURL.query);
	var variable = parsedQueryString['var'];
	var clientIp = requestIp.getClientIp(req);

	res.setHeader("Content-Type", "text/plain");
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.writeHead(200, {'Content-Type': mimeTypes['js']});
	res.end('var ' + variable + ' = \'' + clientIp + '\';');

	console.log('Client IP has been sent successfully');
}

function escapeHtml(value) {
	return value.toString().
		replace('<', '&lt;').
		replace('>', '&gt;').
		replace('"', '&quot;');
}

function zeroFill(value) {
	return ((value < 10) ? '0' : '') + value;
}

function convertSize(value) {
	if(value > 1000000000) return ((value*0.000000001) | 0) + 'G';
	if(value > 1000000) return ((value*0.000001) | 0) + 'M';
	if(value > 10000) return ((value*0.001) | 0) + 'K';
	return '' + value;
}

function sendFile(req, res, path) {
	var extension = path.split('.').pop();
	var contentType = mimeTypes[extension] || 'text/plain';

	res.writeHead(200, {'Content-Type': contentType});
	var fileStream = fs.createReadStream(path);
	fileStream.pipe(res);
}

function sendRedirect(req, res, path) {
	res.writeHead(301, {
		'Content-Type': 'text/html',
		'Location': path
	});
	res.end();
}

function sendServerError(req, res, error) {
	console.log('500 Internal Server Error: ' + error);

	res.writeHead(500, {'Content-Type': 'text/html'});
	res.writeo('<!DOCTYPE html>\n');
	res.write('<html><head>\n');
	res.write('<title>500 Internal Server Error</title>\n');
	res.write('</head><body>\n');
	res.write('<h1>500 Internal Server Error</h1>\n');
	res.write('<pre>' + escapeHtml(error) + '</pre>\n');
	res.write('</body></html>\n');
	res.end();
}

function sendForbidden(req, res, path) {
	console.log('403 Forbidden: ' + path);

	res.writeHead(403, {'Content-Type': 'text/html'});
	res.write('<!DOCTYPE html>\n');
	res.write('<html><head>\n');
	res.write('<title>403 Forbidden</title>\n');
	res.write('</head><body>\n');
	res.write('<h1>403 Forbidden</h1>\n');
	res.write('<p>You don\'t have permission to access' + escapeHtml(path) + ' on this server.</p>\n');
	res.write('</body></html>\n');
	res.end();
}

function sendNotFound(req, res, path) {
	console.log('404 Not Found: ' + path);

	res.writeHead(404, {'Content-Type': 'text/html'});
	res.write('<!DOCTYPE html>\n');
	res.write('<html><head>\n');
	res.write('<title>404 Not Found</title>\n');
	res.write('</head><body>\n');
	res.write('<h1>404 Not Found</h1>\n');
	res.write('<p>The requested URL ' + escapeHtml(path) + ' was not found on this server.\n');
	res.write('</body></html>\n');
	res.end();
}

function sendDirectory(req, res, path) {
	fs.readdir(path, function(err, files) {
		if(err) return sendServerError(req, res, err);

		if(files.length === 0)
			return sendDirectoryIndex(req, res, path, []);

		var remaining = files.length;
		files.forEach(function(filename, idx) {
			fs.stat(path + '/' + filename, function(err, stats) {
				if(err) return sendServerError(req, res, err);

				files[idx] = {
					name: files[idx],
					date: stats.mtime,
					size: '-'
				};

				if(stats.isDirectory()) files[idx].name += '/';
				else files[idx].size = stats.size;

				if(--remaining === 0)
					return sendDirectoryIndex(req, res, path, files);

			});
		});
	});
}

function sendDirectoryIndex(req, res, path, files) {
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.write('<!DOCTYPE html>\n');
	res.write('<html><head>\n');
	res.write('<title>Index of ' + escapeHtml(path) + '</title>\n');
	res.write('</head><body>\n');
	res.write('<h1>Index of ' + escapeHtml(path) + '</h1>\n');
	res.write('<hr><pre>\n');

	res.write('<a href="../">../</a>\n');


	files.forEach(function(file, idx) {
		var name = escapeHtml(file.name),
			displayName = name.substr(0, dirSpacesBeforeDate-1),
			spBeforeDate = dirSpacesBeforeDate - displayName.length;

		res.write('<a href="' + name + '">' + displayName + '</a>');
		while(--spBeforeDate) res.write(' ');

		var day = zeroFill(file.date.getDate()),
			month = dirMonths[file.date.getMonth()],
			hours = zeroFill(file.date.getHours()),
			min = zeroFill(file.date.getMinutes());

		var date = day + '-' + month + '-' + file.date.getFullYear() +
			' ' + hours + ':' + min;
		res.write(date);

		var size = convertSize(file.size),
			spBeforeSize = dirSpacesBeforeSize - size.length;

		while(spBeforeSize--) res.write(' ');
		res.write(size + '\n');
	});

	res.write('</pre><hr></body></html>\n');
	res.end();
}

/*
 * functions - file
 * */

function saveJSON(store) {

	fs.writeFile("./extension/data/rules.json", store, function(err) {

		assert.equal(null, err, 'Failed! JSON file has not written...');
		console.log('JSON file written successfully!');
	});
}
