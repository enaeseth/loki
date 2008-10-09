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
	
	var spec = {
		id: handle,
		name: pt.name || null,
		description: pt.description || null,
		version: pt.version || '0.0a0',
		depends: pt.depends || null,
		sets: pt.sets || null,
		implementation: plugin_class
	};
	
	plugin_class.prototype.id = handle;
	
	Loki.PluginManager.register(spec);
};
