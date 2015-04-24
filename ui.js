var SJS_UI = function(sjs) {
	this.sjs = sjs;

	this.$page = $('#page-view'); // Page View
	this.$loading = $('#loading'); // Loading State
	this.$error = $('#error'); //404

	this.templates = {};
	this.currentPage = null;

	this.$page.fadeOut(1);

	this.bind();
};

SJS_UI.prototype.bind = function() {
	
	var instance = this;

	$('.btn-render-template').each(function(){
		var $this = $(this);
		var target = $this.data('target') || "";
		var page = $this.data('page') || "";
		var data = $this.data('fetch') || "";

		$this.unbind().on('click', function(e){
			e.preventDefault();
			instance.renderTemplate(page, data, null, target);
		});
	});
};

SJS_UI.prototype.showError = function(message) {
	this.$error.text(message);
	this.$error.fadeIn();
};

SJS_UI.prototype.showLoading = function(cb, bypass) {
	if(bypass) return cb();
	this.$page.fadeOut(300);
	this.$loading.fadeIn(300, cb);
};

SJS_UI.prototype.hideLoading = function(cb, bypass) {
	if(bypass) return cb();
	this.$page.fadeIn(300);
	this.$loading.fadeOut(300, cb);
};

SJS_UI.prototype.renderTemplate = function(template, data, callback, anchor, stopLoading, noSet) {
	var instance = this;
	var hash = SJS.hash(template + JSON.stringify(data));
	var samePage = this.currentPage == hash;

	var new_url = SJS.docRoot + template;
	if(data)
		new_url += "/" + data;

	if(anchor)
		new_url += "#" + anchor;

	if(!noSet)
		this.sjs.setURL(new_url);

	callback = callback || function() { };
	data = data ? data.split(';') : [];
	
	var args = {};
	args.sjs = this.sjs;

	this.showLoading(function() {
		var queue = async.queue(function(task, cb) {
			task = task.split("!");
			var table = task[0].split("_", 2);
			var apisearch = {};

			if(task.length > 1) {
				var search_pairs = task[1].split(",");
				_.each(search_pairs, function(pair) {
					pair = pair.split(":");
					apisearch[pair[0]] = pair[1];
				});
			}

			instance.sjs.api.fetch(table[0], table[1], apisearch, function(err, data) {
				if(err) return cb(err);
				args["data"] = data;
				args["table"] = table.join("_");
				args["data_" + table.join("_")] = data;
				cb();
			});
		}, 4);

		queue.drain = function() {
			instance.getTemplate(template, function(error, tpl) {
				if(error || typeof tpl != 'function') {
					instance.showError(error);
					instance.hideLoading(function() {
						callback(error || "Unable to load template", null)
					});
					return;
				}

				var postDom = [];
				args["DOM"] = function(f) {
					if(typeof f === 'function')
						postDom.push(f);
				};

				instance.$page.html(tpl(args));
				for(var x = 0; x < postDom.length; x++)
					postDom[x](instance.sjs);

				instance.bind();

				instance.currentPage = hash;
				instance.hideLoading(function() {
					instance.scrollTo(anchor ? $("#" + anchor) : null);
					callback(null, true);
				}, samePage || stopLoading);
			});
		};

		for(var d in data)
			queue.push(data[d]);

		if(data.length <= 0) 
			queue.drain();
	}, samePage || stopLoading);
};

SJS_UI.prototype.getTemplate = function(template, callback) {
	var instance = this;
	var hash = SJS.hash(template);

	callback = callback || function() { };

	if(this.templates[hash])
		return callback(null, this.templates[hash]);

	console.log("[UI] Loading " + template + " template into cache.");
	$.ajax({
		url: SJS.docRoot + "/templates/" + template + ".html?r=" + Math.random(),
		type: "GET",
		dataType: "html"
	}).done(function(tpl) {
		instance.templates[hash] = _.template(tpl);
		callback(null, instance.templates[hash]);
	}).fail(function(xhr, status) {
		callback(status, null);
	});
}