#include "context.js"
#include "theme.js"

// Class: Loki.Editor
// An in-browser HTML editor.
Loki.Editor = Loki.Class.create({
	// var: (Element) textarea
	textarea: null,
	
	// var: (Document) ownerDocument
	ownerDocument: null,
	
	// var: (Element) root
	root: null,
	
	// var: (Element) iframe
	iframe: null,
	
	// var: (Window) window
	window: null,
	
	// var: (Document) document
	document: null,
	
	// var: (String) baseURL
	// The URL of the Loki installation.
	baseURL: null,
	
	// Constructor: Editor
	// Creates a new instance of the Loki editor, replacing a textarea on the
	// document with itself. If the textarea belongs to a form, Loki will
	// automatically ensure that the document being edited is submitted when the
	// form is submitted.
	//
	// Parameters:
	//     (Element) textarea - the textarea to replace with the new Loki
	//                          instance
	//     (Object) [settings] - Loki editor settings
	initialize: function Editor(textarea, settings) {
		textarea = this._resolveTextarea(textarea);
		
		if (!settings)
			settings = {};
		
		this.contexts = this._loadContexts(settings.contexts || "default");
		
		this.textarea = textarea;
		this.ownerDocument = textarea.ownerDocument;
		
		this.baseURL = (settings.base_url || settings.base_uri
			|| settings.baseURL || this._determineBaseURL()); 
		
		this.theme = new Loki.Theme(settings.theme || "light");
		this.theme.applyToOwnerDocument(this);
		this.root = this._createRoot(settings.branding || false);
		       
		
	},
	
	// Method: switchContext
	// Switch to another editing context.
	//
	// Parameters:
	//     (String) name - the name of the context to switch to
	//
	// Returns:
	//     (Boolean) - true if a context switch actually occurred, false if the
	//                 requested context was already active
	//
	// Throws:
	//     NameError - if no context with that name is available
	switchContext: function switch_editor_context(name) {
		var new_context = this.contexts[name];
		if (typeof(new_context) == "undefined") {
			// Check to see if a context with that name is globally registered.
			try {
				Loki.Contexts.get(name);
			} catch (e) {
				// It isn't.
				throw Loki.error("NameError", "editor:unknown context", name);
			}
			
			// It is registered, but isn't on this instance.
			throw Loki.error("NameError", "editor:unavailable context", name);
		}
		
		if (new_context === this.activeContext)
			return false;
		
		this.previousContext = this.activeContext || null;
		if (this.previousContext)
			this.previousContext.exit(this.root);
		this.activeContext = new_context;
		this.activeContext.enter(this.root);
	},
	
	_createRoot: function _create_editor_root() {
		var doc = this.ownerDocument;
		var root = doc.createElement("div");
		root.className = "loki";
		
		this.textarea.parentNode.replaceChild(root, this.textarea);
		return root;
	},
	
	_resolveTextarea: function _resolve_editor_textarea(textarea) {
		if (!textarea) {
			throw Loki.error("ArgumentError", "editor:no textarea");
		} else if (typeof(textarea) == "string") {
			var matches = $sel(textarea, document);
			if (!matches || !matches.length) {
				throw Loki.error("ArgumentError",
					"editor:no matching textareas", textarea);
			} else if (matches.length > 1) {
				throw Loki.error("ArgumentError",
					"editor:multiple matching textareas", textarea);
			}
			textarea = matches[0];
		}
		
		if (!Loki.Object.isElement(textarea) || textarea.tagName != "TEXTAREA")
			throw Loki.error("ArgumentError", "editor:not a textarea");
		
		return textarea;
	},
	
	_determineBaseURL: function _determine_loki_base_uri() {
		var scripts = this.ownerDocument.getElementsByTagName('SCRIPT');
		var pattern = /\loki\.js(\?[^#]*)?(#\S+)?$/;
		var url;
		
		for (var i = 0; i < scripts.length; i++) {
			if (pattern.test(scripts[i].src)) {
				// Found Loki!
				url = scripts[i].src.replace(pattern, '');
				// If we're running out of a source directory, loki.js will be
				// in a build/ subdirectory.
				return url.replace(/build\/$/, '');
			}
		}
		
		throw Loki.error("ConfigurationError", "editor:no base uri");
	},
	
	_loadContexts: function _load_editor_contexts(selector) {
		return base2.map(Loki.contexts.get(selector), function(context_class) {
			return new context_class(this);
		}, this);
	}
});
