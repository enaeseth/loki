/**
 * Constructs a new instance of Loki. The constructor doesn't actually
 * modify the document at all; for this see replace_textarea.
 * @constructor
 *
 * @class A WYSIWYG HTML editor.
 *
 * @param {object}	settings	Loki settings
 * @see UI.Loki.replace_textarea()
 * @author Eric Naeseth
 * @author Nathanael Fillmore
 */
UI.Loki = function Loki(settings)
{
	Util.OOP.mixin(this, UI.Event_Target);
	
	this.owner_document = null;
	
	this.window = null;
	this.document = null;
	this.body = null;
	var form = null;
	var hidden_input = null;
	var textarea = null;
	var graphical_wrapper = null;
	this.iframe = null;
	
	if (!settings)
		settings = {};
	this.settings = settings;
	
	var editor_root = null;
	var domain = null;
	
	var capabilities = {};
	var context_aware_capabilities = [];
	var keybinder = new UI.Keybinding_Manager();
	var masseuses = [];
	var toolbar = null;
	var source_toolbar = null;
	
	this.bubbler = null;
	
	var dh; // document helper for this.owner_document
	var self = this;
	
	var selection;
	var selected_range;
	
	/**
	 * Returns the HTML of the document currently being edited.
	 *
	 * @type string
	 */
	this.get_html = function get_html()
	{
		unmassage_body();
		
		// Make sure that we don't leave the body unmassaged.
		try {
			clean_body();
			return UI.Clean.clean_HTML(this.get_dirty_html(), settings);
		} finally {
			massage_body();
		}
	}
	
	/**
	 * Returns the (unclean) HTML of the document currently being edited.
	 * @type string
	 */
	this.get_dirty_html = function get_dirty_html()
	{
		return this.body.innerHTML;
	}
	
	/**
	 * Sets the HTML of the document currently being edited.
	 * @type void
	 * @param	{string}	html	The new HTML
	 */
	this.set_html = function set_html(html)
	{
		this.body.innerHTML = html;
		clean_body();
		massage_body();
	}
	
	function clean_body()
	{
		UI.Clean.clean(self.body, settings);
	}
	
	function massage_body()
	{
		self.massage_node_descendants(self.body);
	}
	
	function unmassage_body()
	{
		self.unmassage_node_descendants(self.body);
	}
	
	/**
	 * Runs massage_node_descendants on the node for all of the instance's
	 * masseuses.
	 * @param {Node} node
	 * @type void
	 */
	this.massage_node_descendants = function massage_node_descendants(node)
	{
		masseuses.each(function (m) { m.massage_node_descendants(node); });
	}
	
	/**
	 * Runs unmassage_node_descendants on the node for all of the instance's
	 * masseuses.
	 * @param {Node} node
	 * @type void
	 */
	this.unmassage_node_descendants = function unmassage_node_descendants(node)
	{
		masseuses.each(function (m) { m.unmassage_node_descendants(node); });
	}
	
	function textarea_is_active()
	{
		return (editor_root && textarea.parentNode == editor_root);
	}
	this.textarea_is_active = textarea_is_active; // alias
	
	/**
	 * Gets the domain under which the Loki instance is running.
	 * @type string
	 */
	this.editor_domain = function editor_domain()
	{
		if (!domain)
			domain = Util.URI.extract_domain(window.location);
		return domain;
	}
	
	/**
	 * If the source view is currently active, shows the graphical view;
	 * otherwise shows the wource view.
	 * @type void
	 */
	this.toggle_source_view = function toggle_source_view()
	{
		if (textarea_is_active()) {
			this.show_graphical_view();
		} else {
			this.show_source_view();
		}
	}
	
	function switch_toolbar(old_toolbar, new_toolbar)
	{
		var oe = old_toolbar.get_element();
		var ne = new_toolbar.get_element();
		
		if (oe.parentNode == editor_root) {
			editor_root.replaceChild(ne, oe);
		} else {
			if (oe.parentNode)
				oe.parentNode.removeChild(oe);
			editor_root.insertBefore(ne, graphical_wrapper);
		}
	}
	
	this.show_graphical_view = function show_graphical_view()
	{
		this.dispatch_event(new UI.Event('begin_graphical_view_switch'));
		this.set_html(textarea.value);
		editor_root.replaceChild(graphical_wrapper, textarea);
		if (hidden_input.parentNode != editor_root)
			editor_root.appendChild(hidden_input);
		
		switch_toolbar(source_toolbar, toolbar);
		finish_ui_creation(true);
		this.dispatch_event(new UI.Event('graphical_view_switch'));
	}
	
	this.show_source_view = function show_source_view()
	{
		this.dispatch_event(new UI.Event('begin_source_view_switch'));
		textarea.value = this.get_html();
		editor_root.removeChild(hidden_input);
		editor_root.replaceChild(textarea, graphical_wrapper);
		
		switch_toolbar(toolbar, source_toolbar);
		this.dispatch_event(new UI.Event('source_view_switch'));
	}
	
	/**
	 * Gets a capability instance by its selector name.
	 * Returns undefined if the capability is not available.
	 * @param {string}	name	the selector name of the desired capability
	 * @type UI.Capability
	 */
	this.get_capability = function get_capability(name)
	{
		return capabilities[name];
	}
	
	
	/**
	 * Replaces the given TEXTAREA element with the Loki interface.
	 * @param	{HTMLTextareaElement}	area	The element to replace
	 * @type void
	 */
	this.replace_textarea = function replace_textarea(area)
	{
		if (textarea) {
			// This instance has already replaced some textarea and using it.
			// We can't replace another!
			
			throw new Error('This Loki instance is already using some ' +
				'textarea; cannot also use another!');
		}
		
		textarea = area;
		form = area.form;
		
		this.owner_document = area.ownerDocument;
		dh = new Util.Document(this.owner_document);
		
		create_ui();
		add_capabilities();
		finish_ui_creation(false);
	}
	
	/**
	 * Focuses on the Loki editing window.
	 * @type void
	 */
	this.focus = function focus_on_loki()
	{
		if (this.window)
			this.window.focus();
	}
	
	/**
	 * Gets the current selection object of the Loki editing window.
	 * @type Selection
	 */
	this.get_selection = function get_loki_selection()
	{
		return selection;
	}
	
	/**
	 * Gets the range that is currently selected in the Loki editing window.
	 * @type Range
	 */
	this.get_selected_range = function get_loki_selected_range()
	{
		return selected_range;
	}
	
	this.exec_command = function exec_command(command, iface, value)
	{
		if (typeof(command) != 'string')
			throw new TypeError('The "command" parameter must be a string.');
		
		if (textarea_is_active()) {
			throw new UI.Loki.State_Error('Cannot execute an editing command ' +
				'when the source view is visible.');
		}
		
		switch (arguments.length) {
			case 0:
				// actually handled by the typeof(command) test
				throw new Error();
				break;
			case 1:
				iface = false;
				value = null;
				break;
			case 2:
				value = iface;
				iface = false;
				break;
		}
		
		this.window.focus();
		try {
			this.document.execCommand(command, iface, value);
		} finally {
			this.window.focus();
		}
	}
	
	this.query_command_state = function query_command_state(command)
	{
		if (typeof(command) != 'string')
			throw new TypeError('The "command" parameter must be a string.');
		
		if (textarea_is_active()) {
			throw new UI.Loki.State_Error('Cannot query a command\'s state ' +
				'when the source view is visible.');
		}
		
		return this.document.queryCommandState(command);
	}
	
	var block_value_substitutions = 
	{
		// IE: Mozilla
		'Normal': 'p',
		'Formatted': 'pre',
		'Heading 1': 'h1',
		'Heading 2': 'h2',
		'Heading 3': 'h3',
		'Heading 4': 'h4',
		'Heading 5': 'h5',
		'Heading 6': 'h6',
		'Preformatted': 'pre',
		'Address': 'address'
	};
	this.query_command_value = function query_command_value(command)
	{
		if (typeof(command) != 'string')
			throw new TypeError('The "command" parameter must be a string.');
			
		if (textarea_is_active()) {
			throw new UI.Loki.State_Error('Cannot query a command\'s value ' +
				'when the source view is visible.');
		}
		
		var value = this.document.queryCommandValue(command);
		
		return (command == 'FormatBlock')
			? (block_value_substitutions[value] || value)
			: value;
	}
	
	/**
	 * If the selected block is not formatted as the specified tag, format it as
	 * such; otherwise format it as a normal paragraph.
	 *
	 * @param {string}	tag	the tag name corresponding to how the block should
	 *						be formatted
	 * @type void
	 */
	this.toggle_block = function toggle_block(tag)
	{
		if (typeof(tag) != 'string')
			throw new TypeError('The "tag" parameter must be a string.');
		
		var block = (this.query_command_value('FormatBlock') != tag)
			? '<' + tag + '>'
			: '<p>';
		
		this.exec_command('FormatBlock', block);
	}
	
	/**
	 * Formats a block as a list of the given type if it's not so, and
	 * if it is so, formats it as a normal paragraph. This is
	 * necessary because in Mozilla, if a block is already formatted
	 * as a list, the Insert[Un]orderedList commands simply remove the
	 * block's block-level formatting, rather than changing it to a
	 * paragraph.
	 *
	 * @param {string}	tag	the tag name corresponding to how you want
	 *						the block to be formatted. See mappings variable 
	 *						inside the function
	 * @type void
	 */
	this.toggle_list = function toggle_list(tag)
	{
		var command;
		
		if (typeof(tag) != 'string')
			throw new TypeError('The "tag" parameter must be a string.');
		
		switch (tag.toLowerCase()) {
			case 'ol':
				command = 'InsertOrderedList';
				break;
			case 'ul':
				command = 'InsertUnorderedList';
				break;
			default:
				throw new Error('Unknown/unsupported list tag "' + tag + '".');
		}
		
		if (this.query_command_state(command)) {
			this.exec_command(command); // Turns off the list.
			this.toggle_block('p');
		} else {
			this.exec_command(command); // Turns on the list.
		}
	}
	
	function add_capabilities()
	{
		// Initialize editing capabilities
		
		var selector = settings.capabilities || 'default';
		var providers = UI.Capabilities.get(selector);
		
		Util.Object.enumerate(providers, function(key, provider) {
			var cap = new provider(self);
			capabilities[key] = cap;
			
			// Context awareness
			if (cap._is_context_aware())
				context_aware_capabilities.push(cap);
			
			// Keybindings
			cap.keybindings.each(function (binding) {
				var action = binding.action;
				if ('string' == typeof(action)) // Method name given
					action = cap[action];
				
				keybinder.bind(binding.test, action, cap);
			});
			
			// Toolbar items
			[
				[cap.toolbar_items, toolbar],
				[cap.source_toolbar_items, source_toolbar]
			].each(function (p) {
				p[0].each(function(item) {
					p[1].add_item(item);
				})
			});
			
			// Masseuses
			masseuses.append(cap.masseuses);
		});
	}
	
	function create_ui()
	{
		Util.Document.append_style_sheet(self.owner_document,
			(settings.base_uri || '') + 'css/Loki.css');
		
		editor_root = dh.create_element('div', {className: 'loki'});
		
		[
			function create_toolbars()
			{
				toolbar = new UI.Toolbar(self);
				source_toolbar = new UI.Toolbar(self);

				return toolbar.get_element();
			},
			
			function create_iframe()
			{				
				graphical_wrapper = self.iframe = dh.create_element('iframe', {
					src: (settings.base_uri || '') + 'auxil/loki_blank.html',
					frameBorder: 0, // IE adds an extra border w/o this
					style: {
						height: textarea.clientHeight + 'px'
					}
				});
				
				// XXX: Why was this wrapped in a table? -EN
				/*var wrapper = dh.create_element('table',
					{className: 'iframe_wrapper'},
					[dh.create_element('tbody', {},
						[dh.create_element('tr', {}, 
							[dh.create_element('td', {}, [iframe])])])]);*/
				
				return graphical_wrapper;
			},
			
			function create_grippy()
			{
				var grippy = dh.create_element('img', {
					className: 'grippy',
					src: (settings.base_uri || '') + 'images/grippy.gif'
				});
				
				var wrapper = dh.create_element('div',
					{className: 'grippy_wrapper'},
					[grippy]);
					
				var resize_mask = dh.create_element('div', {
					style: {
						position: 'absolute',
						box: [0, 0, 20000],
						background: 'transparent',
						zIndex: 10000
					}
				});
				
				var orig_coords = null;
				var receivers = [self.owner_document, self.document];
				var listeners = null; // filled in below
				
				function adjust_height(delta)
				{
					var current_height = (textarea_is_active())
						? textarea.clientHeight
						: graphical_wrapper.clientHeight;
					
					textarea.style.height = graphical_wrapper.style.height =
						(current_height + delta) + 'px';
				}
				
				function start_resize()
				{
					var event = arguments[0] || window.event;
					
					orig_coords = Util.Event.get_coordinates(event);
					
					receivers.each(function(r) {
						if (r) {
							for (var event_name in listeners) {
								Util.Event.add_event_listener(r, event_name,
									listeners[event_name]);
							}
						}
					});
					
					if (!Util.Browser.IE) // XXX: why is this test here?
						self.owner_document.body.appendChild(resize_mask);
					
					return Util.Event.prevent_default(event);
				}
				
				function resize()
				{
					// XXX: Live resizing? (Issue 7)
					return Util.Event.prevent_default(arguments[0] ||
						window.event);
				}
				
				function stop_resize()
				{
					var event = arguments[0] || window.event;
					
					if (!Util.Browser.IE) // XXX: why is this test here?
						self.owner_document.body.removeChild(resize_mask);
						
					var coords = Util.Event.get_coordinates(event);
					adjust_height(coords.y - orig_coords.y);
						
					receivers.each(function(r) {
						if (r) {
							for (var event_name in listeners) {
								Util.Event.remove_event_listener(r, event_name,
									listeners[event_name]);
							}
						}
					});
					
					orig_corrds = null;
					return Util.Event.prevent_default(event);
				}
				
				listeners = {
					'mousemove': resize,
					'mouseup': stop_resize
				}
				
				Util.Event.add_event_listener(grippy, 'mousedown',
					start_resize);
				
				return wrapper;
			},
			
			function create_hidden()
			{
				hidden_input = dh.create_element('input', {type: 'hidden'});
				
				['name', 'value'].each(function (name) {
					var value = textarea.getAttribute(name);
					if (value)
						hidden_input.setAttribute(name, value);
				});
				
				return hidden_input;
			}
		].each(function (component_adder) {
			var res = component_adder();
			if (res)
				editor_root.appendChild(res);
		});
		
		textarea.parentNode.replaceChild(editor_root, textarea);
	}
	
	/**
	 * Performs all initializations that have to be done after the IFRAME's
	 * window and document are available.
	 */
	function finish_ui_creation(switching_from_source)
	{
		try {
			var iframe = self.iframe;
			var ready = (iframe && iframe.contentWindow &&
				iframe.contentWindow.document &&
				iframe.contentWindow.document.location);
			
			if (!ready) {
				// Try again in a bit.
				finish_ui_creation.defer();
				return;
			}
			
			self.window = iframe.contentWindow;
			self.document = self.window.document;
			
			if (!self.bubbler)
				self.bubbler = new UI.Bubble_Manager(self);
			
			// Write out a blank document.
			clear_document();
			add_document_style_sheets();
			
			self.body = self.document.getElementsByTagName('BODY')[0];
			Util.Element.set_class_array(self.body,
				settings.body_classes || []);
				
			selection = Util.Selection.get_selection(iframe.contentWindow);
			
			Util.Document.make_editable(self.document);
			activate_capabilities(switching_from_source);
			
			self.set_html(textarea.value);
			
			activate_keybindings();
			activate_contextual_menu();
			trap_form_submission();
			setup_document_and_selection();
			
			listen_for_special_keys();
			listen_for_mouse_context_changes(switching_from_source);
		} catch (e) {
			// If we were unable to fully create the Loki WYSIWYG GUI, show the
			// HTML source view instead.
			try {
				self.show_source_view();
			} catch (desperation) {
				// If even that doesn't work, revert all the way back to having
				// the original textarea without any of our UI.
				editor_root.parentNode.replaceChild(textarea, editor_root);
				// Don't throw this inner exception; just throw the original
				// reason why the UI couldn't be created.
			}
			
			throw e;
		}
	}
	
	/**
	 * Inform all the capabilities (who want to hear) that the editing document
	 * has been created.
	 * @type void
	 */
	function activate_capabilities(switching_from_source)
	{
		Util.Object.enumerate(capabilities, function(k, c) {
			if (typeof(c.activate) == 'function') {
				c.activate(!switching_from_source, self.window, self.document);
			}
		});
	}
	
	/*
	 * Creates the initial HTML document structure for the editing document.
	 */
	function clear_document()
	{
		var doc = self.document;
		doc.open();
		doc.write('<!DOCTYPE html PUBLIC \n\t' +
			'"-//W3C//DTD XHTML 1.0 Transitional//EN"\n\t' +
			'"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n\n' +
			'<html><head><title></title></head><body></body></html>');
		doc.close();
	}
	
	/*
	 * Adds the internal Loki document stylesheet and any stylesheets requested
	 * by the Loki installer.
	 */
	function add_document_style_sheets()
	{
		var add = Util.Document.append_style_sheet.curry(self.document);
		var base = settings.base_uri || '';
		
		add(base + 'css/cssSelector.css');
		if (!Util.Browser.IE)
			add(base + 'css/cssSelector_gecko.css');
		
		add(base + 'css/Loki_Document.css');
		
		
		(settings.document_style_sheets || []).each(function (sheet) {
			add(sheet);
		});
	}
	
	/*
	 * Connects the keybinder to actual keyboard events in the Loki editing
	 * document.
	 */
	function activate_keybindings()
	{
		function evaluate_key_press()
		{
			return keybinder.evaluate(arguments[0] || window.event)
		}
		
		// If this suddenly breaks under Safari and other WebKit-based
		// browsers for shortcut keys, see the WebKit development mailing list
		// (http://lists.webkit.org/pipermail/webkit-dev/). There were many
		// changes to key event handling on WebKit releases after the Safari 3
		// release on Mac OS X 10.5, and they were considering changing the
		// handling of application-defined shortcuts from keypress to keydown.
		// If this broke, perhaps they did.
		Util.Event.add_event_listener(self.document, 'keypress',
			evaluate_key_press);
	}
	
	/*
	 * Adds the necessary listeners for creating the Loki contextual menu.
	 */
	function activate_contextual_menu()
	{
		var menu = new UI.Menu(self, 'contextmenu');
		var lock = new Util.Lock('Contextual menu display lock');
		
		function add_groups()
		{
			lock.acquire();
			try {
				Util.Object.enumerate(capabilities, function(k, cap) {
					cap.add_menu_items(menu);
				});
			} catch (e) {
				lock.release();
				return false;
			}
			
			return true;
		}
		
		function clear_menu()
		{
			try {
				menu.clear();
			} finally {
				lock.release();
			}
		}
		
		menu.use_as_contextual(self.document, add_groups, clear_menu,
			editor_root);
	}
	
	/*
	 * Loki creates a hidden input element on the original <textarea>'s form
	 * into which it places the HTML when the form is submitted. To do this, it
	 * must respond to the form's submit event. This method adds an appropriate
	 * event listener.
	 */
	function trap_form_submission()
	{
		function stage_html(ev)
		{
			self.dispatch_event(new UI.Event('submit'));
			try {
				hidden_input.value = self.get_html();
			} catch (ex) {
				// If an exception occured in get_html, it almost certainly
				// occurred during the cleanup process, and we're stuck in a
				// quagmire because we can't submit the document. It could
				// (and probably does) contain Loki-specific tags and attributes
				// that would first need to be cleaned up. All we can really do
				// is trap the form error and block the form submission.
				
				alert("Loki encountered an error and was unable to translate " +
					"your document into normal HTML.\n\n" + ex);
				Util.Event.prevent_default(ev);
				throw ex;
			}
			
			return true;
		}
		
		if (form) {
			Util.Event.observe(form, 'submit', stage_html);
		}
	}
	
	function setup_document_and_selection()
	{
		var body = self.body;
		
		function create_initial_paragraph()
		{
			var p = self.document.createElement('P');
			var text = self.document.createTextNode('');
			p.appendChild(text);
			body.insertBefore(p, body.firstChild);
			return text;
		}
		
		function find_target()
		{
			var queue = [body];
			var node;
			
			while (node = queue.shift()) { // assignment intentional
				if (node.nodeType == Util.Node.TEXT_NODE)
					return node;
				
				if (node.hasChildNodes()) {
					queue.append(node.childNodes);
				}
			}
			
			// still nothing? try finding paragraphs
			var paras = self.document.getElementsByTagName('P');
			node = self.document.createTextNode('');
			if (paras && paras.length) {
				var p = paras[0];
				p.insertBefore(node, p.firstChild);
			} else {
				// no paragraphs? last resort
				body.insertBefore(node, body.firstChild);
			}
			
			return node;
		}
		
		var target = (!body.hasChildNodes())
			? create_initial_paragraph()
			: find_target();
		
		var range;
		if (Util.is_function(self.document.createRange)) {
			range = self.document.createRange();
			range.setStart(target, 0);
			range.collapse(true);
		} else if (Util.is_function(body.createTextRange)) {
			range = body.createTextRange();
			range.moveToElementText(target.parentNode);
			range.collapse(true);
		}
		
		if (range) {
			Util.Selection.select_range(selection, range);
			selected_range = Util.Range.create_range(selection);
		}
	}
	
	/*
	 * Traps the keyboard events that could possibly result in context changes,
	 * paragraph formation, or insertion or deletion of text or elements.
	 * Raises UI.Key_Event events for the special keydown events.
	 */
	function listen_for_special_keys()
	{
		function default_action(event)
		{
			UI.Special_Key_Handler.handle_event(event);
		}
		
		UI.Key_Event.translate(self.document, self, default_action,
			context_changed);
	}
	
	/*
	 * Traps events caused by the user changing the document selection with the
	 * mouse raises a context change notification. Context changes caused by the
	 * keyboard are dealt with in listen_for_special_keys.
	 */
	function listen_for_mouse_context_changes(switching_from_source)
	{
		// Listen for mouseup to catch the carat being moved 
		['mousedown', 'mouseup'].each(function register_cc_listener(ev_type) {
			Util.Event.observe(self.document, 'mouseup', handle_user_activity);
		});
		
		if (!switching_from_source) {
			self.window.focus();
			handle_user_activity(null);
			context_changed.delay(.05 /* 50ms */);
		}
	}
	
	/*
	 * Responds to a change (or possible change) in the selection / carat
	 * position in the editing document.
	 */
	function handle_user_activity(event)
	{
		// Retrieve the currently selected range. We must do this here
		// because of a fact about Safari (at least Safari/Mac): when the
		// editing document does not have focus, we cannot access its
		// selection in any meaningful way; we can't get the anchor or focus
		// nodes or access any ranges. To work around this, we use the new
		// design of Loki that caches the selection and range to our
		// advantage: we retrieve the selected range in this event
		// listener when we know that the editing window has focus.
		
		selected_range = Util.Range.create_range(selection);
		
		if (event)
			context_changed(event);
	}
	
	/**
	 * Informs all interested capabilities that the Loki editing context
	 * was changed. This function should be called whenever the context changes.
	 * @type void
	 * @method
	 */
	function context_changed()
	{
		var len = context_aware_capabilities.length;
		for (var i = 0; i < len; i++) {
			context_aware_capabilities[i].context_changed();
		}
	}
	
	// Alias
	this.context_changed = context_changed;
	
	/**
	 * @ignore
	 */
	this.toString = function loki_to_string()
	{
		return "Loki editor for " + (area.id || area.name);
	}
	
	/**
	 * @ignore
	 */
	this.toSource = function loki_to_source()
	{
		return "(new UI.Loki(" + settings.toSource() + "))";
	}
}

/**
 * @class Indicates that Loki was not in a state appropriate for a certain
 * action.
 * @constructor
 * @extends Error
 */
UI.Loki.State_Error = function StateError(message)
{
	Util.OOP.inherits(this, Error, mesasge);
	this.name = 'UI.Loki.State_Error';
}
