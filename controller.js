//Location of your application on the server or your local

var SJS = function(interfaces) {
	var instance = this;
	this.api = new SJS_API(this);
	this.ui = new SJS_UI(this);
	this.lastURL = null;
	this.lastURLhash = null;

	this.setURL(this.initURL());
	window.onstatechange = function() {
		if(instance.lastURL == null || window.location.pathname == instance.lastURL) {
			instance.ui.renderTemplate('home');
		} else {
			instance.setURL(instance.initURL());
		}
	};

	window.onanchorchange = function() {
		instance.initURL();
	};
};

SJS.docRoot = "";
SJS.endpoint = "http://api.example.com";

SJS.hash = function(str) {
	var hval = 0x811c9dc5;

	for (var i = 0, l = str.length; i < l; i++) {
		hval ^= str.charCodeAt(i);
		hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
	}
	
	return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
};

SJS.prototype.initURL = function() {
	var len = SJS.docRoot.length > 0 ? SJS.docRoot.length : 1;
	var path = window.location.pathname.substr(len).split("/");
	if (path[0]) {
		this.ui.renderTemplate(path[0], path[1], null, document.location.hash.substr(1), null, true);
	} else {
		this.ui.renderTemplate('home');
	};
	return window.location.pathname;
};

SJS.prototype.setURL = function(url) {
	History.pushState(null, null, url);
	this.lastURL = window.location.pathname;
	this.lastURLhash = window.location.hash;
};