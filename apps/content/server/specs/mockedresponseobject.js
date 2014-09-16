module.exports = function(){
	
	var self = this;
	this.render = function(view, options){
		this.view = view;
		this.options = options;
	};

	this.json = function(data){
		this.jsonData = data;
		return this;
	};

	this.status = function(status){
		this.currentStatus = status;
		return this;
	}

	this.send = function(){
		this.isSend = true;
	}
	this.end = function(){
		this.ended = true;
	}
};