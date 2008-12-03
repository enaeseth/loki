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
		new Loki.Request(url, {
			method: 'GET',
			onSuccess: function received_theme_spec(response) {
				var spec;
				try {
					spec = response.evaluate();
				} catch (e) {
					callback.call(context, "failure", theme,
						Loki._("theme:eval failed", theme.id, e));
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
			file = $format("themes/{0}/{1}", this.id, file);
		return document.addStyleSheet(Loki.baseURL + file);
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