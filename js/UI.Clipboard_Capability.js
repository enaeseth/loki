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
// Gecko
if ('object' == typeof(Components))
{
	document.addEventListener('DOMContentLoaded', function() {
		UI.Clipboard_Helper_Privileged_Iframe = document.createElement('IFRAME');
		UI.Clipboard_Helper_Privileged_Iframe.src = UI__Clipboard_Helper_Privileged_Iframe__src;
		UI.Clipboard_Helper_Privileged_Iframe.setAttribute('style', 'height:2px; width:2px; left:-500px; position:absolute;');
		document.getElementsByTagName('BODY')[0].appendChild(UI.Clipboard_Helper_Privileged_Iframe);
	}, false);
}
// For IE also we want a separate sandbox for clipboard operations. We
// execCommand paste here, then run clean/masseuses, then transfer to 
// the real iframe. Or we transfer from the real iframe to here, then run
// unmasseuses, then execCommand copy.
//
// The reason to go through all this rather than use window.clipboardData
// is that the latter only supports copying/pasting as text (or URL ... why 
// would anyone want that), not HTML.
else
{
	Util.Event.add_event_listener(window, 'load', function()
	{
		UI.Clipboard_Helper_Editable_Iframe = document.createElement('IFRAME');
		// When under https, this causes an alert in IE about combining https and http:
		UI.Clipboard_Helper_Editable_Iframe.src = UI__Clipboard_Helper_Editable_Iframe__src;
		UI.Clipboard_Helper_Editable_Iframe.style.height = '2px';
		UI.Clipboard_Helper_Editable_Iframe.style.width = '2px';
		UI.Clipboard_Helper_Editable_Iframe.style.left = '-500px';
		UI.Clipboard_Helper_Editable_Iframe.style.position = 'absolute';
		document.body.appendChild(UI.Clipboard_Helper_Editable_Iframe);
	});
}


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
		
		[buttons.cut, buttons.copy].each(function (button) {
			button.set_enabled(selected);
		});
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
	
	function get_selection()
	{
		return Util.Selection.get_selection(loki.window);
	}
	
	this.is_selection_empty = function is_selection_empty()
	{
		return Util.Selection.is_collapsed(get_selection());
	};
	
	this.cut = function cut()
	{
		this.copy();
		Util.Range.delete_contents(Util.Range.create_range(get_selection()));
		loki.focus();
	}
	
	this.copy = function copy()
	{
		// Get the HTML being copied
		var sel = get_selection();
		var rng = Util.Range.create_range(sel);
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
			
			UI.Clipboard_Helper_Privileged_Iframe.contentDocument.
				Clipboard_Helper_Privileged_Functions.set_clipboard(html);
		}
	}
	
	this.paste = function paste()
	{
		var sel = get_selection();
		var rng = Util.Range.create_range(sel);
		
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
			
			insert_html(clean(UI.Clipboard_Helper_Privileged_Iframe.
				contentDocument.Clipboard_Helper_Privileged_Functions.
				get_clipboard()));
		}
	}
	
	this._add_keybinding('Ctrl C', 'copy');
	this._add_keybinding('Ctrl X', 'cut');
	this._add_keybinding('Ctrl V', 'paste');
}