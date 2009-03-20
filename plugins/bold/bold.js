Loki.Plugin.create("bold", {
	name: "Bold Text",
	version: "0.1.0",
	sets: "default, power",
	depends: "core >= 3.0, browser_commands >= 0.1",
	contexts: "visual",
	
	initialize: function BoldPlugin(editor) {
		BoldPlugin.superclass.call(this, editor);
		
		this.button = new Loki.UI.ToolbarButton(this.getPath("icons/bold.png"),
			"Bold");
	},
	
	_visualReady: function setup_bold_plugin(initial) {
		var selection = this.editor.selection;
		
		if (initial) {
			// this.commands is a reference to the browser_commands plugin,
			// which was added by it because we said we depended on it.
			this.commands.wrapToggleCommand("bold");
			//iw.extendSelection("bold", "b, strong", "strong");
		
			function invoke_bold() {
				selection.toggleBold();
			}
		
			this.button.addEventListener("click", invoke_bold);
			this.keybindings.add("Ctrl B", invoke_bold);
		
			this.editor.addEventListener("selection_changed", this,
				"selectionChanged");
			this.toolbar.addItem(this.button);
		}
	},
	
	selectionChanged: function bold_context_changed() {
		var selection = this.editor.selection;
		
		this.button.setActive(selection.isBold());
	}
});
