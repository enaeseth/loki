/**
 * Declares instance variables.
 *
 * @constructor
 *
 * @class A class for helping insert an anchor. Contains code
 * common to both the button and the menu item.
 */
UI.Clipboard_Helper = function ClipboardHelper()
{
	var self = this;
	Util.OOP.inherits(self, UI.Helper);

	this.is_selection_empty = function()
	{
		var sel = Util.Selection.get_selection(this._loki.window);
		return Util.Selection.is_collapsed(sel);
	};

	this.cut = function clipboard_cut()
	{
		self.copy();
		var sel = Util.Selection.get_selection(self._loki.window);
		var rng = Util.Range.create_range(sel);
		Util.Range.delete_contents(rng);
		self._loki.focus();
	};

	this.copy = function clipboard_copy()
	{
		// Get the HTML to copy
		var sel = Util.Selection.get_selection(self._loki.window);
		var rng = Util.Range.create_range(sel);
		var html = Util.Range.get_html(rng);
		//var text = rng.toString();
		
		if (Util.Selection.is_collapsed(sel)) {
			// If nothing is actually selected; do not overwrite the clipboard.
			return;
		}

		// Unmassage and clean HTML
		var container = self._loki.document.createElement('DIV');
		container.innerHTML = html;
		self._loki.unmassage_node_descendants(container);
		
		// Clean the copied HTML. We pass an override to the block-level element
		// rule enforcer that specifies that inline content within paragraphs do
		// not have to be wrapped in (e.g.) paragraph tags. This prevents inline
		// content that is being copied from being treated as its own paragraph.
		UI.Clean.clean(container, self._loki.settings, false, {
			overrides: {DIV: Util.Block.BLOCK}
		});
		html = container.innerHTML;

		// Move HTML to clipboard
		try // IE
		{
			_ie_copy(html);
		}
		catch(e) // Gecko
		{
			/*
			try
			{
			*/
				_gecko_copy(html);
			/*
			}
			catch(f)
			{
				if ( _is_privilege_error(f) )
					_alert_helpful_message();
				else
					throw('UI.Clipboard_Helper.copy: Neither the IE way nor the Gecko way of copying worked. The IE way resulted in the following error: <<' + e.message + '>>. The Gecko way resulted in the following error: <<' + f.message + '>>.');
			}
			*/
		}
		self._loki.focus();
	};

	this.paste = function clipboard_paste()
	{
		try // IE
		{
			_ie_paste();
		}
		catch(e)
		{
			/*
			try // Gecko
			{
			*/
				_gecko_paste();
			/*
			}
			catch(f)
			{
				if ( _is_privilege_error(f) )
					_alert_helpful_message();
				else
					throw('UI.Clipboard_Helper.paste: Neither the IE way nor the Gecko way of pasteing worked. The IE way resulted in the following error: <<' + e.message + '>>. The Gecko way resulted in the following error: <<' + f.message + '>>.');
			}
			*/
		}
		self._loki.focus();
	};

	this.delete_it = function() // delete is a reserved word
	{
		var sel = Util.Selection.get_selection(self._loki.window);
		var rng = Util.Range.create_range(sel);
		rng.deleteContents();
		self._loki.focus();
	};

	this.select_all = function()
	{
		self._loki.exec_command('SelectAll');
		self._loki.focus();
	};

	this.is_security_error = function(e)
	{
		return ( e.message != null && e.message.indexOf != null && e.message.indexOf('Clipboard_Helper') > -1 );
	};

	this.alert_helpful_message = function()
	{
		//self._loki.window.alert("Sorry, your browser's security settings prohibit Loki from accessing the clipboard. \n\nIf you just clicked 'Deny' in a dialog asking about security--congratulations, you have good instincts. But if you want to copy, cut, or paste via Loki's toolbar or context menu, you'll need to try again and click 'Allow' in that dialog, and might want to check 'Remember this decision', too.\n\nIf you saw no such dialog, please contact the Web Services group.");

		var alert_win = new Util.Window;
		//alert_win.open('http://fillmore-apps.carleton.edu/global_stock/php/loki/auxil/lokiaux_message.html', '_blank', 'status=1,scrollbars=1,resizable,width=600,height=300');
		// We have to use a real page rather than innerHTML because,
		// at least in FF1.5.0.4, a JS error in FF's XPI-install 
		// chrome causes nothing to happen when you click on the link
		// if the page is dynamically generated.
		/*
		alert_win.body.innerHTML = 
			'<p>You need to install the Lokiaux extension in order to use the clipboard.</p>' +
			'<ol><li><a href="' + self._loki.settings.base_uri + 'lokiaux.xpi" target="_blank">Download it</a></li>' +
			'    <li>When prompted, press Install</li>' +
			'    <li>Restart your browser.</li>';
		*/
	};
	
	function _show_gecko_privileges_warning()
	{
		var message = "Your browser requires that you give explicit permission for " +
			"your clipboard to be accessed, so you may see a security warning " +
			"after dismissing this message. You are free to deny this permssion, " +
			"but if you do, you may be unable to cut, copy, or paste into this " +
			"document.";
		
		UI.Messenger.display_once_per_duration('gecko clipboard warning',
			message, 45);
	}

	function _gecko_copy(html)
	{
		try
		{
			_show_gecko_privileges_warning();
			self._loki.owner_window.GeckoClipboard.set(html);
		}
		catch(e)
		{
			throw("UI.Clipboard_Helper: couldn't copy in _gecko_copy, because <<" + e + ">>.");
		}
	};

	function _ie_copy(html)
	{
		try
		{
			var sel = Util.Selection.get_selection(self._loki.window);
			var rng = Util.Range.create_range(sel);

			// transfer from iframe to editable div
			// select all of editable div
			// copy from editable div
			UI.Clipboard_Helper_Editable_Iframe.contentWindow.document.body.innerHTML = html;
			UI.Clipboard_Helper_Editable_Iframe.contentWindow.document.execCommand("SelectAll", false, null);
			UI.Clipboard_Helper_Editable_Iframe.contentWindow.document.execCommand("Copy", false, null);

			// Reposition cursor
			rng.select();
		}
		catch(e)
		{
			throw("UI.Clipboard_Helper: couldn't copy in _ie_copy, because <<" + e.message + ">>.");
		}
	};

	function _gecko_paste()
	{
		try
		{
			_show_gecko_privileges_warning();
			var data = self._loki.owner_window.GeckoClipboard.get();
			
			var html = (data.type == 'text/html')
				? data.value
				: data.value.replace(/\r?\n/g, "<br />\n");

			// Massage and clean HTML
			var container = self._loki.document.createElement('DIV');
			container.innerHTML = html;
			// See UI.Clipboard_helper.copy() for the override rationale.
			UI.Clean.clean(container, self._loki.settings, false, {
				overrides: {DIV: Util.Block.BLOCK}
			});
			self._loki.massage_node_descendants(container);
			html = container.innerHTML;

			// Get selection and range
			var sel = Util.Selection.get_selection(self._loki.window);
			var rng = Util.Range.create_range(sel);

			// Paste into temporary container
			container = rng.startContainer.ownerDocument.createElement('DIV');
			container.innerHTML = html;

			// Copy into document fragment
			var frag = rng.startContainer.ownerDocument.createDocumentFragment();
			for ( var i = 0; i < container.childNodes.length; i++ )
				frag.appendChild(container.childNodes[i].cloneNode(true));

			// Paste the document fragment
			Util.Selection.paste_node(sel, frag);
		}
		catch(e)
		{
			throw("UI.Clipboard_Helper: couldn't paste in _gecko_paste, because <<" + e + ">>.");
		}
	};

	function _ie_paste()
	{
		try
		{
			var sel = Util.Selection.get_selection(self._loki.window);
			var rng = Util.Range.create_range(sel);

			// Make clipboard iframe editable
			// clear editable div
			// select all of editable div
			// paste into editable div
			UI.Clipboard_Helper_Editable_Iframe.contentWindow.document.body.contentEditable = true;
			UI.Clipboard_Helper_Editable_Iframe.contentWindow.document.body.innerHTML = "";
			UI.Clipboard_Helper_Editable_Iframe.contentWindow.document.execCommand("SelectAll", false, null);
			UI.Clipboard_Helper_Editable_Iframe.contentWindow.document.execCommand("Paste", false, null);

			// Get HTML
			var html = UI.Clipboard_Helper_Editable_Iframe.contentWindow.document.body.innerHTML;

			// Massage and clean HTML
			var container = self._loki.document.createElement('DIV');
			container.innerHTML = html;
			UI.Clean.clean(container, self._loki.settings);
			self._loki.massage_node_descendants(container);
			html = container.innerHTML;

			// Actually paste HTML
			rng.pasteHTML(html);
			rng.select();
		}
		catch(e)
		{
			throw("UI.Clipboard_Helper: couldn't paste in _ie_paste, because <<" + e.message + ">>.");
		}
	};
};

// We need to create this iframe as a place to put code that
// Gecko needs to run with special privileges, for which
// privileges Gecko requires that the code be signed.
// (But we don't want to sign _all_ of Loki, because the page
// that invokes the javascript has to be signed with the 
// javascript, and we want to be able to use Loki on dynamic
// pages; sigining dynamic pages would be too inconvenient, not
// to mention slow.)
// We create this here, on the assumption that it will have
// loaded by the time we need it.
//
// For more information about how to sign scripts, see 
// privileged/HOWTO

/** @ignore */
UI.Clipboard_Helper._setup_done = false

/** @ignore */
UI.Clipboard_Helper._setup = function setup_clipboard_helper() {
	var base_uri = (arguments[0]
	 	? Util.URI.build(Util.URI.normalize(arguments[0]))
		: null);
	var helper_src = null;
	
	if (UI.Clipboard_Helper._setup_done)
		return;
	
	function watch_onload(func)
	{
		if (document.addEventListener) {
			document.addEventListener('DOMContentLoaded', func, false);
			window.addEventListener('load', func, false);
		} else if (window.attachEvent) {
			window.attachEvent('onload', func);
		} else {
			window.onload = func;
		}
	}
	
	function create_hidden_iframe(src)
	{
		var called = false;
		var frame = Util.Document.create_element(document, 'iframe',
		{
			src: src,
			style: {
				position: 'absolute',
				box: [-500, -500, 2]
			}
		});
		
		function append_helper_iframe()
		{
			if (called)
				return;
			called = true;
			
			var body = (document.getElementsByTagName('BODY')[0] ||
				document.documentElement);
			body.appendChild(frame);
		}
		
		watch_onload(append_helper_iframe);
		
		return frame;
	}
	
	function make_uri(path)
	{
		if (base_uri.charAt(base_uri.length - 1) == '/')
			return base_uri + path;
		else
			return [base_uri, path].join('/');
	}
	
	if (typeof(Components) == 'object') {
		// Gecko
		if (typeof(_gecko_clipboard_helper_src) == 'string') {
			// PHP helper is providing this for us.
			helper_src = _gecko_clipboard_helper_src;
		} else if (base_uri) {
			helper_src = 'jar:' +
				make_uri('auxil/privileged.jar!/gecko_clipboard.html');
		} else {
			return;
		}
		
		create_hidden_iframe(helper_src);
	} else {
		// everyone else
		if (typeof(UI__Clipboard_Helper_Editable_Iframe__src) == 'string') {
			// PHP helper is providing this for us.
			helper_src = UI__Clipboard_Helper_Editable_Iframe__src;
		} else if (base_uri) {
			helper_src = make_uri('auxil/loki_blank.html');
		} else {
			return;
		}
		UI.Clipboard_Helper_Editable_Iframe = create_hidden_iframe(helper_src);
	}
	
	UI.Clipboard_Helper._setup_done = true;
}

UI.Clipboard_Helper._setup();