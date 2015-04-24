var SJS_API = function() {
	this.cache = {};

	//this.fetch("item", "category", {}, function() {
		//console.log("[API] Preloaded");
	//});
};

SJS_API.prototype.fetch = function(source, type, args, response) {
	var instance = this;

	var hash = SJS.hash(type + "-" + source + "-" + JSON.stringify(args));
	if(this.cache[hash])
		return response(null, this.cache[hash])

	var data = {data: source};
	for(var a in args)
		data[a] = args[a];

	$.ajax({
		url: SJS.endpoint + type,
		type: "GET",
		data: data,
		dataType: "json"
	}).done(function(respdata) {
		if(respdata) instance.cache[hash] = respdata;
		response(null, respdata);
	}).fail(function(xhr, status) {
		response(status, null);
	});
};