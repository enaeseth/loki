/**
 * Constructs a new instance of Loki. The constructor doesn't actually
 * modify the document at all; for this see replace_textarea.
 * @constructor
 *
 * @class A WYSIWYG HTML editor.
 *
 * @param {object}	settings	Loki settings
 */
UI.Loki = function(settings)
{
	this.owner_document = null;
	
	this.window = null;
	this.document = null;
	this.body = null;
	var hidden_input = null;
	var textarea = null;
	
	this.settings = settings || {};
	
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
			return UI.Clean.cleanHtml(this.get_dirty_html(), settings);
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
		return body.innerHTML;
	}
	
	/**
	 * Sets the HTML of the document currently being edited.
	 * @type void
	 * @param	{string}	html	The new HTML
	 */
	this.set_html = function set_html(html)
	{
		body.innerHTML = html;
		clean_body();
	}
	
	function clean_body()
	{
		UI.Clean.clean(body, settings);
	}
	
	function textarea_is_active()
	{
		return ((editor_root && textarea.parentNode == editor_root) ||
			textarea.parentNode);
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
	
	this.show_graphical_view = function show_graphical_view()
	{
		this.set_html(textarea.value);
		editor_root.
	}
	
	this.show_source_view = function show_source_view()
	{
		// body...
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
	}
	
	function create_ui()
	{
		root = dh.create_element('div', {className: 'loki'});
		
		[
			function create_toolbars()
			{
				toolbar = new UI.Toolbar(self);
				source_toolbar = new UI.Toolbar(self);

				return toolbar.get_element();
			},
			
			function create_iframe()
			{				
				var iframe = dh.create_element('iframe', {
					src: (settings.base_uri || '') + 'auxil/loki_blank.html',
					frameBorder: 0, // IE adds an extra border w/o this
					style: {
						height: textarea.clientHeight + 'px',
						width: textarea.clientWidth + 'px'
					}
				});
				
				// XXX: Why is this wrapped in a table? -EN
				/*var wrapper = dh.create_element('table',
					{className: 'iframe_wrapper'},
					[dh.create_element('tbody', {},
						[dh.create_element('tr', {}, 
							[dh.create_element('td', {}, [iframe])])])]);*/
				
				return iframe;
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
					
				
				
				return wrapper;
			}
		].each(function (component_adder) {
			var res = component_adder();
			if (res)
				root.appendChild(res);
		});
	}
	
	
}