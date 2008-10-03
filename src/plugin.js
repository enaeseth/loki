#import "plugin_manager.js"

// Class: Loki.Plugin
// The base class for all Loki plugins. Loki.Plugin should not be subclassed
// directly to write new plugins; instead, use <Loki.Plugin.create>.
Loki.Plugin = Loki.Class.create({
	initialize: function Plugin(editor) {
		this.editor = editor;
	}
});

// Function: create
Loki.Plugin.create = function create_plugin(handle, members) {
	function capitalize(name) {
		return name.charAt(0).toUpperCase() + name.substr(1);
	}
	
	var plugin_class = Loki.Class.create(Loki.Plugin, members);
	var pt = plugin_class.prototype;
	
	var spec = {
		id: handle,
		name: pt.name || null,
		version: pt.version || '0.0a0',
		depends: pt.depends || null,
		sets: pt.sets || null,
		implementation: plugin_class
	};
	
	Loki.PluginManager.register(spec);
};
