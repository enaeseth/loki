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
	var _html_generator = null;

	var self = this;


	/**
	 * Returns the (cleaned-up) HTML of the document currently being edited.
	 *
	 * @returns {String} the HTML of the document currently being edited.
	 */
	this.get_html = function()
	{
		var html;
		
		_unmassage_body();
		UI.Clean.clean(_body, _settings);
		if (_html_generator)
			html = _html_generator.generate(_body.childNodes);
		else
			html = _body.innerHTML;
		html = UI.Clean.clean_HTML(html, _settings);
		_massage_body();
		return html;
	};

	this.get_dirty_html = function()
	{
		return _body.innerHTML;
	};

	/**
	 * Sets the HTML of the document.
	 *
	 * @param	html	the HTML of the document
	 */
	this.set_html = function(html)
	{
		_body.innerHTML = html;
		UI.Clean.clean(_body, _settings);
		_massage_body();
	};

	/**
	 * Copies the value of the iframe to the value of the textarea.
	 */
	this.copy_iframe_to_hidden = function()
	{
		_hidden.value = self.get_html();
	};

	/**
	 * Returns whether the textarea (vs the editable iframe)
	 * is currently active.
	 */
	var _is_textarea_active = function()
	{
		return _textarea.parentNode == _root;
	};

	/**
	 * Toggles textarea and iframe.
	 */
	this.toggle_iframe_textarea = function()
	{
		if ( _is_textarea_active() )
		{
			self.textarea_to_iframe();
		}
		else
		{
			self.iframe_to_textarea();
		}
	};
	
	/**
	 * Shows textarea instead of iframe.
	 */
	this.iframe_to_textarea = function()
	{
		_textarea.value = self.get_html(); // this runs the cleaning code
		_root.replaceChild(_textarea, _iframe_wrapper);
		_root.removeChild(_hidden);

		// recreate the toolbars before swapping in the new one,
		// in order to get rid of any lingering "hover"-class'd buttons.
		old_toolbar = _toolbar;
		_create_toolbars(); 
		_root.replaceChild(_textarea_toolbar, old_toolbar);
		_textarea.focus();
	};

	/**
	 * Shows iframe instead of textarea.
	 */
	this.textarea_to_iframe = function()
	{
		self.set_html(_textarea.value);
		_root.replaceChild(_iframe_wrapper, _textarea);
		_root.appendChild(_hidden);
		_init_async();

		// recreate the toolbars before swapping in the new one,
		// in order to get rid of any lingering "hover"-class'd buttons.
		old_toolbar = _textarea_toolbar;
		_create_toolbars();
		_root.replaceChild(_toolbar, old_toolbar);
		_window.focus();
	};
	
	function enumerate_options(property) {
		var key, results = [];
		
		if (_options) {
			for (key in _options) {
				if (!property)
					results.append(_options[key]);
				else if (_options[key][property])
					results.append(_options[key][property]);
			}
		}
		
		return results;
	}
	
	/**
	 * Sets focus to the editing window.
	 * @return {void}
	 */
	this.focus = function focus_on_loki()
	{
		var doc = _owner_document;
		
		if (_is_textarea_active()) {
			if ((!doc.hasFocus || doc.hasFocus()) && _textarea == doc.activeElement)
				return;
			_textarea.focus();
		} else if (!_window) {
			throw new Error('Invalid Loki state: cannot focus; Loki window ' +
				'does not yet exist.');
		} else if (Util.Browser.IE) {
			_body.setActive();
			_window.focus();
		} else {
			_window.focus();
		}
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
		if (!(Util.Browser.IE || Util.Browser.Gecko)) {
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
		self.options = _options = UI.Loki.Options.get(_settings.options || 'default', true);
		_settings.options = _options;
		
		['site', 'type'].each(function cleanup_default_regexp(which) {
			var setting = 'default_' + which + '_regexp';
			if (!_settings[setting])
				return;
			if (!(_settings[setting].exec && _settings[setting].test)) {
				_settings[setting] = new RegExp(_settings[setting]);
			}
		});
		
		if (!_settings.base_uri) {
			_settings.base_uri = autodetect_base_uri();
		}
		
		if (!_settings.allowable_inline_styles) {
			_settings.allowable_inline_styles = default_allowed_styles();
		}
		
		if (!_settings.html_generator || _settings.html_generator == 'default')
			_settings.html_generator = 'browser';
		else
			_settings.html_generator = _settings.html_generator.toLowerCase();
			
		if (_settings.html_generator == 'loki') {
			_html_generator = new Util.HTML_Generator({
				xhtml: _settings.use_xhtml || false,
				indent_text: "    "
			});
		} else if (_settings.html_generator != 'browser') {
			throw new Error('Unknown HTML generator "' +
				_settings.html_generator + '"; cannot instantiate Loki.');
		}
		
		UI.Clipboard_Helper._setup(_settings.base_uri);
		
		_textarea = textarea;
		_owner_window = window;
		_owner_document = _textarea.ownerDocument;

		_use_p_hacks = _use_p_hacks();

		// Create the various elements
		_create_root();
		_create_toolbars();
		_create_iframe();
		if ( _options.statusbar )
			_create_statusbar();
		_create_grippy();
		_create_hidden();

		// And append them to root
		_root.appendChild( _toolbar );
		_root.appendChild( _iframe_wrapper );
		if ( _options.statusbar )
			_root.appendChild( _statusbar );
		_root.appendChild( _grippy_wrapper );
		_root.appendChild( _hidden );

		// Replace the textarea with root
		_replace_textarea();

		// Append style sheets
		_append_owner_document_style_sheets();

		// Add document massagers
		_add_masseuses();

		// Init possible menugroups, for the context menu
		_init_menugroups();

		// Continue the initialization, but asynchronously
		_init_async();
		
		return self;
	};
	
	/*
	 * Attempts to automatically detect the Loki base URI.
	 */
	function autodetect_base_uri()
	{
		var scripts = document.getElementsByTagName('SCRIPT');
		var pattern = /\bloki\.js(\?[^#]*)?(#\S+)?$/;
		
		for (var i = 0; i < scripts.length; i++) {
			if (pattern.test(scripts[i].src)) {
				// Found Loki!
				return scripts[i].src.replace(pattern, '');
			}
		}
		
		throw new Error("Unable to automatically determine the Loki base URI." +
			" Please set it explicitly.");
	}
	
	function default_allowed_styles()
	{
		var builtin = ['text-align', 'vertical-align', 'float', 'direction',
			'display', 'clear', 'list-style'];
		
		return builtin;
	}

	/**
	 * Finishes initializing instance variables, but does so
	 * asynchronously. All initing that requires _window or _document
	 * to be available should be done in this function, because this
	 * function waits until _window and _document are available to do
	 * anything.
	 */
	var _init_async = function()
	{
		try
		{
			// Try to init references to iframe content's window and
			// document ...
			try
			{
				_window = _iframe.contentWindow;
				_document = _window.document;
				if ( _window == null || _document == null )
					throw(new Error('UI.Loki._init_iframe: Couldn\'t init iframe. Will try again.'));
			}
			// ... but if the window or document aren't available yet
			// (because the 'about:blank' document hasn't finished
			// loading), try again in a few milliseconds.
			//
			// Be sure that if you change the name of the present
			// function, you also change what you call in setTimeout
			// below.
			catch(f)
			{
				setTimeout(_init_async, 10);
				return;
			}

			// Do things that require _window or _document

			// Write out a blank document
			_clear_document();

			_document.close();

			// Append style sheets for the iframe
			_append_document_style_sheets();

			// Init reference to that document's body
			_body = _document.getElementsByTagName('BODY').item(0);
			Util.Element.add_class(_body, 'contentMain'); // so front-end stylesheets work

			// Add public members // XXX the private ones should just be replaced to public ones
			self.window = _window;
			self.document = _document;
			self.body = _body;
			self.owner_window = _owner_window;
			self.owner_document = _owner_document;
			self.root = _root;
			self.iframe = _iframe;
			self.hidden = _hidden;
			self.settings = _settings;
			self.exec_command = _exec_command;
			self.query_command_state = _query_command_state;
			self.query_command_value = _query_command_value;
			
			// Set body's html to textarea's value
			self.set_html( _textarea.value );

			// Make the document editable
			_make_document_editable();

			// Add certain event listeners to the document and elsewhere
			_add_double_click_listeners();
			_add_document_listeners();
			_add_state_change_listeners();
			_add_grippy_listeners();

			// Add keybindings
			_add_keybindings();
		}
		catch(e)
		{
			// If anything goes wrong during initialization, first
			// revert to the textarea before re-throwing the error
			try {
				self.iframe_to_textarea();
			} catch (desperation) {
				// If even that doesn't work, go all the way back.
				_root.parentNode.replaceChild(_textarea, _root);
			}
			
			throw e;
		}
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
	 *
	 */
	var _use_p_hacks = function()
	{
		return navigator.product == 'Gecko';
	};

	/**
	 * Creates the root element for Loki.
	 */
	var _create_root = function()
	{
		_root = _owner_document.createElement('DIV');
		Util.Element.add_class(_root, 'loki');
	};

	/**
	 * Creates the toolbar, populated with the appropriate buttons.
	 */
	var _create_toolbars = function()
	{
		// Create the toolbar itself
		_toolbar = _owner_document.createElement('DIV');
		_textarea_toolbar = _owner_document.createElement('DIV');
		Util.Element.add_class(_toolbar, 'toolbar');
		Util.Element.add_class(_textarea_toolbar, 'toolbar');

		// Function to add a button to a the toolbars
		function add_button(button_class)
		{
			var b = new button_class();
			b.init(self);

			function create_button()
			{
				var button = _owner_document.createElement('A'), img, img_src;
				button.href = 'javascript:void(0);';

				Util.Event.add_event_listener(button, 'mouseover', function() { Util.Element.add_class(button, 'hover'); });
				Util.Event.add_event_listener(button, 'mouseout', function() { Util.Element.remove_class(button, 'hover'); });
				Util.Event.add_event_listener(button, 'mousedown', function() { Util.Element.add_class(button, 'active'); });
				Util.Event.add_event_listener(button, 'mouseup', function() { Util.Element.remove_class(button, 'active'); });
				Util.Event.add_event_listener(button, 'click', function() { b.click_listener(); });

				img_src = _settings.base_uri + 'images/toolbar/' + b.image;

				// Apply PNG fix.
				if (Util.Browser.IE && /MSIE 6/.test(navigator.userAgent)) {
					button.title = b.title;
					img = _owner_document.createElement('SPAN');
					img_src = Util.URI.build(Util.URI.normalize(img_src));
					img.className = 'loki_filtered_button';
					img.style.filter = "progid:" +
						"DXImageTransform.Microsoft.AlphaImageLoader(src='" +
					    img_src + "', sizingMethod='image')";
					img.setAttribute('unselectable', 'on');
				} else {
					img = _owner_document.createElement('IMG');
					img.src = img_src;
					img.title = b.title;
					img.border = 0;
					img.setAttribute('unselectable', 'on')
				}
				
				button.appendChild(img);
				return button;
			};

			_toolbar.appendChild(create_button());
			if ( b.show_on_source_toolbar == true )
				_textarea_toolbar.appendChild(create_button());
		};

		// Add each button to the toolbars
		enumerate_options('buttons').each(add_button);
	};

	/**
	 * Creates the iframe
	 */
	var _create_iframe = function()
	{
		// EN: why wrap it in a table?
		_iframe_wrapper = _owner_document.createElement('TABLE');
		var tbody = _owner_document.createElement('TBODY');
		var tr = _owner_document.createElement('TR');
		var td = _owner_document.createElement('TD');
		tr.appendChild(td);
		tbody.appendChild(tr);
		_iframe_wrapper.appendChild(tbody);
		Util.Element.add_class(_iframe_wrapper, 'iframe_wrapper');

		_iframe = _owner_document.createElement('IFRAME');
		_iframe.src = 'javascript:""';
		_iframe.frameBorder = '0'; // otherwise, IE puts an extra border around the iframe that css cannot erase

		td.appendChild(_iframe);

		// Take styles from textarea
		var h = _textarea.clientHeight;
		//_set_height(h);
		// We also need to try again in a second, because in some 
		// versions of FF (e.g. 1.0.6 on win, and some on mac), 
		// the above doesn't work
		setTimeout( function () { _set_height(h); }, 1000 );
		//_set_width(_textarea.clientWidth); // XXX you should check here whether it's width = 100% (or another percentage), then actually copy that; otherwise you can base the new width on clientWidth as here.
	};

	/**
	 * Creates the statusbar
	 */
	var _create_statusbar = function()
	{
		_statusbar = _owner_document.createElement('DIV');
		Util.Element.add_class(_statusbar, 'statusbar');
	};

	/**
	 * Creates the grippy
	 */
	var _create_grippy = function()
	{
		// Actually create the elem
		_grippy_wrapper = _owner_document.createElement('DIV');
		Util.Element.add_class(_grippy_wrapper, 'grippy_wrapper');
		_grippy = _owner_document.createElement('IMG');
		_grippy.src = _settings.base_uri + 'images/grippy.gif';
		Util.Element.add_class(_grippy, 'grippy');
		_grippy_wrapper.appendChild(_grippy);
		//_grippy.innerHTML = 'grippy';
	};

	/**
	 * Adds listeners to make the grippy actually resize the document.
	 */
	var _add_grippy_listeners = function()
	{
		var orig_coords;
		Util.Event.add_event_listener(_grippy, 'mousedown', start_resize);

		// The point of this resize mask is to catch the mouseups with _owner_document,
		// not the iframe's _document, because the coordinates returned when the mouseup is in
		// the iframe's _document, the returned coordinates are buggy in Gecko. If we figure out
		// how to calculate those coordinates accurately--I'm pretty sure it is possible, just
		// tricky--we could remove this resize_mask code.
		var resize_mask = _owner_document.createElement('DIV');
		resize_mask.setAttribute('style', 'position: absolute; top: 0px; left: 0px; height: 20000px; width: 20000px; background: transparent; z-index: 10000;');

		function start_resize(event)
		{
			event = event == null ? window.event : event;
			orig_coords = prev_coords = determine_coords(event);
			Util.Event.add_event_listener(_owner_document, 'mousemove', resize);
			Util.Event.add_event_listener(_owner_document, 'mouseup', stop_resize);
			Util.Event.add_event_listener(_document, 'mousemove', resize);
			Util.Event.add_event_listener(_document, 'mouseup', stop_resize);

			if ( !Util.Browser.IE ) // XXX bad
				_owner_document.documentElement.appendChild(resize_mask);

			return Util.Event.prevent_default(event);
		}
		function resize(event)
		{
			event = event == null ? window.event : event;
			return Util.Event.prevent_default(event);
		}
		function stop_resize(event)
		{
			event = event == null ? window.event : event;

			if ( !Util.Browser.IE ) // XXX bad
				_owner_document.documentElement.removeChild(resize_mask);

			var coords = determine_coords(event);
			//_iframe_wrapper.style.height = _iframe_wrapper.clientHeight + ( coords.y - orig_coords.y ) + 'px';
			_set_height(_get_height() + (coords.y - orig_coords.y));

			Util.Event.remove_event_listener(_owner_document, 'mousemove', resize);
			Util.Event.remove_event_listener(_owner_document, 'mouseup', stop_resize);
			Util.Event.remove_event_listener(_document, 'mousemove', resize);
			Util.Event.remove_event_listener(_document, 'mouseup', stop_resize);
			orig_coords = null;

			return Util.Event.prevent_default(event);
		}
		function determine_coords(event)
		{
			//// Modified from the _show_contextmenu function below.
			//// XXX: Maybe combine this code with that slightly different
			//// code into a fxn in Util.Event, if it's not too difficult.
			//
			// Determine coordinates
			// (Code modified from TinyMCE.)
			var x, y;
			if ( event.pageX != null ) // Gecko
			{
				// If the event is fired from within the iframe,
				// add iframe's position to the reported position.
				var pos;
				var target = Util.Event.get_target(event);
				if ( target.ownerDocument == _document )
					pos = Util.Element.get_position(_iframe);
				else
					pos = { x : 0, y : 0 };

				var body = _owner_document.body;
				/// works, sort of:
				//x = pos.x + (event.clientX - body.scrollLeft);
				//y = pos.y + (event.clientY - body.scrollTop);
				x = pos.x + event.pageX;
				y = pos.y + event.pageY;
			}
			else // IE
			{
				/// works, sort of:
				x = event.screenX + 2;
				y = event.screenY + 2;
				////x = event.clientX + body.scrollLeft.
				////x = event.clientY + body.scrollTop;
			}
			return { x : x, y : y };
		}
	};

	/**
	 * This sets the height of both the possibly editable areas, whether
	 * the textarea or iframe.
	 */
	var _set_height = function(new_height)
	{
		if ( new_height > 40 )
			_iframe_wrapper.style.height = _textarea.style.height = new_height + 'px';
	};

	/**
	 * This gets the height of the actually editable area, whether
	 * the textarea or iframe (their heights should always be the same,
	 * but whichever is not currently in the document hierarchy will have
	 * its height reported incorrectly).
	 */
	var _get_height = function()
	{
		return (_is_textarea_active() ? _textarea : _iframe_wrapper).clientHeight;
	};

	/**
	 * This sets the width of both the possibly editable areas, whether
	 * the textarea or iframe.
	 */
	var _set_width = function(new_width)
	{
		if ( new_width > 40 )
		{
			_iframe_wrapper.style.width = _textarea.style.width = new_width + 'px';
			_root.style.width = new_width + 2 + 'px'; // XXX what this number should be changes depending on style sheet..
		}
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
		Util.Document.append_style_sheet(_owner_document, _settings.base_uri + 'css/Loki.css');
	};

	/**
	 * Append style sheets to format the innards of the loki iframe
	 */
	var _append_document_style_sheets = function()
	{
		var add = Util.Document.append_style_sheet.curry(_document);
		
		add((_settings.base_uri || '') + 'css/Loki_Document.css');
		
		(_settings.document_style_sheets || []).each(function (sheet) {
			add(sheet);
		});
	};
	
	/**
	 * Write out blank document. The key here is that we *close*
	 * the document. That way, we don't have to wait for any more
	 * load events, dealing with which is exceedingly annoying due
	 * to cross-browser issues. Cf note in Util.Window.open.
	 */
	var _clear_document = function()
	{
		var html = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"\n'+
			'\t"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n'+
			'<html>\n\t<head xmlns="http://www.w3.org/1999/xhtml">\n'+
			'\t<title>Loki editing document</title>\n</head>\n'+
			'<body></body>\n</html>';
			
		_document.open();
		_document.write(html);
		_document.close();
	};

	/**
	 * Make the document editable. Mozilla doesn't support
	 * contentEditable. Both IE and Mozilla support
	 * designMode. However, in IE if designMode is set on an iframe's
	 * contentDocument, the iframe's ownerDocument will be denied
	 * permission to access it (even if otherwise it *would* have
	 * permission). So for IE we use contentEditable, and for Mozilla
	 * designMode.
	 */
	var _make_document_editable = function()
	{
		if (Util.Browser.IE) {
			_body.contentEditable = true;
			try {
				// If the document isn't really editable, this will throw an
				// error. If the document is editable, this is perfectly
				// harmless.
				_query_command_state('Bold');
			} catch (e) {
				throw new Util.Unsupported_Error('rich text editing');
			}
		} else {
			_document.designMode = 'On';
			try {
				_document.execCommand('undo', false, null);
				_document.execCommand('useCSS', false, true);
			} catch (e) {
				throw new Util.Unsupported_Error('rich text editing');
			}
		}
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
		
		enumerate_options('masseuses').each(add_masseuse);
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
		
		enumerate_options('double_click_listeners').each(add);
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
		
		var message = ex.message || ex.toString();
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
		
		if ( _options.statusbar )
		{
			Util.Event.add_event_listener(_document, 'keyup', function() { _update_statusbar(); });
			Util.Event.add_event_listener(_document, 'click', function() { _update_statusbar(); });
			Util.Event.add_event_listener(_toolbar, 'click', function() { _update_statusbar(); });
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
				alert("An error occurred that prevented your document from " +
					"being safely submitted.\n\nTechnical details:\n" +
					self.describe_error(ex));
				Util.Event.prevent_default(ev);
				
				if (typeof(console) == 'object' && console.firebug) {
					console.error('Failed to generate HTML:',
						ex);
					throw ex;
				}
				
				return false;
			}
			
			return true;
		}
		
		
		// this copies the changes made in the iframe back to the hidden form element
		Util.Event.add_event_listener(_hidden.form, 'submit',
			Util.Event.listener(submit_handler));
	};

	/**
	 * Add listeners to all events which might change the state of the
	 * window (e.g., change where the current selection is in the
	 * document tree). This is useful for updating the toolbar
	 * (updating which buttons appear depressed) and the statusbar.
	 *
	 * The listeners added are stored in _state_change_listeners. We
	 * store them there and then add them all at once at the end of
	 * initialization (when this function should be called) instead of
	 * just adding them when we need them because it is convenient to
	 * add some of the listeners before _document actually points at
	 * some non-null thing.
	 *
	 * I do not like the name "state_change", but couldn't come up
	 * with anything better.
	 */
	var _add_state_change_listeners = function()
	{
		// I commented this out because it makes Loki really slow
		/*
		for ( var i = 0; i < _state_change_listeners.length; i++ )
		{
			Util.Event.add_event_listener(_document, 'keyup', function() { _state_change_listeners[i]; });
			Util.Event.add_event_listener(_document, 'click', function() { _state_change_listeners[i]; });
			Util.Event.add_event_listener(_toolbar, 'click', function() { _state_change_listeners[i]; });
		}
		*/
	};

	/**
	 * Update the statusbar with our current place in the document tree.
	 */
	var _update_statusbar = function()
	{
		var sel = Util.Selection.get_selection(_window);
		var rng = Util.Range.create_range(sel);
		var cur_node = Util.Range.get_common_ancestor(rng);
		var status = '';
		var i = 0;
		
		do
		{
			if ( i > 0 )
				status = ' > ' + status;

			if ( cur_node.nodeType == Util.Node.TEXT_NODE )
				status = '[TEXT]' + status;
			else if ( cur_node.nodeType == Util.Node.ELEMENT_NODE )
				status = cur_node.tagName + status;

			cur_node = cur_node.parentNode;
			i++;
		}
		while ( cur_node != null &&
				( cur_node.nodeType != Util.Node.ELEMENT_NODE ||
				  cur_node.tagName != 'HTML' ) )

		_statusbar.innerHTML = status;
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

		enumerate_options('keybindings').each(add_keybinding);
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
		
		enumerate_options('menugroups').each(add_menugroup);
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
				if (typeof(console) == 'object' && console.firebug) {
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

	/**
	 * Runs execCommand on _document. The motivation for this wrapper
	 * is to avoid issues when execCommand is used in event listeners.
	 * (If _document isn't yet initialized when "function() {
	 * _document.execCommand(xxx) }" is added as an event listener, an
	 * error results, because (in addition to its arguments) the
	 * listener when executed has access only to those variables which
	 * it had access to when it was defined.
	 *
	 * Also consult <a href="http://www.mozilla.org/editor/midas-spec.html">Mozilla's</a>
	 * and <a href="http://msdn.microsoft.com/workshop/author/dhtml/reference/methods/execcommand.asp">IE's</a>
	 * documentation.
	 *
	 * @param	command		the command to execute
	 * @param	iface		boolean indicating whether to use an interface. Not
	 *                      supported by Mozilla, so always provide false.
	 * @param	value		the value to pass the command
	 */
	var _exec_command = function(command, iface, value)
	{
		_window.focus();
		_document.execCommand(command, iface, value);
		_window.focus();
	};

	/**
	 * Returns the value of _document.queryCommandValue (see the
	 * links on execCommands doc for more info). But first modifies
	 * the return value so that IE's is the same as Mozilla's. (On
	 * this see <a href="http://www.mozilla.org/editor/ie2midas.html">here</a>, 
	 * bullet 8.)
	 *
	 * See also on _exec_command.
	 *
	 * @param	command		the command whose value to query (this only works for 
	 *                      some of the commands)
	 * @return				the (possibly-modified) return value of queryCommandValue
	 */
	var _query_command_value = function(command)
	{
		// Not sure if the window.focus is actually helpful here ...
		// and it makes annoying things happen like dialogs popping up
		// behind the editor's containing window.
		//_window.focus();
		var value = _document.queryCommandValue(command);

		if ( command == 'FormatBlock' )
		{
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
			if ( mappings[value] != null )
				value = mappings[value];
		}

		return value;
	}

	/**
	 * See on _exec_command.
	 */
	var _query_command_state = function(command)
	{
		// Not sure if the window.focus is actually helpful here ...
		// and it makes annoying things happen like dialogs popping up
		// behind the editor's containing window.
		//_window.focus();
		return _document.queryCommandState(command);
	}

	/**
	 * Formats a block as specified if it's not so, and if it is so,
	 * formats it as a normal paragraph.
	 *
	 * @param   tag     the tag name corresponding to how you want
     *                  the block to be formatted. See <code>mappings</code>
     *                  variable inside the function.
     *
	 */
	this.toggle_block = function(tag)
	{
		var tag_string = (_query_command_value('FormatBlock') != tag)
			? '<' + tag + '>'
			: '<p>';
		
		_exec_command('FormatBlock', false, tag_string);
		_window.focus();
	};

	/**
	 * Formats a block as a list of the given type if it's not so, and
	 * if it is so, formats it as a normal paragraph. This is
	 * necessary because in Mozilla, if a block is already formatted
	 * as a list, the Insert[Un]orderedList commands simply remove the
	 * block's block-level formatting, rather than changing it to a
	 * paragraph.
	 *
     * @param   tag     the tag name corresponding to how you want
     *                  the block to be formatted. See mappings variable 
     *                  inside the function
     */
	this.toggle_list = function(tag)
	{
		var command = tag == 'ol' ? 'InsertOrderedList' : 'InsertUnorderedList';

		if ( _query_command_state(command) )
		{
			_exec_command(command); // turn off the list
			this.toggle_block('p');
		}
		else
		{
			_exec_command(command); // turn on the list
		}
	};
};

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

var Loki = {
	/**
	 * Converts the given textarea to an instance of the Loki WYSIWYG editor.
	 * @param {HTMLTextAreaElement} area a TEXTAREA element or the ID of one
	 * @param {object} [settings] Loki settings
	 * @param {function} [callback] a function that will be called when the
	 *        conversion is finished
	 * @see UI.Loki#init
	 * @see http://code.google.com/p/loki-editor/wiki/Settings
	 * @returns {void}
	 */
	convert_textarea: function loki_convert_textarea(area, settings,
		callback)
	{
		Loki.convert_textareas([area], settings || {}, callback || null);
	},
	
	/**
	 * Converts the given textareas to instances of the Loki WYSIWYG editor.
	 * @param {HTMLTextAreaElement[]} areas an array of TEXTAREA elements to
	 * convert, or the ID's of the elements
	 * @param {object} [settings] Loki settings
	 * @param {function} [callback] a function that will be called as the
	 *        conversions are finished
	 * @see UI.Loki#init
	 * @see http://code.google.com/p/loki-editor/wiki/Settings
	 * @returns {void}
	 */
	convert_textareas: function loki_convert_textareas(areas, settings,
		callback)
	{	
		var area;
		var instance;
		
		for (var i = 0; i < areas.length; i++) {
			if (typeof(areas[i]) == 'string') {
				area = document.getElementById(areas[i]);
				if (!area) {
					if (Loki._loaded) {
						throw new Error('No element with the ID of "' +
							areas[i] + '" exists in the document.');
					}
					Loki._pend(areas[i], settings || {}, callback || null);
					continue;
				}
			} else {
				area = areas[i];
			}
			
			if (!Util.Node.is_tag(area, "TEXTAREA")) {
				throw new TypeError("Unable to convert a non-textarea to a " +
					"Loki instance.");
			}
			
			instance = (new UI.Loki).init(area, settings || {});
			
			if (callback) {
				callback(instance, area);
			}
		}
	},
	
	/**
	 * Converts all of the textareas in the document which have the specified
	 * class(es).
	 * @param {string} classes	one or more class names
	 * @param {object} [settings] Loki settings
	 * @param {function} [callback] a function that will be called as the
	 *        conversions are finished
	 * @returns {void}
	 */
	convert_textareas_by_class: function loki_convert_classed_textareas(classes,
		settings, callback)
	{
		function get_textareas()
		{
			return Util.Element.find_by_class(document, classes);
		}
		
		if (this._loaded) {
			Loki.convert_textareas(get_textareas(), settings, callback);
		} else {
			Loki._pend(get_textareas, settings || {}, callback || null);
		}
	},
	
	/**
	 * Converts all of the textareas on the document into Loki instances.
	 * @param {object} [settings] Loki settings
	 * @param {function} [callback] a function that will be called as the
	 *        conversions are finished
	 * @see UI.Loki#init
	 * @see http://code.google.com/p/loki-editor/wiki/Settings
	 * @returns {void}
	 */
	convert_all_textareas: function loki_convert_all_textareas(settings,
		callback)
	{
		if (this._loaded) {
			Loki.convert_textareas(document.getElementsByTagName("TEXTAREA"),
				settings || {}, callback);
		} else {
			Loki._pend(null, settings || {}, callback || null);
		}
		
	},
	
	/**
	 * Returns true if the DOM is ready.
	 * @returns {boolean}
	 */
	is_document_ready: function is_document_ready()
	{
		return this._loaded;
	},
	
	/**
	 * The Loki version.
	 * @type string
	 */
	version: "$Rev$",
	
	/** @private */
	_pending: [],
	/** @private */
	_loaded: false,
	
	/** @private */
	_pend: function loki_pend_textarea(area, settings, callback) {
		this._pending.push([area, settings, callback]);
	},
	
	/** @private */
	_finish_conversions: function loki_finish_conversions() {
		var a;
		
		if (this._loaded)
			return false;
		this._loaded = true;
		
		while (a = this._pending.pop()) {
			if (a[0] == null) {
				Loki.convert_all_textareas(a[1], a[2]);
				return true;
			} else if (typeof(a[0]) == 'function') {
				Loki.convert_textareas(a[0](), a[1], a[2]);
			} else {
				Loki.convert_textarea(a[0], a[1], a[2]);
			}
		}
		
		return true;
	}
};

(function loki_wait_for_load() {
	var done = Loki._finish_conversions.bind(Loki);
	Util.Event.observe(document, 'DOMContentLoaded', done);
	Util.Event.observe(window, 'load', done);
})();
