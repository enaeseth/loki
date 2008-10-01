Loki.contexts.add("visual", Loki.Class.create(Loki.Context, {
	toolbar: null,
	iframe: null,
	_initialHeight: 350,
	
	initialize: function VisualContext(editor) {
		VisualContext.superclass.call(this, editor);
		
		this.toolbar = new Loki.UI.Toolbar(editor);
		
		editor.addEventListener("startup", function() {
			this._initialHeight = this.editor.textarea.clientHeight;
		}, this);
	},
	
	enter: function enter_visual_context(root) {
		root.appendChild(this.toolbar.create(root.ownerDocument));
		root.appendChild(this._getFrame());
	},
	
	exit: function exit_visual_context(root) {
		while (root.firstChild)
			root.removeChild(root.firstChild);
	},
	
	_getFrame: function get_visual_editor_frame() {
		if (this.iframe)
			return this.iframe;
		
		var editor = this.editor;
		var doc = editor.ownerDocument;
		var iframe = doc.build('iframe', {
			src: "about:blank",
			className: "visual_frame",
			frameBorder: 0, // IE adds an extra border without this.,
			style: {
				height: this._initialHeight + "px"
			}
		});
		
		editor.iframe = this.iframe = iframe;
		
		function setup_visual_editor_frame() {
			var ready = (iframe && iframe.contentWindow &&
				iframe.contentWindow.document &&
				iframe.contentWindow.document.location);
			
			if (!ready) {
				setTimeout(setup_visual_editor_frame, 10);
				return;
			}
			
			editor.window = $extend(iframe.contentWindow);
			editor.document = $extend(editor.window.document);
			editor.body = editor.document.querySelector("body");
			
			editor.theme.applyToDocument(editor);
			editor.document.makeEditable();
			
			editor.fireEvent("visual_ready");
		}
		
		setup_visual_editor_frame();
		return this.iframe;
	}
}));
Loki.contexts.alias("visual", "wysiwyg");
Loki.contexts.putSet("builtin", ["visual"]);

Loki.defaultContext = "visual";
