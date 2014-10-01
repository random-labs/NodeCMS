var express = require('express');
var path = require('path');
var resourceController = require('./controllers/resourcesController');
var DashboardController = require('./controllers/dashboardcontroller');
var LogsController = require('./controllers/logscontroller');
var ioc = require('tiny-ioc');

exports.register = function(mainApp) {

	mainApp.use('/assets/admin', express.static(path.join(__dirname, 'assets/admin')));	
	
	// default admin route
	var dashboardcontroller = new DashboardController(mainApp);
	var logsController = ioc.resolve(LogsController);

	mainApp.get('/admin', function(req, res){ res.redirect('/admin/dashboard'); });
	mainApp.get('/admin/dashboard', dashboardcontroller.index);
	mainApp.get('/admin/api/dashboard/getcontentstats', dashboardcontroller.getcontentstats);
	mainApp.get('/admin/logs', logsController.index);
	mainApp.get('/admin/api/logs', logsController.apiGetLogs);

	// Client side resource provider
	mainApp.get('/js/globalresources.js', resourceController.getResources);
};

exports.config = {
	adminMenu: [ { key: 'DASHBOARD' , css: 'fa-dashboard', url: '/admin', order: 10},
				{ key: 'LOGS' , css: 'fa-bell', url: '/admin/logs', order: 90} ]
};