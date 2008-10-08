Loki.builtinContexts.visual = Loki.Class.create(Loki.Context, {
	toolbar: null,
	iframe: null,
	selection: null,
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
	
	getHTML: function visual_get_html() {
		return this.iframe.contentWindow.document.body.innerHTML;
	},
	
	setHTML: function visual_set_html(html) {
		var body = this.iframe.contentWindow.document.body;
		body.innerHTML = html;
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
				iframe.contentWindow.document.location &&
				iframe.contentWindow.document.body);
			
			if (!ready) {
				setTimeout(setup_visual_editor_frame, 30);
				return;
			}
			
			editor.window = iframe.contentWindow;
			editor.document = $extend(editor.window.document);
			editor.body = editor.document.querySelector("body");
			
			editor.theme.applyToDocument(editor);
			editor.document.makeEditable();
			
			var selection = new Loki.Selection(editor.window);
			this.selection = editor.selection = selection;
			
			editor.fireEvent("visual_ready");
		}
		
		setup_visual_editor_frame();
		return this.iframe;
	}
});

Loki.defaultContext = "visual";
