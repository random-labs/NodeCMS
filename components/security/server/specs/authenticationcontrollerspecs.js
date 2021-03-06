var assert = require("assert");
var ResponseObject = require("./mockedresponseobject");
var AuthenticationController = require('../controllers/authenticationcontroller.js');
var fakelogger = { info: function(){} }

describe('Authentication controller specs:', function(){
	
	var responseObject = new ResponseObject();
	
	describe('When requesting the index,', function(){
		
		var responseObject = new ResponseObject();
		var controller = new AuthenticationController(fakelogger);

		controller.index(null, responseObject);

		it('It should render the index without a layout', function(){
			assert.equal(responseObject.view, 'components/security/server/views/login/index');
			assert.equal(responseObject.options.layout, false);
		});
	});

	describe('When a successfull login is done,', function(){

		var requestObject = { 
			session: { cookie: {} }
		};
		var responseObject = new ResponseObject();
		var controller = new AuthenticationController(fakelogger);

		controller.apiLogin(requestObject, responseObject);

		it('It should return a successfull result', function(){

			assert(responseObject.jsonData.success);
		});

		it('It should set the session object', function(){

			assert.notEqual(requestObject.session.cookie.maxAge, undefined);
		});
	});

	describe('When a successfull logout is done,', function(){

		var requestObject = { 
			session: { cookie: {} },
			logout: function(){
				this.isLoggedOut = true;
			}
		};
		var responseObject = new ResponseObject();
		
		var controller = new AuthenticationController(fakelogger);

		controller.apiLogout(requestObject, responseObject);

		it('It should return a successfull result', function(){

			assert(responseObject.jsonData.success);
		});

		it('It should logout the session', function(){

			assert.equal(requestObject.isLoggedOut, true);
		});
	});
});