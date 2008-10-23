#import "../paragraph_maker.js"

Loki.builtinContexts.visual = Loki.Class.create(Loki.Context, {
	alive: false,
	firstTime: true,
	toolbar: null,
	iframe: null,
	window: null,
	document: null,
	body: null,
	selection: null,
	keybinder: null,
	html: null,
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
		this.alive = false;
		while (root.firstChild)
			root.removeChild(root.firstChild);
		this.paragraphMaker = null;
		this.html = null;
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
	
	getDocumentRoot: function visual_get_document_root() {
		return this.body;
	},
	
	getHTML: function visual_get_html() {
		return this.body.innerHTML;
	},
	
	setHTML: function visual_set_html(html) {
		if (!this.alive || !this.body)
			this.html = html;
		else
			this.body.innerHTML = html;
	},
	
	_getFrame: function get_visual_editor_frame() {
		if (this.alive && this.iframe)
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
			self.alive = true;
			
			editor.theme.applyToDocument(editor);
			editor.document.makeEditable();
			editor.document.addEventListener("keypress", function eval_kp(ev) {
				return self.keybindings.evaluate(ev);
			}, false);
			
			var selection;
			if (self.selection) {
				editor.selection = selection = self.selection;
			} else {
				selection = new Loki.Selection(editor.window);
				self.selection = editor.selection = selection;
			}
			
			if (self.html) {
				self.body.innerHTML = self.html;
				self.html = null;
			}
			
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
				if (!range)
					return;
				var bounds = range.getBoundaries();
				if (bounds.start && bounds.start.container.nodeName == "BODY") {
					editor.document.execCommand("FormatBlock", false, "<p>");
				}
			}
			self.document.addEventListener("keypress", paragraphify, false);
			
			self._listenForSelectionChanges();
			
			editor.fireEvent("visual_ready", self.firstTime);
			self.firstTime = false;
		}
		
		setTimeout(setup_visual_editor_frame, 30);
		return this.iframe;
	},
	
	_listenForSelectionChanges: function _listen_for_selection_changes() {
		var selection_changing_events = [
			'mousedown', // Moves the carat (anchor) position
			'mouseup',   // Sets the selection focus position
			'keydown',   // Move via keyboard (arrow keys, etc.) 
			'keyup'
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
