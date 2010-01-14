//= require "contexts/visual.js"

/**
 * Declares instance variables. <code>init</code> must be called to initialize them.
 * @constructor
 *
 * @class A WYSIWYG HTML editor.
 */
UI.Loki = function Loki()
{
	var _owner_window;
	var _owner_document; // that of _textarea etc.
	var _window;     //
	var _document;   // _window, _document, and _body are those of _iframe's content
	var _body;       //

	var _root;               // + root (div)
	var _toolbar;            // |--- toolbar (div)
	var _textarea_toolbar;   // |--- textarea_toolbar (div)
	var _textarea;           // |---get_nearest_bl_ancestor_element textarea
	var _statusbar;          // |--- statusbar (div)
	var _grippy_wrapper;     // |--+ grippy_wrapper (div)
	var _grippy;             //    |--- grippy (img)
	var _iframe_wrapper;     // |--+ iframe_wrapper (table)
	var _iframe;             //    |--- iframe
	var _hidden;             // |--- hidden (input)

	var _settings;
	var _options;
	var _use_p_hack;
	var _state_change_listeners = [];
	var _masseuses = [];
	var _menugroups = [];
	var _keybindings = [];
	var _editor_domain;
	var _current_context_name;
	var _saved_html;
	var _html_generator;

	var self = this;
	var undefined;

	this.serialize_node_children = function get_node_inner_html(node) {
		if (_html_generator) {
			if (node.nodeName == 'BODY')
				node = node.childNodes;
			return _html_generator.generate(node);
		} else {
			return node.innerHTML;
		}
	};

	/**
	 * Returns the (cleaned-up) HTML of the document currently being edited.
	 *
	 * @returns {String} the HTML of the document currently being edited.
	 */
	this.get_html = function editor_get_html() {
		if (!self.current_context && !_saved_html)
			return undefined;
		
		return (self.current_context.get_document_html) ?
			self.current_context.get_document_html() :
			_saved_html;
	};

	this.get_dirty_html = function editor_get_dirty_html()
	{
		return (self.current_context && self.current_context.get_dirty_html) ?
			self.current_context.get_dirty_html() :
			undefined;
	};

	/**
	 * Sets the HTML of the document.
	 *
	 * @param	html	the HTML of the document
	 */
	this.set_html = function(html)
	{
		if (self.current_context && self.current_context.set_document_html) {
			self.current_context.set_document_html(html);
		} else {
			_saved_html = html;
		}
	};
	
	this.crash_report = function editor_generate_crash_report(exc)
	{
		var s = Util.Object.clone(this.settings);
		delete s.options;
		
		return {
			version: this.version,
			report_version: "1.0",
			user_agent: navigator.userAgent,
			platform: navigator.platform,
			settings: s,
			options: Util.Object.names(this.options),
			'exception': exc,
			document: this.get_dirty_html()
		};
	};
	
	this.crashed = function loki_editor_crashed(exc)
	{
		var report_uri = _settings.crash_report_uri;
		if (!report_uri)
			return false;
		
		new Util.Request(report_uri, {
			method: "POST",
			headers: {'Content-Type': 'application/json'},
			body: Util.JSON.dump(self.crash_report(exc))
		});
		return true;
	};
	
	this.enumerate_components = function enumerate_components(property, fn) {
		if (arguments.length == 1) {
			fn = property;
			Util.Object.enumerate(self.components, function(name, component) {
				fn(component);
			});
		} else {
			Util.Object.enumerate(self.components, function(name, component) {
				Util.Array.for_each(component[property], fn);
			});
		}
	};
	
	this.enumerate_masseuses = function enumerate_masseuses(fn) {
		Util.Array.for_each(_masseuses, fn);
	};
	
	/**
	 * Sets focus to the editing window.
	 * @return {void}
	 */
	this.focus = function focus_on_loki()
	{
		if (self.current_context && self.current_context.focus)
			self.current_context.focus();
	}

	/**
	 * Initializes instance variables.
	 *
	 * @param {HTMLTextAreaElement} textarea the textarea to replace with Loki
	 * @param {Object} settings Loki settings
	 * @returns {UI.Loki} this Loki instance
	 * @see http://code.google.com/p/loki-editor/wiki/Settings
	 */
	this.init = function init_loki(textarea, settings)
	{
		// Incompatible browser check.
		if (!(Util.Browser.IE || Util.Browser.Gecko || Util.Browser.WebKit)) {
			throw new Error('The Loki HTML editor does not currently support ' +
				'your browser.');
		} else if (!textarea) {
			throw new Error('Cannot initialize Loki without a textarea.');
		} else if (!textarea.form) {
			throw new Error('Cannot initialize Loki because the textarea ' +
				Util.Node.get_debug_string(textarea) + ' does not belong to ' +
				'a form.');
		}
		
		_settings = (settings) ? Util.Object.clone(settings) : {};
		
		if (_settings.options && !_settings.components) {
			if (typeof(console) == 'object' && 'warn' in console) {
				console.warn('Forwards-compatible code that uses Loki ' +
					'should specify a component selector as the "components" '+
					'setting, not "options".');
			}
			
			_settings.components = settings.options;
			delete _settings.options;
		}
		
		if (Util.Browser.WebKit) {
			// WebKit doesn't implement underlining in a way that works for us,
			// and our clipboard support is currently IE only.
			if (!_settings.components)
				settings.components = 'default';
			// _settings.components += ' -underline -clipboard';
		}
		
		Util.Array.for_each(['site', 'type'], function clean_pattern(which) {
			var setting = 'default_' + which + '_regexp';
			if (!_settings[setting])
				return;
			if (!(_settings[setting].exec && _settings[setting].test)) {
				_settings[setting] = new RegExp(_settings[setting]);
			}
		});
		
		self.settings = _settings;
		self.components = _load_components(_settings.components || 'default');
		
		if (!_settings.base_uri) {
			_settings.base_uri = autodetect_base_uri();
		}
		
		if (_settings.html_generator == 'loki') {
			_html_generator = new Util.HTML_Generator({indent_text: '    '});
		}
		
		UI.Clipboard_Helper._setup(_settings.base_uri);
		
		_textarea = self.textarea = textarea;
		_owner_window = self.owner_window = window;
		_owner_document = self.owner_document = _textarea.ownerDocument;

		// Create the various elements
		_create_root();
		_initialize_contexts();
		
		// Append style sheets
		_append_owner_document_style_sheets();
		
		_initialize_components();
		
		// Replace the textarea with root
		_replace_textarea();

		// Switch to the default context.
		self.switch_context(_settings.default_context || 'visual');
		
		return self;
	};
	
	/*
	 * Attempts to automatically detect the Loki base URI.
	 */
	function autodetect_base_uri()
	{
		var scripts = document.getElementsByTagName('SCRIPT');
		var pattern = /\bloki\.js\b.*$/;
		
		for (var i = 0; i < scripts.length; i++) {
			if (pattern.test(scripts[i].src)) {
				// Found Loki!
				return scripts[i].src.replace(pattern, '');
			}
		}
		
		throw new Error("Unable to automatically determine Loki's base URI. " +
			"Please set it explicitly by passing Loki a 'base_uri' setting.");
	}
	
	function _load_components(selector) {
		return window.Loki.components.get(selector);
	}
	
	function _initialize_contexts() {
		self.current_context = null;
		self.contexts = {
			visual: new UI.VisualContext(self)
		};
	}
	
	function _initialize_components() {
		Util.Object.enumerate(self.components, function(name, component) {
			component.fire_event('init', self);
		});
	}
	
	this.get_current_context = function get_current_editing_context_name() {
		return _current_context_name;
	};
	
	this.switch_context = function switch_editing_context(new_context) {
		if (typeof(new_context) != 'string') {
			throw new Error('Must provide a context name to switch the ' +
				'editor context.');
		} else if (!(new_context in self.contexts)) {
			throw new Error('Unknown editor context "' + new_context + '".');
		}
		
		if (self.current_context) {
			if (self.current_context.get_document_html)
				_saved_html = self.current_context.get_document_html();
			self.current_context.exit(_root);
		}
		
		self.current_context = undefined;
		var context = self.contexts[new_context];
		context.enter(_root, function entered_new_context(context) {
			if (context.frame)
				self.iframe = _iframe = context.frame;
			if (context.window)
				self.window = _window = context.window;
			if (context.document)
				self.document = _document = context.document;
			if (context.body)
				self.body = _body = context.body;
			
			if (context.set_document_html && _saved_html) {
				context.set_document_html(_saved_html);
			}
			
			if (context.document && context.body) {
				self.env = new UI.Editing_Environment(self);
				
				// Firing the "load" event on a component also adds any of its
				// command sets to the editing environment.
				Util.Object.enumerate(self.components, function(n, component) {
					component.fire_event('load', self);
				});
				
				// Add certain event listeners to the document and elsewhere
				_add_double_click_listeners();
				_add_document_listeners();

				// Add keybindings
				_add_keybindings();
				
				// Set up menu groups
				_init_menugroups();
			}
			
			_current_context_name = new_context;
			self.current_context = context;
		});
	};
	
	/**
	 * Returns the domain under which this editor instance exists.
	 */
	this.editor_domain = function()
	{
		if (null == self._editor_domain) {
			self._editor_domain = Util.URI.extract_domain(window.location);
		}
		
		return self._editor_domain;
	};

	/**
	 * Creates the root element for Loki.
	 */
	var _create_root = function()
	{
		_root = self.root = _owner_document.createElement('DIV');
		Util.Element.add_class(_root, 'loki');
	};

	/**
	 * Creates the hidden element for Loki, and sets the hidden
	 * element's name, id, and value to those of the textarea element.
	 */
	var _create_hidden = function()
	{
		_hidden = _owner_document.createElement('INPUT');
		_hidden.setAttribute('type', 'hidden');

		if ( _textarea.getAttribute('id') )
			_hidden.setAttribute('id', _textarea.getAttribute('id'));

		if ( _textarea.getAttribute('name') )
			_hidden.setAttribute('name', _textarea.getAttribute('name'));

		if ( _textarea.getAttribute('value') )
			_hidden.setAttribute('value', _textarea.getAttribute('value'));
	};

	/**
	 * Replaces the textarea with the root.
	 */
	var _replace_textarea = function()
	{
		_textarea.parentNode.replaceChild(_root, _textarea);
	};

	/**
	 * Append style sheets to format the main Loki box (not for
	 * dialogs etc.) to owner_document's head.
	 */
	var _append_owner_document_style_sheets = function()
	{
		Util.Document.append_style_sheet(_owner_document, _settings.base_uri + 'static/css/owner.css');
	};

	/**
	 * Append style sheets to format the innards of the loki iframe
	 */
	var _append_document_style_sheets = function()
	{
		var add = Util.Document.append_style_sheet.curry(_document);
		
		add((_settings.base_uri || '') + 'static/css/document.css');
		
		(_settings.document_style_sheets || []).each(function (sheet) {
			add(sheet);
		});
	};

	/**
	 * Add masseuses. The purpose of a masseuse is to replace elements 
	 * inconvenient to edit with fake elements that are convenient 
	 * to edit, and vice versa. 
	 *
	 * This is the wrong place to add code designed to clean up bad 
	 * HTML; that should be done in UI.Clean.
	 */
	var _add_masseuses = function()
	{
		function add_masseuse(masseuse_class)
		{
			var masseuse = new masseuse_class();
			masseuse.init(self);
			_masseuses.push(masseuse);
		}
		
		self.enumerate_components('masseuses', add_masseuse);
	};

	/**
	 * Run the massage_node_descendants methods of the masseuses 
	 * added in _add_masseuses on _body.
	 */
	var _massage_body = function()
	{
		_massage_node_descendants(_body);
	};

	/**
	 * Run the unmassage_node_descendants methods of the masseuses 
	 * added in _add_masseuses on _body.
	 */
	var _unmassage_body = function()
	{
		_unmassage_node_descendants(_body);
	};

	/**
	 * Run the massage_node_descendants methods of the masseuses 
	 * added in _add_masseuses.
	 */
	var _massage_node_descendants = this.massage_node_descendants = function(node)
	{
		for ( var i = 0; i < _masseuses.length; i++ )
		{
			_masseuses[i].massage_node_descendants(node);
		}
	};

	/**
	 * Run the unmassage_node_descendants methods of the masseuses 
	 * added in _add_masseuses.
	 */
	var _unmassage_node_descendants = this.unmassage_node_descendants = function(node)
	{
		for ( var i = 0; i < _masseuses.length; i++ )
		{
			_masseuses[i].unmassage_node_descendants(node);
		}
	};
	
	function _add_double_click_listeners()
	{
		function add(listener_class) {
			var listener = (new listener_class()).init(self);
			Util.Event.observe(_body, 'dblclick', function(ev) {
				listener.double_click(ev);
			});
		}
		
		self.enumerate_components('double_click_listeners', add);
	}
	
	this.describe_error = function describe_error(ex) {
		// The following probably only works under Mozilla.
		function get_stack_trace(e) {
			if (typeof(e.stack) != "string")
				return null;
			
			var stack = [];
			var raw_parts = e.stack.split("\n");
			var URI = Util.URI;
			var base = URI.build(URI.normalize(self.settings.base_uri));
			
			return raw_parts.map(function parse_stack_trace_element(l) {
				var pos = l.lastIndexOf("@");
				var source = l.substr(0, pos);
				var location = l.substr(pos + 1);
				
				if (source.charAt(0) == "(")
					source = "anonymous_fn" + source;
				
				pos = location.lastIndexOf(":");
				var file = location.substr(0, pos);
				var line = parseInt(location.substr(pos + 1));
				
				if (file.indexOf(base) == 0)
					file = file.substr(base.length);
				
				return {
					source: source,
					file: file,
					line: line
				};
			});
		}
		
		var message;
		if (ex.message) {
			message = ex.message;
		} else {
			try {
				message = ex.toString();
			} catch (e) {
				// Why not just test for toString? Because IE will throw an
				// exception.
				message = '(unable to get exception message)';
			}
		}
		var stack = get_stack_trace(ex);
		
		if (stack) {
			for (var i = 0; i < 4; i++) {
				message += ("\n" + stack[i].source + "\t" +
					stack[i].file + ":" + stack[i].line);
			}
		}
		
		return message;
	}

	/**
	 * Add certain event listeners to the document, e.g. to listen to
	 * key strokes, mouse clicks, and so on.
	 */
	var _add_document_listeners = function()
	{
		// added NF 10/14 for TinyMCE
		var control = new TinyMCEControl();
		control.init(_window, _iframe, self);
		var tinyMCE = new TinyMCE();
		tinyMCE.init(_window, control);
		
		var paste_keyup = false; // a keyup event listener has been registered
		var mod_key = (Util.Browser.Mac ? 'meta' : 'ctrl') + 'Key';
		var mod_key_pressed = null;
		
		function move_past_nbsp(direction) {
			var sel = Util.Selection.get_selection(self.window);
			var range = Util.Range.create_range(sel);
			
			if (!Util.Range.is_collapsed(range))
				return false;
			
			var bounds = Util.Range.get_boundaries(range);
			var node, pos, must_move = false, value;
			
			function is_at_edge() {
				if (pos <= 1)
					return true;
				
				if (node.nodeType == Util.Node.TEXT_NODE) {
					return (pos >= node.nodeValue.length - 1);
				} else {
					return (pos >= node.childNodes.length - 1);
				}
			}
			
			if (bounds.start.container.nodeType == Util.Node.TEXT_NODE) {
				node = bounds.start.container;
				value = node.nodeValue;
				if ((direction < 0 && bounds.start.offset > 0) || (direction > 0 && bounds.end.offset < value.length)) {
					pos = bounds.start.offset;
					if (direction < 0)
						pos--;
					if (node.nodeValue.charCodeAt(pos) != 160 || !is_at_edge())
						return false;
					else
						must_move = true;
				}
			}
			
			if (!must_move) {
				if (bounds.start.container.nodeType == Util.Node.TEXT_NODE) {
					node = bounds.start.container;
					node = (direction < 0) ? node.previousSibling : node.nextSibling;
				} else {
					node = bounds.start.container.childNodes[bounds.start.offset]
				}
				if (!node)
					return false;
					
				while (true) {
					if (!node)
						return false;
					if (node.nodeType != Util.Node.TEXT_NODE)
						return false;
					value = node.nodeValue;
					if (value.length == 0) {
						// try the neighboring node
						node = (direction < 0) ?
							node.previousSibling :
							node.nextSibling;
						continue;
					}
				
					pos = (direction < 0) ? value.length - 1 : 0;
					if (value.charCodeAt(pos) != 160 || !is_at_edge())
						return false;
					break;
				}
			}
			
			if (direction > 0 && node.nodeType == Util.Node.TEXT_NODE) {
				node = Util.Node.next_element_sibling(node.parentNode);
				if (!node)
					return false;
				pos = 0;
			}
			
			range = Util.Document.create_range(self.document);
			try {
				Util.Range.set_start(range, node, pos);
				range.collapse(true /* to start */);
				Util.Selection.select_range(sel, range);
			} catch (e) {
				return false;
			}
			return true;
		}
		
		Util.Event.add_event_listener(_document, 'mouseup', function() {
			move_past_nbsp(-1);
		});
		Util.Event.add_event_listener(_document, 'keyup', function(ev) {
			if (ev.keyCode == 37)
				move_past_nbsp(-1);
		});
		Util.Event.add_event_listener(_document, 'keydown', function(ev) {
			if (ev.keyCode == 39) {
				if (move_past_nbsp(1)) {
					return Util.Event.prevent_default(ev);
				}
			}
		});

		var paragraph_helper = (new UI.Paragraph_Helper).init(self);
		Util.Event.add_event_listener(_document, 'keypress', function(event)
		{
			if (!event)
				event = window.event;
			if (!event.metaKey && !event.ctrlKey)
				paragraph_helper.possibly_paragraphify();
			if (Util.Browser.IE) {
				return Util.Fix_Keys.fix_enter_ie(event, _window, self);
			} else {
				Util.Fix_Keys.fix_delete_and_backspace(event, _window);
				tinyMCE.handleEvent(event);
			}
		});

		Util.Event.add_event_listener(_document, 'contextmenu', function(event) 
		{
			return _show_contextmenu(event || _window.event);
		});
		
		if (Util.Browser.IE) {
			function select_end(sel, range, el) {
				var c, text, length;
				for (c = el.lastChild; c; c = c.previousSibling) {
					if (c.nodeType == Util.Node.ELEMENT_NODE) {
						if (c.nodeName in Util.Element.empty) {
							Util.Range.set_start_after(range, c);
							Util.Range.set_end_after(range, c);
							Util.Selection.select_range(sel, range);
							return true;
						} else if (select_end(sel, range, c)) {
							return true;
						}
					} else if (c.nodeType == Util.Node.TEXT_NODE) {
						length = c.nodeValue.length;
						Util.Range.set_start(range, c, length);
						Util.Range.set_end(range, c, length);
						Util.Selection.select_range(sel, range);
						return true;
					}
				}
				
				text = el.ownerDocument.createTextNode('');
				el.insertBefore(text, el.lastChild);
				
				Util.Range.set_start(range, text, 0);
				Util.Range.set_end(range, text, 0);
				Util.Selection.select_range(sel, range);
				return true;
			}
			
			Util.Event.observe(_document, 'mouseup', function(event) {
				var sel, range;
				
				if (event.srcElement.tagName == 'HTML') {
					self.focus();
					
					sel = Util.Selection.get_selection(_window);
					range = Util.Document.create_range(_document);
					select_end(sel, range, _body);
					
					event.cancelBubble = true;
					event.returnValue = false;
				}
			});
		}
		
		function perform_cleanup()
		{
			_unmassage_body();
			UI.Clean.clean(_body, _settings, true);
			_massage_body();
		}
		
		function handle_paste_event(ev)
		{
			if (paste_keyup && ev.type == 'paste') {
				// If the browser is capable of generating actual paste
				// events, then remove the DOMNodeInserted handler.
				
				Util.Event.remove_event_listener(_document, 'keydown',
					key_pressed);
				Util.Event.remove_event_listener(_document, 'keyup',
					key_raised);
				paste_keyup = false;
			}
			
			perform_cleanup.defer();
		}
		
		// Q: Eric, why is there all this code to accomplish the simple task
		//    of figuring out if the user pressed (Command|Ctrl)+V?
		// A: Firefox/Mac does not always give us a keydown event for when
		//    Cmd+V is pressed. We can't simply look for a Cmd+V keyup, as
		//    it's perfectly acceptable to release the command key before
		//    the V key, so the V's keyup event may have metaKey set to
		//    false. Therefore, we look for a Command keydown and store the
		//    time at which it happened. If we get a keyup for V within 2
		//    seconds of this, run a cleanup.
		
		function key_pressed(ev)
		{
			if (!paste_keyup)
				return;
			if (ev[mod_key]) {
				// We might be starting a paste.
				mod_key_pressed = (new Date()).getTime();
			}
		}
		
		function key_raised(ev)
		{
			if (!paste_keyup)
				return;
			if (mod_key_pressed && ev.keyCode == 86 /* V */) {
				if (mod_key_pressed + 2000 >= (new Date()).getTime())
					perform_cleanup();
				mod_key_pressed = null;
			}
		}
		
		Util.Event.observe(_document.body, 'paste', handle_paste_event);
		if (Util.Browser.IE || (Util.Browser.Gecko && /rv:1\.9/.test(navigator.userAgent))) {
			// We know that we have paste events.
			paste_keyup = false;
		} else {
			paste_keyup = true;
			Util.Event.add_event_listener(_document, 'keydown', key_pressed);
			Util.Event.add_event_listener(_document, 'keyup', key_raised);
		}
		
		function submit_handler(ev)
		{
			try {
				self.copy_iframe_to_hidden();
			} catch (ex) {
				Util.Event.prevent_default(ev);
				var sent = self.crashed(ex);
				alert("An error occurred that prevented your document from " +
					"being safely submitted." +
					(sent ? " A report of this error has been sent." : "") +
					"\n\nTechnical details:\n" +
					self.describe_error(ex));
				
				if (typeof(console) == 'object' && 'error' in console) {
					console.error('Failed to generate HTML:', ex);
				}
				
				throw ex;
				return false;
			}
			
			return true;
		}
		
		
		// this copies the changes made in the iframe back to the hidden form element
		// Util.Event.add_event_listener(_hidden.form, 'submit',
		// 	Util.Event.listener(submit_handler));
	};

	var _add_keybindings = function()
	{
		function add_keybinding(keybinding_class)
		{
			var keybinding = (new keybinding_class).init(self);
			_keybindings.push(keybinding);
		};

		// return value indicates whether to continue bubbling of event or not
		function fire_keybindings(event)
		{
			var i, keybinding, length = _keybindings.length;
			for (i = 0; i < length; ++i) {
				keybinding = _keybindings[i];
				if (keybinding.test(event)) {
					var should_bubble = keybinding.action();
					return (typeof(should_bubble) == "boolean")
						? should_bubble
						: false; // don't bubble
				}
			}
			
			return true; // bubble
		};

		self.enumerate_components('keybindings', add_keybinding);
		add_keybinding(UI.Delete_Element_Keybinding); // Delete image, anchor, HR, or table when selected
		add_keybinding(UI.Tab_Keybinding); // Tab

		// We need to listen for different key events for IE and Gecko,
		// because their default actions are on different events.
		var firer, event_name;
		if (Util.Browser.IE) {
			event_name = 'keydown';
			firer = function ie_fire_keybindings(event) {
				if (!fire_keybindings(event)) {
					event.cancelBubble = true;
					return Util.Event.prevent_default(event);
				}
				return true;
			};
		} else {
			event_name = 'keypress';
			firer = function gecko_fire_keybindings(event) {
				return (fire_keybindings(event))
					? true
					: Util.Event.prevent_default(event);
			};
		}
		Util.Event.observe(_document, event_name, firer);
	};

	var _init_menugroups = function()
	{
		function add_menugroup(menugroup_class)
		{
			var menugroup = (new menugroup_class).init(self);
			_menugroups.push(menugroup);
		}
		
		self.enumerate_components('menugroups', add_menugroup);
	};

	/**
	 * Shows a context menu.
	 */
	var _show_contextmenu = function(event)
	{
		var menu = (new UI.Menu).init(self);
		var i, menuitems, added = false;

		// Get appropriate menuitems
		for (i = 0; i < _menugroups.length; i++) {
			try {
				menuitems = _menugroups[i].get_contextual_menuitems();
			} catch (e) {
				if (typeof(console) == 'object' && 'warn' in console) {
					console.warn('Failed to add menugroup', i, '.', e);
				}
			}
			
			if (menuitems && menuitems.length > 0) {
				if (!added)
					added = true;
				else
					menu.add_menuitem((new UI.Separator_Menuitem).init());

				menu.add_menuitems(menuitems);
			}
		}
		
		menu.display(event);

		Util.Event.prevent_default(event);
		return false; // IE
	};
};
UI.Loki.prototype.version = "$Rev$";

UI.Loki.Options = new Util.Chooser();
UI.Loki.Options._add_bundled = function add_bundled_loki_options() {
	this.add('bold', {
		buttons: [UI.Bold_Button],
		masseuses: [UI.Bold_Masseuse],
		keybindings: [UI.Bold_Keybinding]
	});
	this.add('italic', {
		buttons: [UI.Italic_Button],
		masseuses: [UI.Italic_Masseuse],
		keybindings: [UI.Italic_Keybinding]
	});
	this.add('underline', {
		buttons: [UI.Underline_Button],
		keybindings: [UI.Underline_Keybinding]
	});
	this.add('headings', {
		buttons: [UI.Headline_Button],
		menugroups: [UI.Headline_Menugroup],
		keybindings: []
	});
	this.add('pre', {
		buttons: [UI.Pre_Button]
	});
	this.add('br', {
		buttons: [UI.BR_Button]
	});
	this.add('hr', {
		buttons: [UI.HR_Button],
		masseuses: [UI.HR_Masseuse]
	});
	this.add('clipboard', {
		buttons: [UI.Cut_Button, UI.Copy_Button, UI.Paste_Button],
		menugroups: [UI.Clipboard_Menugroup],
		keybindings: [UI.Cut_Keybinding, UI.Copy_Keybinding, UI.Paste_Keybinding]
	});
	this.add('highlight', {
		buttons: [UI.Highlight_Button]
	});
	this.add('align', {
		// buttons: [UI.Left_Align_Button, UI.Center_Align_Button, UI.Right_Align_Button],
		menugroups: [UI.Align_Menugroup],
		keybindings: [UI.Left_Align_Keybinding, UI.Center_Align_Keybinding, UI.Right_Align_Keybinding]
	});
	this.add('blockquotes', {
		buttons: [UI.Blockquote_Button]
	});
	this.add('lists', {
		buttons: [UI.OL_Button, UI.UL_Button, UI.Indent_Button, UI.Outdent_Button],
		masseuses: [UI.UL_OL_Masseuse]
	});
	this.add('find', {
		buttons: [UI.Find_Button],
		keybindings: [UI.Find_Keybinding]
	});
	this.add('tables', {
		buttons: [UI.Table_Button],
		masseuses: [UI.Table_Masseuse],
		menugroups: [UI.Table_Menugroup]
	});
	this.add('images', {
		buttons: [UI.Image_Button],
		masseuses: [UI.Image_Masseuse],
		double_click_listeners: [UI.Image_Double_Click]
	});
	this.add('links', {
		buttons: [UI.Page_Link_Button],
		menugroups: [UI.Link_Menugroup],
		keybindings: [UI.Page_Link_Keybinding],
		double_click_listeners: [UI.Link_Double_Click]
	});
	this.add('anchors', {
		buttons: [UI.Anchor_Button],
		masseuses: [UI.Anchor_Masseuse],
		menugroups: [UI.Anchor_Menugroup],
		double_click_listeners: [UI.Anchor_Double_Click]
	});
	this.add('cleanup', {
		buttons: [UI.Clean_Button]
	});
	this.add('source', {
		buttons: [UI.Source_Button]
	});
	this.add('debug', {
		buttons: [UI.Raw_Source_Button]
	});
	//this.add('statusbar', true);
	
	// Some of these aliases are for installer sanity, while others are for
	// Loki 1 compatibility.
	this.alias('bold', 'strong');
	this.alias('italic', 'em');
	this.alias('tables', 'table');
	this.alias('images', 'image');
	this.alias('links', 'link');
	this.alias('lists', 'list');
	this.alias('blockquotes', 'blockquote');
	this.alias('anchors', 'anchor');
	this.alias('headings', 'heading');
	this.alias('headings', 'headlines');
	this.alias('headings', 'headline');
	this.alias('br', 'linebreaks');
	this.alias('br', 'linebreak');
	this.alias('find', 'findtext');
	
	this.put_set('default', ['strong', 'em', 'headline', 'br', 'hr',
		'highlight', 'align', 'blockquotes', 'lists', 'find', 'images',
		'links', 'cleanup']);
	this.put_set('power', ['strong', 'em', 'headline', 'br', 'hr', 'pre',
		'clipboard', 'highlight', 'align', 'blockquotes', 'lists',
		'find', 'tables', 'images', 'links', 'anchors', 'cleanup', 'source']);
	this.put_set('developer', ['power', 'debug']);
};
