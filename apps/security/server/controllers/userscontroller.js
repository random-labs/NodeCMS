var userFactory = require('../lib/userfactory');

// This is the users controller responsible for all http user actions like
// returning views and doing api calls
module.exports = function(userRepository){

	// VIEWS
	this.index = function(req, res){
		res.render('apps/security/server/views/users/index', {
			layout: 'system/views/shared/layout'
		});
	};

	// API
	this.ApiUsers = function(req, res){

		userRepository.find({}, function(results){
			res.json(results);
		});
	}

	this.ApiGetUser = function(req, res){

		userRepository.findOne( req.params.id, function(result){
			res.json(result);
		});
	}

	this.ApiAddUser = function(req, res){

		userRepository.find( { UserName: req.body.UserName }, function(result){

			if(result.length === 0){

				var user = userFactory.create(req.body.userName, 
									req.body.password, 
									req.body.fullname,
									req.body.active);


				userRepository.add(user, function(){
					res.status(200).send();
				}) ;
			}
			else{
				res.status(400)
					.json( {
						'RuleViolationExceptions': ['The username is already in use']
					})
					.send();
			}
		});
	}

	this.ApiUpdateUser = function(req, res){

		userRepository.update(
			{ _id: req.params.id },
			{ $set: {
				Password: userFactory.hashPassword(req.body.password),
				FullName: req.body.FullName,
				Active: req.body.Active
				}
			},
			function(){
				res.status(200).send();
			});
	}

	this.ApiDeleteUser = function(req, res){

		userRepository.findOne(req.params.id, function(result){

			if(result && result.UserName.toLowerCase() === req.user.username.toLowerCase()){
				res.status(400)
					.json( {
						'RuleViolationExceptions': ['Cannot delete the currently loggin in user']
					})
					.send();
			}
			else{
				userRepository.remove({ _id: req.params.id }, { multi: false }, function(){
					res.status(200).send();
				})
			}
		});
	}
};
