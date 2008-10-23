// HTML Source Editing
Loki.Plugin.create("source", {
	name: "HTML Source Code Editing",
	version: "0.1.0",
	sets: "default, power",
	depends: "core >= 3.0",
	contexts: "visual",
	
	initialize: function SourcePlugin(editor) {
		SourcePlugin.superclass.call(this, editor);
		
		editor.addContext("source", this.context);
		this.button = new Loki.UI.ToolbarButton(
			this.getPath("icons/source.png"),
			Loki._("source:edit HTML")
		);
	},
	
	_visualReady: function setup_source_plugin(initial) {
		if (!initial)
			return false;
		this.button.addEventListener("click", function edit_source() {
			var ta = $extend(this.editor.textarea);
			var frame = this.editor.iframe;
			ta.setStyle({
				height: frame.clientHeight + "px",
				width: frame.clientWidth + "px"
			});
			this.editor.switchContext("source");
		}, this);
		this.toolbar.addItem(this.button);
	},
	
	context: Loki.Class.create(Loki.Context, {
		initialize: function SourceContext(editor) {
			SourceContext.superclass.call(this, editor);
		},
		
		enter: function enter_source_context(root) {
			var plugin = this.editor.plugins.source;
			
			this.toolbar = new Loki.UI.Toolbar(this.editor);
			this.button = new Loki.UI.ToolbarButton(
				plugin.getPath("icons/source.png"),
				Loki._("source:stop editing HTML")
			);
			
			this.button.addEventListener("click", function() {
				this.editor.switchContext("visual");
			}, this);
			
			this.toolbar.addItem(this.button);
			
			root.appendChild(this.toolbar.create(root.ownerDocument));
			root.appendChild(this.editor.textarea);
			
			this.button.setActive(false);
			this.button.setActive(true);
		},
		
		exit: function exit_source_context(root) {
			while (root.lastChild)
				root.removeChild(root.lastChild);
		},
		
		getHTML: function source_get_html() {
			return this.editor.textarea.value;
		},

		setHTML: function source_set_html(html) {
			this.editor.textarea.value = html;
		}
	})
});