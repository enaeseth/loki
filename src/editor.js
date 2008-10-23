#include "context.js"
#include "theme.js"

// Class: Loki.Editor
// An in-browser HTML editor.
//
// Mixins:
//  - <Loki.EventTarget>
//
// Events:
//     startup - fired before the Loki UI is created
//     context_add - fired when a new context is added
//     context_switch - fired when the active context is switched
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
	
	// var: (Loki.Selection) selection
	selection: null,
	
	// var: (String) baseURL
	// The URL of the Loki installation.
	baseURL: null,
	
	// var: (Loki.UI.ErrorLog) errorLog
	// The editor's error log.
	errorLog: null,
	
	// var: ({String => Loki.Context}) contexts
	contexts: null,
	
	// var: ({String => Loki.Plugin}) plugins
	plugins: null,
	
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
		
		this.contexts = this._loadContexts();
		
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
		
		this.generator = new Loki.HTMLGenerator({
			xhtml: ('xhtml' in settings) ? settings.xhtml : true,
			indentText: "    "
		});
		this._savedHTML = null;
			
		this.fireEvent('startup');
		
		this._createUI(settings);
		
		this.defaultContext = settings.defaultContext
			|| settings.default_context || Loki.defaultContext;
		
		this.addEventListener("context_add", function context_added(name, ctx) {
			if (!this.plugins)
				return;
			
			Loki.Object.enumerate(this.plugins, function(id, plugin) {
				if (plugin.usesContext(name)) {
					this._pluginUsesContext(plugin, ctx);
				}
			}, this);
		}, this);
		
		// Switch to the loading context, which will call our _loadPlugins
		// method.
		this.switchContext("loading");
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
			// It is registered, but isn't on this instance.
			throw Loki.error("NameError", "editor:unavailable context", name);
		}
		
		if (new_context === this.activeContext)
			return false;
		
		this.previousContext = this.activeContext || null;
		if (this.previousContext)
			this.previousContext.exit(this.contextRoot);
		var html = this.getHTML();
		
		this.activeContext = new_context;
		this.setHTML(html);
		this.activeContext.enter(this.contextRoot);
		this.fireEvent("context_switch", name, new_context);
	},
	
	// Method: addContext
	// Adds a context to the editor instance.
	//
	// Parameters:
	//     (String) name - the name of the context being added
	//     (Function) context_class - a constructor function for the context
	//
	// Returns:
	//     (void)
	//
	// Throws:
	//     ConflictError - if a context is already registered with that name
	addContext: function add_editor_context(name, context_class) {
		if (name in this.contexts) {
			throw Loki.error("ConflictError", "editor:context already added",
				name);
		}
		
		var context = new context_class(this);
		this.contexts[name] = context;
		this.fireEvent("context_add", name, context);
	},
	
	// Method: getHTML
	getHTML: function editor_get_html() {
		var c = this.activeContext;
		if (c) {
			if (c.getDocumentRoot) {
				return this.generator.generate(c.getDocumentRoot().childNodes);
			} else if (c.getHTML) {
				return c.getHTML();
			}
		}
		return this._savedHTML || "";
	},
	
	// Method: setHTML
	setHTML: function editor_set_html(html) {
		if (this.activeContext.setHTML) {
			this.activeContext.setHTML(html);
			this._savedHTML = null;
		} else {
			this._savedHTML = html;
		}
	},
	
	// Method: log
	// Logs a notice to the editor's error log (see <Loki.Editor.errorLog>).
	// Besides using this message normally, it is also possible to pass a
	// pre-formed <Loki.Notice> object as the sole argument.
	//
	// Parameters:
	//     (String) level - the notice's severity level; possible levels are
	//                      given in the <Loki.Notice> class description
	//     (String) message - the message associated with the notice
	//
	// Throws:
	//     ArgumentError - if the _level_ parameter does not specify a valid
	//                     level
	log: function editor_log(level, message) {
		if (typeof(level) == "object") {
			this.errorLog.log(level); // "level" is really a Notice object
		} else {
			this.errorLog.log(new Loki.Notice(level, message));
		}
	},
	
	// Method: selectionChanged
	// This method should be called whenever something occurs that changes the
	// user's selection in the visual context. This could be a change in the
	// selection boundaries, but also a change in the selection's style or
	// properties (e.g. the insertion of strong tags around the selection).
	selectionChanged: function editor_selection_changed() {
		this.fireEvent("selection_changed");
	},
	
	// Method: focus
	// Calls focus() on the active context if it provides a focus method.
	//
	// Returns:
	//     (Boolean) - true if this.activeContext.focus was called and returned
	//                 successfully; false otherwise
	focus: function focus() {
		var ret;
		
		if (typeof(this.activeContext.focus) != 'function')
			return false;
		
		return (typeof(ret = this.activeContext.focus()) == "undefined")
			? true
			: !!ret;
	},
	
	_createUI: function _create_editor_ui(settings) {
		this.theme = new Loki.Theme(settings.theme || "light");
		this.theme.applyToOwnerDocument(this);
		
		this.root = this._createRoot();
		this.contextRoot = this._createContextRoot(this.root);
		
		this.root.appendChild(this.errorLog.createBar(this.ownerDocument));
	},
	
	_createRoot: function _create_editor_root() {
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
	
	_loadContexts: function _load_editor_contexts() {
		var context_classes = Loki.builtinContexts;
		var contexts = {};
		
		Loki.Object.enumerate(context_classes, function(key, context_class) {
			contexts[key] = new context_class(this);
		}, this);
		
		return contexts;
	},
	
	// Called by the loading context.
	_loadPlugins: function _load_editor_plugins() {
		if (this.plugins) {
			throw new Error("Plugins already loaded!");
		}
		
		function loaded(plugin_classes, failed) {
			var plugins = {}, fail_count = 0, pfn;
			var dependent_processors = [];
			
			Loki.Object.enumerate(plugin_classes, function(id, plugin_class) {
				var plugin = new plugin_class(this);
				if (typeof(plugin.processDependents) == "function") {
					dependent_processors.push(plugin);
				}
				plugins[id] = plugin;
			}, this);
			
			this.plugins = plugins;
			
			Loki.Object.enumerate(failed, function(id, reason) {
				fail_count++;
				this.log(reason);
			}, this);
			
			if (fail_count > 0) {
				pfn = new Loki.Notice("error",
					Loki._("editor:some plugins failed"));
				
				pfn.getMessageSummary = function() {
					return Loki._("editor:plugin failure teaser");
				};
				
				this.log(pfn);
			}
			
			this.switchContext(this.defaultContext);
			
			base2.forEach(dependent_processors, function(plugin) {
				plugin.processDependents(plugin.getDependents());
			}, this);
			
			Loki.Object.enumerate(plugins, function(id, plugin) {
				base2.forEach(plugin.contexts, function(context_name) {
					this._pluginUsesContext(plugin, context_name);
				}, this);
				
				if (typeof(plugin.setup) == "function")
					plugin.setup();
			}, this);
		}
		
		var selector = (this.settings.plugins || "default") + " + core";
		Loki.PluginManager.load(selector, Loki.currentLocale,
			base2.bind(loaded, this));
	},
	
	_pluginUsesContext: function plugin_uses_context(plugin, context_name) {
		var context = this.contexts[context_name];
		if (!context)
			return;
		plugin[context_name] = context;
		context.processPlugin(plugin);
	}
});
Loki.Class.mixin(Loki.Editor, Loki.EventTarget);
