Loki.Plugin.create("links", {
	name: "Links",
	version: "0.1.0",
	sets: "default, power",
	depends: "core >= 3.0, browser_commands >= 0.1",
	contexts: "visual",
	
	initialize: function LinksPlugin(editor) {
		LinksPlugin.superclass.call(this, editor);
		this.button = new Loki.UI.ToolbarButton(this.getPath("icons/link.png"),
			"Link", {autofocus: false});
	},
	
	_visualReady: function setup_links_plugin(initial) {
		if (initial) {
			this.button.addEventListener("click", function() {
				this.openDialog("editor");
			}, this);
			
			this.toolbar.addItem(this.button);
		}
	}
});
