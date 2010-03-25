/**
 * Dialog_Window is a base class for implementing dialog windows.
 *
 * It sits between Util.Window, a low-level class for creating popup windows,
 * and UI.Dialog, which defines all sorts of callbacks for creating specific
 * parts of the window, and is quite crusty.
 *
 * Constructing a Dialog_Window object does not actually open a window. To do
 * that, call its open() method.
 */
UI.Dialog_Window = function Dialog_Window(loki, options) {
	this.loki = loki;
	this.window = null;
	
	options = options || {};
	this._dialog_uri = options.dialog_uri || this.get_default_dialog_uri();
	this._initial_width = options.width || 600;
	this._initial_height = options.height || 300;
	this._style_sheets = options.style_sheets || [];
	this._root_id = options.root_id || 'root';
	
	this._constructed = false;
};

Util.OOP.mixin(UI.Dialog_Window, {
	/**
	 * Opens the dialog window.
	 *
	 * If the dialog's window does not yet exist, or has been closed, it will
	 * be created, and the dialog object's construct() method will be called to
	 * fill in the dialog's elements.
	 *
	 * Once the window is opened (or if it was already open), any arguments
	 * passed to open() will be passed to the populate() method, which should
	 * fill in the dialog's elements appropriately. If the dialog has any
	 * input, textarea, or select elements with an "autofocus" attribute,
	 * that element will be given focus.
	 *
	 * If the dialog window was already open when this method was called, it
	 * will be brought into focus.
	 */
	open: function open_dialog_window() {
		var self = this;
		var open_args = Util.Array.from(arguments);
		
		// make sure subclasses have defined the right stuff:
		if (typeof(this.construct) != 'function') {
			throw new Error('This dialog implementation is invalid: ' +
				'it has no construct() method.');
		}
		if (typeof(this.populate) != 'function') {
			throw new Error('This dialog implementation is invalid: ' +
				'it has no populate() method.');
		}
		
		function construct_dialog() {
			if (self._constructed) {
				// already done this
				return;
			}
			self._constructed = true;
			
			self.document = self.window.document;
			self.body = self.window.document.body;
			
			self.root = self.document.createElement('DIV');
			self.root.id = self._root_id;
			self.body.appendChild(self.root);
			
			Util.Array.for_each(self._style_sheets, function (sheet_uri) {
				Util.Document.append_style_sheet(self.document,
					self.loki.settings.base_uri + sheet_uri);
			});
			
			self.construct();
			self.populate.apply(self, open_args);
			self._form_autofocus();
		}
		
		if (this.window && !this.window.closed) {
			// the window is already open
			this.populate.apply(this, open_args);
			this.window.focus();
			this._form_autofocus();
		} else {
			var display = Util.Object.clone(UI.Dialog_Window._display_options);
			display.width = this._initial_width;
			display.height = this._initial_height;
			
			this._constructed = false;
			this.window = Util.Window.open(this._dialog_uri,
				{display: display});
			if (!this.window) {
				// popup blocked
				return false;
			}
			
			_loki_enqueue_dialog(this.window, construct_dialog);
			Util.Event.observe(this.window, 'load', construct_dialog);
		}
	},
	
	/**
	 * Closes the dialog window.
	 *
	 * It is safe to call open() on this instance again after the window is
	 * closed. The window object's construct() method will again be called to
	 * set up the dialog.
	 */
	close: function close_dialog_window() {
		if (this.window && !this.window.closed) {
			this.window.close();
			return true;
		}
		
		return false;
	},
	
	/**
	 * Creates submit and cancel buttons at the bottom of the window.
	 *
	 * The buttons will be labelled with the given "submit_l" and "cancel_l",
	 * or the defaults of 'OK' and 'Cancel' if unspecified.
	 *
	 * When the submit button is pressed, the dialog's submit() method is
	 * called. Similarly, when the cancel button is pressed, the dialog's
	 * cancel() method is called.
	 *
	 * This method also listens for "Enter" and "Escape" keys being pressed
	 * on the dialog. When used outside of an element where they have existing
	 * meaning (e.g., textareas, selects), they will also cause submit() and
	 * cancel() to be called (respectively).
	 *
	 * The dialog's construct() method should call this method if the above-
	 * described behavior is desired.
	 */
	use_submit_and_cancel: function use_submit_and_cancel(submit_l, cancel_l) {
		var buttons = {};
		
		this.append('<div class="submit_and_cancel_chunk">' +
			'<button type="button" class="ok">OK</button>' +
			'<button type="button" class="cancel">Cancel</button>' +
			'</div>',
			{
				submit: '.ok',
				cancel: '.cancel'
			}, buttons);
		
		Util.Event.observe(buttons.submit, 'click', this.submit, this);
		Util.Event.observe(buttons.cancel, 'click', this.cancel, this);
		
		if (submit_l)
			buttons.submit.innerHTML = submit_l;
		if (cancel_l)
			buttons.cancel.innerHTML = cancel_l;
		
		// Listen for Enter and Escape.
		var enter_unsafe = {TEXTAREA: true, BUTTON: true, SELECT: true,
			OPTION: true};
		function check_enter_escape(event) {
			var target = event.target || event.srcElement;

			// Enter key
			if (event.keyCode == 13) {
				// Enter
				if (target && !(target.tagName in enter_unsafe)) {
					this.submit();
					return Util.Event.prevent_default(event);
				}
			} else if (event.keyCode == 27) {
				// Escape
				this.cancel();
				return Util.Event.prevent_default(event);
			}
		}
		Util.Event.observe(this.document, 'keydown', check_enter_escape, this);
	},
	
	/**
	 * Called when the dialog's task is being submitted.
	 * The default implementation simply closes the window.
	 */
	submit: function submit_dialog_window() {
		// this default implementation should probably not ever be called, so
		// try to warn if it is
		if (typeof(console) === 'object') {
			if (typeof(console.warn) !== 'undefined') {
				console.warn('default implementation of ' +
					'UI.Dialog_Window.submit() called; merely closing window');
			}
		}
		
		this.close();
	},
	
	/**
	 * Called when the dialog's task is being cancelled.
	 * The default implementation simply closes the window.
	 */
	cancel: function cancel_dialog_window() {
		this.close();
	},
	
	get_default_dialog_uri: function get_default_dialog_uri() {
		var base = this.loki.settings.base_uri;
		return base + 'auxil/loki_dialog.html';
	},
	
	append: function append_html_to_dialog_root(html, extract, dest) {
		var elements = this.build(html, extract, dest);
		this.root.appendChild(elements);
		return elements;
	},
	
	build: function build_dialog_elements(html, extract, dest) {
		return Util.Document.build(this.document, html, extract, dest || this);
	},
	
	/**
	 * Implement the `autofocus` attribute on form fields, for our convenience.
	 */
	_form_autofocus: function _dialog_form_autofocus() {
		var doc = this.document;
		
		function find_element_to_focus(tag) {
			var elements = doc.getElementsByTagName(tag);
			
			for (var i = 0; i < elements.length; i++) {
				if (elements[i].getAttribute('autofocus')) {
					elements[i].focus();
					return true;
				}
			}
			
			return false;
		}
		
		if (typeof(doc.querySelector) != 'undefined') {
			var element = doc.querySelector('input[autofocus], ' +
				'textarea[autofocus], select[autofocus]');
			if (element)
				element.focus();
		} else {
			// wtf hax, but this does the right thing, I swear
			Util.array.find(['INPUT', 'TEXTAREA', 'SELECT'],
				find_element_to_focus);
		}
	}
});

UI.Dialog_Window._display_options = {
	status: true,
	scrollbars: true,
	toolbars: true,
	resizable: true,
	dependent: true,
	dialog: true
};

// The following code defines the infrastructure by which dialog windows
// tell Loki that they have loaded. In most browsers, this infrastructure is
// not necessary; we can just listen for the newly-opened window's "load"
// event. However, in Internet Explorer 8, trying to listen for that "load"
// event causes a race condition that we often lose, where "load" fires before
// we can register the event listener. So, dialog windows include some
// JavaScript that calls _loki_dialog_postback, which will trigger the onload
// callback associated with that window.

// The list of dialog windows that Loki is waiting for, and their associated
// onload callbacks.
var _loki_dialog_queue = [];

// The list of dialog windows that posted back without having any onload
// callback registered for them.
var _loki_unmatched_dialogs = [];

function _loki_enqueue_dialog(dialog_window, onload) {
	var i;
	
	// Check to see if this dialog window posted back before it was queued; if
	// so, we need to trigger the callback right here.
	for (i = 0; i < _loki_unmatched_dialogs.length; i++) {
		if (_loki_unmatched_dialogs[i] === dialog_window) {
			_loki_unmatched_dialogs.splice(i, 1);
			onload();
			return;
		}
	}
	
	_loki_dialog_queue.push({window: dialog_window, onload: onload});
}

window._loki_dialog_postback = function(dialog_window) {
	var i, callback, called = false;
	
	for (i = 0; i < _loki_dialog_queue.length; i++) {
		if (_loki_dialog_queue[i].window === dialog_window) {
			callback = _loki_dialog_queue[i].onload;
			_loki_dialog_queue.splice(i, 1);
			
			if (!called) {
				callback();
				called = true;
			}
		}
	}
	
	if (!called) {
		_loki_unmatched_dialogs.push(dialog_window);
	}
};
