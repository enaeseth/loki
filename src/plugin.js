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
Loki.Plugin.create = function create_plugin(members) {
	
};

