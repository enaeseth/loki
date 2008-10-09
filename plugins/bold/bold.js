Loki.Plugin.create("bold", {
	name: "Bold Text",
	version: "0.1.0",
	sets: "default, power",
	depends: "core >= 3.0, browser_commands >= 0.1",
	
	_ready: false,
	
	initialize: function BoldPlugin(editor) {
		BoldPlugin.superclass.call(this, editor);
		
		this.button = new Loki.UI.ToolbarButton(this.getPath("icons/bold.png"),
			"Bold");
		
		if (!this.visual)
			this.visual = this.editor.contexts.visual;
		if (!this.toolbar)
			this.toolbar = this.visual.toolbar;
			
		this.editor.addEventListener("visual_ready", this, "_visualReady");
	},
	
	_visualReady: function setup_bold_plugin() {
		if (this._ready)
			return;
		this._ready = true;
		
		var bc = this.editor.plugins.browser_commands;
		var selection = this.editor.selection;
		
		bc.wrapToggleCommand("bold");
		//iw.extendSelection("bold", "b, strong", "strong");
		
		function invoke_bold() {
			selection.toggleBold();
		}
		
		this.button.addEventListener("click", invoke_bold);
		this.visual.keybindings.add("Ctrl B", invoke_bold);
		
		this.editor.addEventListener("selection_changed", this,
			"selectionChanged");
		this.toolbar.addItem(this.button);
	},
	
	selectionChanged: function bold_context_changed() {
		var selection = this.editor.selection;
		
		this.button.setActive(selection.isBold());
	}
});