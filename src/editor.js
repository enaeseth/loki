#include "context.js"
#include "theme.js"

// Class: Loki.Editor
// An in-browser HTML editor.
//
// Mixins:
//  - <Loki.EventTarget>
Loki.Editor = Loki.Class.create({
	// var: (Element) textarea
	textarea: null,
	
	// var: (Document) ownerDocument
	ownerDocument: null,
	
	// var: (Element) root
	root: null,
	
	// var: (Element) contextRoot
	contextRoot: null,
	
	// var: (Element) iframe
	iframe: null,
	
	// var: (Window) window
	window: null,
	
	// var: (HTMLDocument) document
	document: null,
	
	// var: (HTMLBodyElement) body
	body: null,
	
	// var: (String) baseURL
	// The URL of the Loki installation.
	baseURL: null,
	
	// var: (Loki.UI.ErrorLog) errorLog
	// The editor's error log.
	errorLog: null,
	
	// var: ({String => Loki.Context}) contexts
	contexts: null,
	
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
		this.settings = settings;
		
		this.contexts = this._loadContexts(settings.contexts || "default");
		
		this.textarea = textarea;
		this.ownerDocument = textarea.ownerDocument;
		
		if (!Loki.baseURL) {
			Loki.baseURL = (settings.base_url || settings.base_uri
				|| settings.baseURL || settings.baseURI);
			if (!Loki.baseURL)
				throw Loki.error("ConfigurationError", "editor:no base uri");
		}
		this.baseURL = Loki.baseURL;
		
		this.errorLog = new Loki.UI.ErrorLog({
			minimumLevel: (settings.minimumLogLevel
				|| settings.minimum_log_level || "warning")
		});
			
		this.fireEvent('startup');
		
		this._createUI(settings);
		
		this.switchContext(settings.defaultContext || settings.default_context
			|| Loki.defaultContext);
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
				Loki.contexts.get(name);
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
			this.previousContext.exit(this.contextRoot);
		this.activeContext = new_context;
		this.activeContext.enter(this.contextRoot);
	},
	
	// Method: log
	// Logs a notice to the editor's error log (see <Loki.Editor.errorLog>).
	//
	// Parameters:
	//     (Loki.Notice) notice - the notice to log
	log: function editor_log(notice) {
		this.errorLog.log(notice);
	},
	
	// Method: selectionChanged
	// This method should be called whenever something occurs that changes the
	// user's selection in the visual context. This could be a change in the
	// selection boundaries, but also a change in the selection's style or
	// properties (e.g. the insertion of strong tags around the selection).
	selectionChanged: function editor_selection_changed() {
		
	},
	
	_createUI: function _create_editor_ui(settings) {
		this.theme = new Loki.Theme(settings.theme || "light");
		this.theme.applyToOwnerDocument(this);
		
		this.root = this._createRoot(settings.branding || false);
		this.contextRoot = this._createContextRoot(this.root);
		
		this.root.appendChild(this.errorLog.createBar(this.ownerDocument));
	},
	
	_createRoot: function _create_editor_root(branding) {
		var doc = this.ownerDocument;
		var root = doc.createElement("div");
		root.className = "loki";
		
		this.textarea.parentNode.replaceChild(root, this.textarea);
		return root;
	},
	
	_createContextRoot: function _create_editor_context_root(root) {
		var doc = root.ownerDocument;
		var cr = doc.createElement("div");
		cr.className = "root";
		
		root.appendChild(cr);
		return cr;
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
	
	_loadContexts: function _load_editor_contexts(selector) {
		var context_classes = Loki.contexts.get(selector);
		var contexts = {};
		
		Loki.Object.enumerate(context_classes, function(key, context_class) {
			contexts[key] = new context_class(this);
		}, this);
		
		return contexts;
	}
});
Loki.Class.mixin(Loki.Editor, Loki.EventTarget);
