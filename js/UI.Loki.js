/**
 * Constructs a new instance of Loki. The constructor doesn't actually
 * modify the document at all; for this see replace_textarea.
 * @constructor
 *
 * @class A WYSIWYG HTML editor.
 *
 * @param {object}	settings	Loki settings
 */
UI.Loki = function Loki(settings)
{
	this.owner_document = null;
	
	this.window = null;
	this.document = null;
	this.body = null;
	var hidden_input = null;
	var textarea = null;
	var graphical_wrapper = null;
	this.iframe = null;
	
	if (!settings)
		settings = {};
	this.settings = settings;
	
	var editor_root = null;
	var editor_domain = null;
	
	var capabilities = [];
	var keybinder = new UI.Keybinding_Manager();
	var masseuses = [];
	var toolbar = null;
	var source_toolbar = null;
	
	var dh; // document helper for this.owner_document
	var self = this;
	
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
		this.set_html(textarea.value);
		editor_root.replaceChild(graphical_wrapper, textarea);
		editor_root.removeChild(hidden_input);
		
		switch_toolbar(source_toolbar, toolbar);
		finish_ui_creation();
	}
	
	this.show_source_view = function show_source_view()
	{
		textarea.value = this.get_html();
		editor_root.replaceChild(textarea, graphical_wrapper);
		editor_root.appendChild(hidden_input);
		
		switch_toolbar(toolbar, source_toolbar);
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
		
		this.owner_document = area.ownerDocument;
		dh = new Util.Document(this.owner_document);
		
		create_ui();
		add_capabilities();
		finish_ui_creation();
	}
	
	this.focus = function focus()
	{
		if (this.window)
			this.window.focus();
	}
	
	this.exec_command = function exec_command(command, iface, value)
	{
		if (typeof(command) != 'string')
			throw new TypeError('The "command" parameter must be a string.');
		
		switch (arguments.length) {
			case 0:
				// actually handled by the test above
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
		return this.document.queryCommandState(command);
	}
	
	this.query_command_value = function query_command_value(command)
	{
		if (typeof(command) != 'string')
			throw new TypeError('The "command" parameter must be a string.');
		
		var value = this.document.queryCommandValue(command);
		if (command == 'FormatBlock') {
			var mappings = 
			{
				// IE : Mozilla
				'Normal' : 'p',
				'Formatted' : 'pre',
				'Heading 1' : 'h1',
				'Heading 2' : 'h2',
				'Heading 3' : 'h3',
				'Heading 4' : 'h4',
				'Heading 5' : 'h5',
				'Heading 6' : 'h6',
				'Preformatted' : 'pre',
				'Address' : 'address'
			};
			
			if (mappings[value])
				value = mappings[value];
		}
		
		return value;
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
		
		UI.Capabilities.get(selector).each(function(provider) {
			var cap = new provider(self);
			capabilities.push(cap);
			
			console.log(cap.name);
			
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
	function finish_ui_creation()
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
			
			// Write out a blank document.
			clear_document();
			add_document_style_sheets();
			
			self.body = self.document.getElementsByTagName('BODY')[0];
			Util.Element.set_class_array(self.body,
				settings.body_classes || []);
				
			self.set_html(textarea.value);
			
			Util.Document.make_editable(self.document);
			
			activate_capabilities();
			activate_keybindings();
			activate_contextual_menu();
			trap_form_submission();
		} catch (e) {
			self.show_source_view();
			throw e;
		}
	}
	
	/**
	 * Inform all the capabilities (who want to hear) that the editing document
	 * has been created.
	 * @type void
	 */
	function activate_capabilities()
	{
		capabilities.each(function (c) {
			if (typeof(c.activate) == 'function') {
				c.activate(self.window, self.document);
			}
		})
	}
	
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
	
	function activate_keybindings()
	{
		function evaluate_keypress()
		{
			return keybinder.evaluate(arguments[0] || window.event)
		}
		
		Util.Event.add_event_listener(self.document, 'keypress',
			evaluate_keypress);
	}
	
	function activate_contextual_menu()
	{
		var menu = new UI.Menu(this, 'contextmenu');
		var lock = new Util.Lock('Contextual menu display lock');
		
		function add_groups()
		{
			lock.acquire();
			acquired = true;
			try {
				capabilities.each(function(cap) {
					cap.add_menu_items(menu);
				});
			} catch (e) {
				lock.release();
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
	
	function trap_form_submission()
	{
		function stage_html(ev)
		{
			try {
				hidden_input.value = self.get_html();
			} catch (ex) {
				alert("Loki encountered an error and was unable to translate " +
					"your document into normal HTML.\n\n" + ex);
				return Util.Event.prevent_default(ev);
			}
			
			return true;
		}
		
		if (textarea.form) {
			Util.Event.add_event_listener(textarea.form, 'submit',
				Util.Event.listener(stage_html));
		}
	}
}
