// Provides a slightly higher-level interface to the browser's built-in
// execCommand stuff.
Loki.Plugin.create("browser_commands", {
	name: "Builtin Browser Command Helper",
	version: "0.1.0",
	depends: "core >= 3.0",
	
	initialize: function BrowserCommandPlugin(editor) {
		BrowserCommandPlugin.superclass.call(this, editor);
	},
	
	processDependents: function process_browser_command_dependents(deps) {
		base2.forEach(deps, function(plugin) {
			plugin.wrapToggleCommand = this.wrapToggleCommand;
		}, this);
	},
	
	wrapToggleCommand: function wrap_toggle_command(command) {
		function capitalize(s) {
			return s.charAt(0).toUpperCase() + s.substr(1).toLowerCase();
		}
		
		command = capitalize(command);
		var editor = this.editor;
		var sel = editor.selection;
		
		function query_command() {
			return editor.document.queryCommandState(command);
		}
		
		function set_command(value) {
			if (query_command() != value)
				toggle_command();
		}
		
		function toggle_command() {
			if (editor.document.queryCommandEnabled) {
				if (!editor.document.queryCommandEnabled(command))
					return false;
			}
			editor.document.execCommand(command, false, null);
			return true;
		}
		
		sel["is" + command] = query_command;
		sel["set" + command] = set_command;
		sel["toggle" + command] = toggle_command;
	}
});
