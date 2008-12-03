Loki.builtinContexts.loading = Loki.Class.create(Loki.Context, {
	message: null,
	
	initialize: function LoadingContext(editor) {
		LoadingContext.superclass.call(this, editor);
	},
	
	enter: function enter_loading_context(root) {
		var doc = root.ownerDocument;
		this.message = doc.build("div", {
			className: "loading"
		});
		this.message.appendChild(doc.createTextNode(Loki._("editor:loading")));
		root.appendChild(this.message);
		
		setTimeout(base2.bind(this.editor._load, this.editor), 15);
	},
	
	exit: function exit_loading_context(root) {
		this.message.parentNode.removeChild(this.message);
	}
});
