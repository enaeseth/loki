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
//
(function setup_clipboard_helper() {
	
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
	
	function add_script(src)
	{
		var called = false;
		var tag = Util.Document.create_element(document, 'script',
		{
			src: src,
			type: 'text/javascript'
		});
		
		function append_script()
		{
			if (called)
				return;
			called = true;
			
			var head = (document.getElementsByTagName('HEAD')[0] ||
				document.documentElement);
			head.appendChild(tag);
		}
		
		watch_onload(append_script);
	}
	
	if (typeof(Components) == 'object') {
		// Gecko
		create_hidden_iframe(_gecko_clipboard_helper_src);
	} else {
		// everyone else
		UI.Clipboard_Helper_Editable_Iframe =
			create_hidden_iframe(UI__Clipboard_Helper_Editable_Iframe__src);
	}
})();

/**
 * @class Provides cut/copy/paste via the system clipboard.
 * @base UI.Capability
 * @author Eric Naeseth
 * @constructor
 * @param {UI.Loki}
 */
UI.Clipboard_Capability = function Clipboard(loki)
{
	Util.OOP.inherits(this, UI.Capability, loki, 'Clipboard access');
	
	var selected = undefined;
	var buttons = {
		cut: this._add_button('cut.gif', 'Cut', 'cut'),
		copy: this._add_button('copy.gif', 'Copy', 'copy'),
		paste: this._add_button('paste.gif', 'Paste', 'paste')
	};
	
	this.activate = function activate(wdw, doc)
	{
		// Clipboard monopolization: prevent the user from directly cutting,
		// copying, or pasting using the browser to allow us to do cleanup.
		// The only remaining way for the user to do this is by using the
		// Edit menu, and Safari generates "before[clipboard action]" events
		// whenever the user merely opens the Edit menu! But clipboard isn't
		// working yet in Safari anyway.
		
		if (loki.settings.monopolize_clipboard && !Util.Browser.Safari) {
			['cut', 'copy', 'paste'].each(function(event_name) {
				Util.Event.observe(doc.body, 'before' + event_name, function(ev) {
					alert('Loki is unable to clean up the part of the ' +
						'document that you tried to ' + event_name + ' when ' +
						'it is done using the browser\'s menu. Instead, use ' +
						'the keyboard or Loki\'s toolbar.');
					return Util.Event.prevent_default(ev);
				});
			});
		}
	}
	
	this.context_changed = function context_changed()
	{
		selected = !this.is_selection_empty();
		
		function enable_clipboard_button(button) {
			button.set_enabled(selected);
		}
		
		[buttons.cut, buttons.copy].each(enable_clipboard_button);
	}
	
	this.add_menu_items = function add_menu_items(menu)
	{
		var group = menu.add_group('Clipboard');
		
		group.add_item(new UI.Menu.Item('Cut', [this, 'cut'],
			{enabled: selected}));
		group.add_item(new UI.Menu.Item('Copy', [this, 'copy'],
			{enabled: selected}));
		group.add_item(new UI.Menu.Item('Paste', [this, 'paste']));
	}
	
	this.cut = function cut()
	{
		this.copy();
		Util.Range.delete_contents(loki.get_selected_range());
		loki.focus();
	}
	
	this.copy = function copy()
	{
		// Get the HTML being copied
		var rng = loki.get_selected_range();
		var html = Util.Range.get_html(rng);
		
		// Unmassage and clean the HTML
		var container = loki.document.createElement('DIV');
		container.innerHTML = html;
		loki.unmassage_node_descendants(container);
		UI.Clean.clean(container, loki.settings);
		html = container.innerHTML;
		container = null;
		
		// Move HTML to the clipboard
		try {
			// Internet Explorer
			
			var editable_doc =
				UI.Clipboard_Helper_Editable_Iframe.contentWindow.document;
			
			editable_doc.body.innerHTML = html;
			editable_doc.execCommand('SelectAll', false, null);
			editable_doc.execCommand('Copy', false, null);
		} catch (e) {
			// Gecko
			
			loki.owner_window.GeckoClipboard.set(html);
		}
	}
	
	this.paste = function paste()
	{
		var sel = loki.get_selection();
		var rng = loki.get_selected_range();
		
		function clean(html)
		{
			// Massage and clean HTML
			var container = loki.document.createElement('DIV');
			container.innerHTML = html;
			UI.Clean.clean(container, loki.settings);
			loki.massage_node_descendants(container);
			html = container.innerHTML;
			container = null;
			
			return html;
		}
		
		function insert_html(html)
		{
			if (rng.pasteHTML && rng.select) {
				rng.pasteHTML(html);
				rng.select();
			} else {
				var dest_doc = rng.startContainer.ownerDocument;
				
				// Paste into temporary container
				var container = dest_doc.createElement('DIV');
				container.innerHTML = html;

				// Copy into document fragment
				var frag = dest_doc.createDocumentFragment();
				for (var i = 0; i < container.childNodes.length; i++) {
					// XXX: why the cloning step? -EN
					frag.appendChild(container.childNodes[i].cloneNode(true));
				}

				// Paste the fragment
				Util.Selection.paste_node(sel, frag);
			}
		}
		
		try {
			// Internet Explorer
			
			var editable_doc =
				UI.Clipboard_Helper_Editable_Iframe.contentWindow.document;
			
			Util.Document.make_editable(editable_doc);
			editable_doc.execCommand('SelectAll', false, null);
			editable_doc.execCommand('Paste', false, null);

			insert_html(clean(editable_doc.body.innerHTML));
		} catch (e) {
			// Gecko
			
			var data = loki.owner_window.GeckoClipboard.get();
			
			var value = (data.type == 'text/html')
				? data.value
				: data.value.replace(/\r?\n/g, "<br />\n");
			
			insert_html(value);
		}
	}
	
	this._add_keybinding('Ctrl C', 'copy');
	this._add_keybinding('Ctrl X', 'cut');
	this._add_keybinding('Ctrl V', 'paste');
}