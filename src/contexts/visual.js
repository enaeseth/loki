Loki.contexts.add("visual", Loki.Class.create(Loki.Context, {
	initialize: function VisualContext(editor) {
		VisualContext.superclass.call(this, editor);
	}
}));
Loki.contexts.alias("visual", "wysiwyg");
Loki.contexts.putSet("builtin", ["visual"]);

Loki.defaultContext = "visual";
