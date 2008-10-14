// Class: Loki.Theme
// A Loki editor visual theme.
Loki.Theme = Loki.Class.create({
	// Constructor: Theme
	// Creates a new theme object.
	//
	// Parameters:
	//     (String) name - the theme's name
	initialize: function Theme(name) {
		this.name = name;
	},
	
	// Method: applyToOwnerDocument
	// Applies a theme to the editor's owner document.
	applyToOwnerDocument: function apply_theme_to_owner_doc(editor) {
		this._addStyleSheet(editor.ownerDocument,
			$format("{0}themes/{1}/owner.css", editor.baseURL, this.name));
	},
	
	applyToDocument: function apply_theme_to_doc(editor) {
		this._addStyleSheet(editor.document,
			$format("{0}themes/{1}/document.css", editor.baseURL, this.name));
	},
	
	_addStyleSheet: function add_style_sheet(document, url) {
		base2.DOM.bind(document);
		var selector = "link[rel=stylesheet][href=" + url + "]";
		try {
			if (document.querySelector(selector)) {
				// already exists
				return false;
			}
		} catch (e) {
			// ignore
		}
		
		var link = document.createElement("LINK");
		link.rel = "stylesheet";
		link.type = "text/css";
		link.href = url;
		var head = document.querySelector("head");
		if (!head) {
			this._fixDocument(document);
			head = document.querySelector("head");
		}
		head.appendChild(link);
		
		return true;
	},
	
	_fixDocument: function fix_document_structure(document) {
		var root = document.documentElement ||
			document.getElementsByTagName("HTML")[0];
		var body = document.getElementsByTagName("BODY");
		if (!body.length) {
			body = document.createElement("BODY");
			root.appendChild(body);
		}
		
		var head = document.createElement("HEAD");
		root.insertBefore(head, body);
	}
});
