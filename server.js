var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressLayouts = require('express-ejs-layouts');
var I18n = require('i18n-2');
var fs = require('fs');
var session = require('express-session')

global.__PROJECTDIR = __dirname + '/';

var app = express();

app.set('views', path.join(__dirname, 'apps'));
app.set('view engine', 'ejs');
app.use(expressLayouts);

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(session({secret: 'NODECMS', saveUninitialized: true, resave: true}))
I18n.expressBind(app, { locales: ['en', 'nl'] });
app.use(function(req, res, next) {
    req.i18n.setLocale('en');
    next();
});

var appDirectories = fs.readdirSync('./apps');
appDirectories.forEach(function(dir){
	
	var subApp = './apps/' + dir + '/app.js';
	console.log(subApp);
	if(fs.existsSync(subApp)) {
  		
  		console.log('registering the ' + dir + ' app');
		require(subApp)(app);
	}
});

//app.use(require('less-middleware')(path.join(__dirname, 'public')));

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
// if (app.get('env') === 'development') {
//     app.use(function(err, req, res, next) {
//         res.status(err.status || 500);
//         res.render('error', {
//             message: err.message,
//             error: err
//         });
//     });
// }

// production error handler
// no stacktraces leaked to user
// 

//#!/usr/bin/env node
//var debug = require('debug')('NodeCMS');
//var app = require('../../server.js');

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + server.address().port);
});

//module.exports = app;