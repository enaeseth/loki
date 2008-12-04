// Class: Loki.Theme
// A Loki editor visual theme.
Loki.Theme = Loki.Class.create({
	// Constructor: Theme
	// Creates a new theme object.
	//
	// Parameters:
	//     (String) id - the theme's ID
	initialize: function Theme(id) {
		this.id = id;
		this.parent = null;
		this.spec = null;
		this._ready = false;
	},
	
	// Method: isReady
	// Checks if the theme is "ready": if its spec is loaded and its ancestors
	// are ready.
	isReady: function is_theme_ready() {
		return this._ready;
	},
	
	// Method: load
	load: function load_theme(callback, context) {
		if (!context)
			context = null;
		if (this.isReady()) {
			callback.call(context, "success", this);
			return;
		}
		
		var url = $format("{0}themes/{1}/{1}.json", Loki.baseURL, this.id);
		var theme = this;
		Loki.request(url, {
			method: 'GET',
			onSuccess: function received_theme_spec(response) {
				var spec;
				try {
					spec = eval("(" + response.getText() + ")");
				} catch (e) {
					callback.call(context, "failure", theme,
						Loki._("theme:eval failed", theme.id, String(e)));
					return;
				}
				
				function report_success() {
					theme._ready = true;
					callback.call(context, "success", theme);
				}
				
				theme.spec = spec;
				if (spec.parent) {
					theme.parent = Loki.Theme.get(spec.parent);
					theme.parent.load(function parent_theme_done(status, p, m) {
						if (status == "success") {
							report_success();
							return;
						} else {
							callback.apply(context, arguments);
						}
					});
				} else {
					report_success();
				}
			},
			
			onFailure: function theme_spec_download_failed(response) {
				var status = response.getStatus();
				var error = status + " " + response.getStatusText();
				var message = (status == 404) ?
					Loki._("theme:not found", theme.id) :
					Loki._("theme:download failed", theme.id, error);
				
				callback.call(context, "failure", theme, message);
			}
		});
	},
	
	// Method: loadPluginContent
	loadPluginContent: function load_plugin_content(editor, callback, context) {
		var ed_plugins = Loki.Object.keys(editor.plugins);
		var Array2 = base2.JavaScript.Array2;
		var needed_plugins = [];
		
		if (!this.isReady()) {
			throw new Error("Theme " + this.id + " is not yet ready; cannot " +
				"load plugin content.");
		}
		
		if (!callback)
			callback = null;
		if (this.spec.processed_plugins) {
			base2.forEach(ed_plugins, function(plugin) {
				if (!Array2.contains(this.spec.processed_plugins, plugin))
					needed_plugins.push(plugin);
			}, this);
		} else {
			needed_plugins = ed_plugins;
		}
		
		if (needed_plugins.length == 0) {
			callback.call(context, 'success', this, needed_plugins);
			return;
		}
		
		var t, themes = [];
		for (t = this; t != null; t = t.parent) {
			themes.push(t.id);
		}
		
		var remaining_plugins = needed_plugins.slice(0);
		function load_done(plugin) {
			Array2.remove(remaining_plugins, plugin);
			
			if (remaining_plugins.length == 0)
				callback.call(context, 'success', this, needed_plugins);
		}
		
		base2.forEach(needed_plugins, function(plugin) {
			var loader = new Loki.Theme.PluginLoader(editor, plugin, themes);
			loader.loadTheme(load_done);
		});
	},
	
	// Method: applyToOwnerDocument
	// Applies a theme to the editor's owner document.
	applyToOwnerDocument: function apply_theme_to_owner_doc(editor) {
		this._addStyleSheet(editor.ownerDocument, './owner.css');
	},
	
	applyToDocument: function apply_theme_to_doc(editor) {
		this._addStyleSheet(editor.document, './document.css');
	},
	
	_addStyleSheet: function _theme_add_css(document, file) {
		if (/^\.\//.test(file))
			file = $format("themes/{0}/{1}", this.id, file.substr(2));
		return document.addStyleSheet(Loki.baseURL + file);
	}
});

Loki.Theme.PluginLoader = Loki.Class.create({
	initialize: function PluginThemeLoader(editor, plugin, themes) {
		// The queue starts with the requested theme and goes up its ancestry.
		this.editor = editor;
		this.queue = themes.slice(0); // clone
		this.plugin = plugin;
		this.base = $format("{0}plugins/{1}/themes", Loki.baseURL, plugin);
	},
	
	loadTheme: function load_plugin_theme(callback, context) {
		if (!context)
			context = null;
		
		if (this.queue.length == 0) {
			// Nothing more for us to do.
			callback.call(context, this.plugin);
			return;
		}
		
		var theme = this.queue.shift();
		var loader = this;
		
		// Here, we try to fetch the stylesheet using an XMLHttpRequest before
		// adding it to the document. Why? If a plugin provides styles for a
		// particular theme, it will import its parent's stylesheet, and we
		// shouldn't include that parent stylesheet directly. But if not, we
		// still potentially need to include styles for that plugin from one of
		// the current theme's ancestors. The only way to check for the presence
		// of a stylesheet is with an XMLHttpRequest. (Fortunately, it should be
		// cached after the request, so the actual inclusion should be fast.)
		
		// For simplicity, we stipulate that if a plugin provides theme styles,
		// it MUST provide both document.css and owner.css, even if one of
		// those files merely @imports its parent.
		Loki.request($format("{0}/{1}/document.css", this.base, theme), {
			method: 'GET',
			
			onSuccess: function got_plugin_theme(response) {
				// Sweet! Include it.
				var doc = $format("{0}/{1}/document.css", loader.base, theme);
				var owner = $format("{0}/{1}/document.css", loader.base, theme);
				
				loader.editor.ownerDocument.addStyleSheet(owner);
				loader.editor.document.addStyleSheet(doc);
				callback.call(context, loader.plugin);
			},
			
			onFailure: function plugin_theme_download_failed(response) {
				// We don't really care why... the best response is to always
				// move down the queue.
				loader.loadTheme(callback, context);
			}
		});
	}
});

// Function: get
// Gets the Theme object for the given theme ID, creating it if necessary.
//
// Parameters:
//     (String) id - the theme's ID
//
// Returns:
//     (Loki.Theme) - the Theme object for that ID
Loki.Theme.get = function loki_get_theme(id) {
	if (!Loki.Theme.cache[id]) {
		Loki.Theme.cache[id] = new Loki.Theme(id);
	}
	
	return Loki.Theme.cache[id];
}

Loki.Theme.cache = {};
