#import "../paragraph_maker.js"

Loki.builtinContexts.visual = Loki.Class.create(Loki.Context, {
	toolbar: null,
	iframe: null,
	selection: null,
	keybinder: null,
	_initialHeight: 350,
	
	initialize: function VisualContext(editor) {
		VisualContext.superclass.call(this, editor);
		
		this.toolbar = new Loki.UI.Toolbar(editor);
		this.keybindings = new Loki.UI.KeybindingManager();
		this.paragraphMaker = null;
		
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
		this.paragraphMaker = null;
	},
	
	processPlugin: function visual_process_plugin(plugin) {
		plugin.toolbar = this.toolbar;
		plugin.keybindings = this.keybindings;
		
		if (typeof(plugin._visualReady) == "function") {
			this.editor.addEventListener("visual_ready", plugin,
				"_visualReady");
		}
	},
	
	focus: function visual_context_focus() {
		this.window.focus();
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
		
		var self = this;
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
			
			editor.window = self.window = iframe.contentWindow;
			editor.document = self.document = $extend(editor.window.document);
			editor.body = self.body = editor.document.querySelector("body");
			
			editor.theme.applyToDocument(editor);
			editor.document.makeEditable();
			editor.document.addEventListener("keypress", function eval_kp(ev) {
				return self.keybindings.evaluate(ev);
			}, false);
			
			var selection = new Loki.Selection(editor.window);
			self.selection = editor.selection = selection;
			
			
			self.paragraphMaker = new Loki.ParagraphMaker(editor.window);
			function wrap_key_event(e) {
				if (e.keyCode == 13 /* return */) {
					editor.fireEventWithDefault(new Loki.UI.KeyEvent(e),
						self.paragraphMaker, "handleEvent");
				} else if (Loki.UI.KeyEvent.hasInterpretation(e)) {
					editor.fireEvent(new Loki.UI.KeyEvent(e));
				}
			}
			self.document.addEventListener(Loki.UI.KeyEvent.DOM_TYPE,
				wrap_key_event, false);
			
			function paragraphify(event) {
				if (event.metaKey || event.ctrlKey)
					return;
				
				var range = self.window.getSelectedRange();
				var bounds = range.getBoundaries();
				if (bounds.start && bounds.start.container.nodeName == "BODY") {
					editor.document.execCommand("FormatBlock", false, "<p>");
				}
			}
			self.document.addEventListener("keypress", paragraphify, false);
			
			self._listenForSelectionChanges();
			
			editor.fireEvent("visual_ready");
		}
		
		setup_visual_editor_frame();
		return this.iframe;
	},
	
	_listenForSelectionChanges: function _listen_for_selection_changes() {
		var selection_changing_events = [
			'mousedown', // Moves the carat (anchor) position
			'mouseup',   // Sets the selection focus position
			'keyup'      // Move via keyboard completed (arrow keys, etc.) 
		];
		
		base2.forEach(selection_changing_events, function reg_sc_listener(ev) {
			var editor = this.editor;
			this.editor.document.addEventListener(ev, function(event) {
				editor.selectionChanged();
			}, false);
		}, this);
	}
});

Loki.defaultContext = "visual";
