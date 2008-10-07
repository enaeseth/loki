Loki.builtinContexts.loading = Loki.Class.create(Loki.Context, {
	message: null,
	
	initialize: function LoadingContext(editor) {
		LoadingContext.superclass.call(this, editor);
	},
	
	enter: function enter_loading_context(root) {
		function loaded(plugin_classes, failed) {
			var plugins = {}, fail_count = 0, pfn;
			
			Loki.Object.enumerate(plugin_classes, function(id, plugin_class) {
				plugins[id] = new plugin_class(this.editor);
			}, this);
			
			this.editor.plugins = plugins;
			
			Loki.Object.enumerate(failed, function(id, reason) {
				fail_count++;
				this.editor.log(reason);
			}, this);
			
			if (fail_count > 0) {
				pfn = new Loki.Notice("error",
					Loki._("editor:some plugins failed"));
				
				pfn.getMessageSummary = function() {
					return Loki._("editor:plugin failure teaser");
				};
				
				this.editor.log(pfn);
			}
			
			this.editor.switchContext(this.editor.defaultContext);
		}
		
		function load_plugins() {
			var selector = (this.editor.settings.plugins || "default") +
				" + core";
			
			Loki.PluginManager.load(selector, Loki.currentLocale,
				base2.bind(loaded, this));
		}
		
		var doc = root.ownerDocument;
		this.message = doc.build("div", {
			className: "loading"
		});
		this.message.appendChild(doc.createTextNode(Loki._("editor:loading")));
		root.appendChild(this.message);
		
		setTimeout(base2.bind(load_plugins, this), 1);
	},
	
	exit: function exit_loading_context(root) {
		this.message.parentNode.removeChild(this.message);
	}
});
