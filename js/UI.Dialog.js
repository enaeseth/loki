/**
 * Declares instance variables. <code>init</code> must be called to
 * initialize instance variables.
 *
 * @constructor
 *
 * @class Base class for classes which represent dialog windows. Example usage:
 * <p>
 * <pre>
 * var dialog = new UI.Image_Dialog;   <br />
 * dialog.init({ data_source : '/fillmorn/feed.rss',   <br />
 *               submit_listener : this._insert_image,	<br />
 *               selected_item : { link : '/global_stock/images/1234.jpg' }	  <br />
 * });	 <br />
 * dialog.display();
 * </pre>
 */
UI.Dialog = function()
{
	this._external_submit_listener;
	this._data_source;
	this._base_uri;
	this._initially_selected_item;
	this._dialog_window;
	this._doc;
	this._udoc;

	this._dialog_window_width = 600;
	this._dialog_window_height = 300;

	/**
	 * Initializes the dialog.
	 *
	 * @param   params  object containing the following named parameters:
	 *                  <ul>
	 *                  <li>data_source - the RSS feed from which to read this file</li>
	 *                  <li>submit_listener - the function which will be called when
	 *                  the dialog's submit button is pressed</li>
	 *                  <li>selected_item - an object with the same properties as
	 *                  the object passed by this._internal_submit_handler (q.v.) to
	 *                  submit_handler (i.e., this._external_submit_handler). Used e.g. to
	 *                  determine which if any image is initially selected.</li>
	 *                  </ul>
	 */
	this.init = function init_dialog(params)
	{
		this._data_source = params.data_source;
		this._base_uri = params.base_uri;
		this._external_submit_listener = params.submit_listener;
		this._remove_listener = params.remove_listener;
		this._initially_selected_item = params.selected_item;

		return this;
	};

	this.open = function open_dialog()
	{
		var self = this;
		
		function populate_dialog() {
			if (self._dialog_window._dialog_populated)
				return;
			
			self._dialog_window._dialog_populated = true;
			
			self._doc = self._dialog_window.window.document;
			self._dialog_window.document = self._doc;
			self._udoc = new Util.Document(self._doc);
			
			self._root =
				self._doc.body.appendChild(self._doc.createElement('DIV'));
			
			// Work around an IE display glitch: don't render until the document
			// has been built.
			if (Util.Browser.IE)
				self._doc.body.style.display = 'none';
			try {
				self._dialog_window.body = self._doc.body;
				self._set_title();
				self._append_style_sheets();
				self._add_dialog_listeners();
				self._append_main_chunk();
				self._apply_initially_selected_item();
			} finally {
				self._doc.body.style.display = '';
			}
		}
		
		var already_open = (this._dialog_window && this._dialog_window.window
			&& !this._dialog_window.window.closed);
		
		if (already_open) {
			this._dialog_window.window.focus();
		} else {
			var dialog_uri = this._base_uri + 'auxil/loki_dialog.html';
			var dialog_window = Util.Window.open(dialog_uri, {
				name: '_blank',
				display: 'status=1,scrollbars=1,toolbars=1,resizable,width=' +
					this._dialog_window_width + ',height=' + 
					this._dialog_window_height + ',dependent=yes,dialog=yes'
			});
			
			if (!dialog_window) // popup blocker
				return false;
			
			this._dialog_window = {
				window: dialog_window,
				document: dialog_window.document,
				body: dialog_window.document.body
			};
			
			_loki_enqueue_dialog(this._dialog_window.window, populate_dialog);
			Util.Event.observe(this._dialog_window.window, 'load',
				populate_dialog);
		}
	};
	
	/**
	 * Creates a new activity indicator (UI.Activity) for the dialog.
	 */
	this.create_activity_indicator = function(kind, text)
	{
		if (!text)
			var text = null;
		
		return new UI.Activity(this._base_uri, this._dialog_window.document, kind, text);
	}
	
	/**
	 * Creates a new form (Util.Form) for the dialog.
	 */
	this.create_form = function(params)
	{
		if (!params)
			var params = {};
		return new Util.Form(this.dialog_window.document, params);
	}

	/**
	 * Sets the page title
	 */
	this._set_title = function() { /* do nothing by default */ };

	/**
	 * Appends all the style sheets needed for this dialog.
	 */
	this._append_style_sheets = function() { /* do nothing by default */ };

	/**
	 * Adds all the dialog event listeners for this dialog.
	 */
	this._add_dialog_listeners = function()
	{
		var self = this;
		var enter_unsafe =
			['TEXTAREA', 'BUTTON', 'SELECT', 'OPTION'].toSet();
	
		
		//Util.Event.add_event_listener(this._dialog_window.body, 'keyup', function(event) 
		this._dialog_window.document.onkeydown = function(event)
		{ 
			event = event == null ? self._dialog_window.window.event : event;
			var target = event.srcElement == null ? event.target : event.srcElement;

			// Enter key
			if (event.keyCode == 13 && target && !(target.tagName in enter_unsafe)) {
				self._internal_submit_listener();	
				return false;
			}
			
			if ( event.keyCode == 27 ) // escape
			{
				self._internal_cancel_listener();	
				return false;
			}

			// (IE) Disable refresh shortcut
			// [I should think IE and Gecko could be covered
			// together; but can't figure it out right now, tired.]
			if ( event.ctrlKey == true && event.keyCode == 82 ) // ctrl-r
			{
				return false;
			}
		};
		//});
		this._dialog_window.document.onkeypress = function(event)
		{
			event = event == null ? self._dialog_window.window.event : event;
			// (Gecko) Disable refresh shortcut
			if ( event.ctrlKey == true && event.charCode == 114 ) // ctrl-r
			{
				return false;
			}
		};

		/*
		this._dialog_window.window.onbeforeunload = 
		this._dialog_window.document.body.onbeforeunload = function(event)
		{
			event = event == null ? self._dialog_window.window.event : event;
			event.returnValue = "If you do navigate away, your changes in this dialog will be lost, and the dialog may close.";
			return event.returnValue;
		};

		this._dialog_window.window.onunload = function(event)
		{
			self._internal_cancel_listener();
		};
		*/
	};

	/**
	 * Appends the main part of the page, i.e. the children of the body element.
	 */
	this._append_main_chunk = function()
	{
		this._main_chunk = this._dialog_window.document.createElement('FORM');
		this._main_chunk.action = 'javascript:void(0);';
		//this._dialog_window.body.appendChild(this._main_chunk);
		this._root.appendChild(this._main_chunk);

		this._populate_main();
	};

	/**
	 * Stub for adding the main content of the dialog.
	 */
	this._populate_main = function()
	{
		this._append_submit_and_cancel_chunk();
	};

	/**
	 * Creates and appends a chunk containing submit and cancel
	 * buttons. Also attaches 'click' event listeners to the submit and
	 * cancel buttons: this._internal_submit_listener for submit, and
	 * this._internal_cancel_listener for cancel.
	 *
	 * @param	submit_text		(optional) the text to use on the submit button. Defaults to "OK".
	 * @param	cancel_text		(optional) the text to use on the cancel button. Defaults to "Cancel".
	 */
	this._append_submit_and_cancel_chunk = function(submit_text, cancel_text)
	{
		var self = this;
		
		function create_button(text, click_listener) {
			var b = self._udoc.create_element('BUTTON', {type: 'button'}, [text]);
			Util.Event.add_event_listener(b, 'click', click_listener.bind(self));
			return b;
		}
		
		var chunk = this._doc.createElement('DIV');
		Util.Element.add_class(chunk, 'submit_and_cancel_chunk');
		
		var submit = create_button(submit_text || 'OK', this._internal_submit_listener);
		Util.Element.add_class(submit, 'ok');
		chunk.appendChild(submit);
		chunk.appendChild(create_button(cancel_text || 'Cancel', this._internal_cancel_listener));

		this._root.appendChild(chunk);
	};

	/**
	 * Apply the initially selected item. Extending functions should do things
	 * like setting the link_input's value to the initially_selected_item's uri.
	 */
	this._apply_initially_selected_item = function()
	{
	};

	/**
	 * This resizes the window to its content. 
	 *
	 * @param	horizontal	(boolean) Sometimes we don't want to resize horizontally 
	 *						to the content, because since the content is not fixed-width, 
	 *						it will expand to take up the whole screen, which is ugly. So
	 *						false here disables horiz resize.
	 * @param	vertical	(boolean) same thing
	 *						
	 */
	this._resize_dialog_window = function(horizontal, vertical)
	{
		// Skip IE // XXX bad
		if ( document.all )
			return;

		if ( horizontal == null )
			horizontal = true;
		if ( vertical == null )
			vertical = true;

		// From NPR.org
		var win = this._dialog_window.window;
		var doc = this._dialog_window.document;

		if (win.sizeToContent)	// Gecko
		{
			var w = win.outerWidth;
			var h = win.outerHeight;

			//win.resizeBy(win.innerWidth * 2, win.innerHeight * 2);
			//win.sizeToContent();	
			//win.sizeToContent();	
			//win.resizeBy(win.innerWidth + 10, win.innerHeight + 10);
			win.resizeBy(doc.documentElement.clientWidth + 10 + (win.outerWidth - win.innerWidth) - win.outerWidth, 
						 doc.documentElement.clientHeight + 20 + (win.outerHeight - win.innerHeight) - win.outerHeight);
			//win.resizeBy(this._root.clientWidth + 10 - win.outerWidth, 
			//			 this._root.clientHeight + 10 - win.outerHeight);
			//win.resizeBy(win.innerWidth + 10 - win.outerWidth, 
			//			 win.innerHeight + 10 - win.outerHeight);
			//win.resizeBy(10,0); 

/*
		try {
			win.scrollBy(1000, 1000);
			if (win.scrollX > 0 || win.scrollY > 0) {
				win.resizeBy(win.innerWidth * 2, win.innerHeight * 2);
				win.sizeToContent();
				win.scrollTo(0, 0);
				var x = parseInt(screen.width / 2.0) - (win.outerWidth / 2.0);
				var y = parseInt(screen.height / 2.0) - (win.outerHeight / 2.0);
				win.moveTo(x, y);
			}
			mb('resized dialog');
		} catch(e) { mb('error in resize_dialog_window:' + e.message); throw(e); }
*/


			if ( !horizontal )
				win.outerWidth = w;
			if ( !vertical )
				win.outerWidth = h;
		}
		else  // IE
		{  
			//old ie method, doesn't work for dialogs:
			win.resizeTo(100,100);  
			docWidth = Math.max(this._main_chunk.offsetWidth + 70, 200);  
			docHeight = Math.max(this._main_chunk.offsetHeight + 40, doc.body.scrollHeight) + 18;
			win.resizeTo(docWidth,docHeight);
			// not tested yet ...:
/*
			docWidth = Math.max(this._main_chunk.offsetWidth + 70, 200);  
			docHeight = Math.max(this._main_chunk.offsetHeight + 40, doc.body.scrollHeight) + 18;
			if ( horizontal )
				win.dialogWidth = docWidth;
			if ( vertical )
				win.dialogHeight = docHeight;
*/
		}
	};

	/**
	 * Called as an event listener when the user clicks the submit
	 * button. Extending functions should (a) gather information needed
	 * to call the function referenced by this._submit_listener, (b) call
	 * that function, and (c) close this dialog.
	 */
	this._internal_submit_listener = function()
	{
		// Close dialog window
		this._dialog_window.window.close();
	};

	/**
	 * Called as an event listener when the user clicks the submit
	 * button. Extending functions may (a) gather information needed to
	 * call the function referenced by this._submit_listener, and (b) call
	 * that function. They should (c) close this dialog.
	 */
	this._internal_cancel_listener = function()
	{
		// Close dialog window
		this._dialog_window.window.close();
	};
};
