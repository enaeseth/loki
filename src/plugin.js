#import "plugin_manager.js"

// Class: Loki.Plugin
// The base class for all Loki plugins. Loki.Plugin should not be subclassed
// directly to write new plugins; instead, use <Loki.Plugin.create>.
Loki.Plugin = Loki.Class.create({
	initialize: function Plugin(editor) {
		this.editor = editor;
	},
	
	getPath: function get_plugin_resource_path(path) {
		return $format("{0}plugins/{1}/{2}", Loki.baseURL, this.id, path);
	},
	
	getDependents: function get_plugin_dependents() {
		var dependents = [];
		var plugins = Loki.PluginManager.plugins;
		Loki.Object.enumerate(this.editor.plugins, function(id, plugin) {
			if (this.id in plugins[id].dependencies)
				dependents.push(plugin);
		}, this);
		return dependents;
	},
	
	usesContext: function plugin_uses_context(context_name) {
		if (!this._context_map) {
			this._context_map = {};
			base2.forEach(this.contexts, function(context) {
				this._context_map[context] = true;
			}, this);
		}
		
		return this._context_map[context_name] || false;
	},
	
	toString: function plugin_to_string(plugin) {
		return $format("[{name} plugin]", this);
	}
});

// Function: create
// Registers a new plugin.
//
// Parameters:
//     (String) handle - the ID by which the plugin will be known
//     (Object) members - the plugin class members
Loki.Plugin.create = function create_plugin(handle, members) {
	function capitalize(name) {
		return name.charAt(0).toUpperCase() + name.substr(1);
	}
	
	var plugin_class = Loki.Class.create(Loki.Plugin, members);
	var pt = plugin_class.prototype;
	pt.contexts = (typeof(pt.contexts) == 'string')
		? pt.contexts.split(/\s*,\s*|\s+/)
		: pt.contexts || [];
	
	var spec = {
		id: handle,
		name: pt.name || null,
		description: pt.description || null,
		version: pt.version || '0.0a0',
		depends: pt.depends || null,
		sets: pt.sets || null,
		contexts: pt.contexts,
		implementation: plugin_class
	};
	
	pt.id = handle;
	
	Loki.PluginManager.register(spec);
};
