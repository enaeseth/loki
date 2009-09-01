/**
 * Declares instance variables.
 *
 * @constructor
 *
 * @class Represents a menu.
 */
UI.Menu = function()
{
	var self = this;
	var _loki;
	var _chunk;
	var _menuitems = new Array();

	self.init = function(loki)
	{
		_loki = loki;
		return self;
	};

	self.add_menuitem = function(menuitem)
	{
		_menuitems.push(menuitem);
	};

	self.add_menuitems = function(menuitems)
	{
		var i, length;
		if (menuitems) {
			for (i = 0, length = menuitems.length; i < length; ++i)
				self.add_menuitem(menuitems[i]);
		}
	};

	var _get_chunk = function(popup_document)
	{
		var menu_chunk = popup_document.createElement('DIV');
		Util.Event.add_event_listener(menu_chunk, 'contextmenu', 
			function(event)
			{ 
				// Stop the normal context menu from displaying
				try { event.preventDefault(); } catch(e) {} // Gecko
				return false; // IE
			});
		menu_chunk.style.zindex = 1000;
		Util.Element.add_class(menu_chunk, 'contextmenu');

		for ( var i = 0; i < _menuitems.length; i++ )
		{
			menu_chunk.appendChild(_menuitems[i].get_chunk(popup_document));
		}

		//menu_chunk.innerHTML = 'This is the context menu.'
		return menu_chunk;
	};

	/**
	 * Renders the menu.
	 * 
	 * Much of this code, especially the Gecko part, is lightly 
	 * modified from FCK; some parts are modified from TinyMCE;
	 * some parts come from Brian's Loki menu code.
	 */
	self.display = function(click_event)
	{
		if (_loki.owner_window.createPopup) {
			// Make the popup and append the menu to it
			var popup = _loki.owner_window.createPopup();
			var menu_chunk = _get_chunk(popup.document);
			var popup_body = popup.document.body;
			Util.Element.add_class(popup_body, 'loki');
			Util.Document.append_style_sheet(popup.document, _loki.settings.base_uri + 'css/Loki.css');
			popup_body.appendChild(menu_chunk);

			// Get width and height of the menu
			//
			// We use this hack (first appending a copy of the menu directly in the document,
			// and getting its width and height from there rather than from the copy of
			// the menu appended to the popup) because we append the "Loki.css" style sheet to 
			// the popup, but that may not have loaded by the time we want to find the width 
			// and height (even though it will probably be stored in the cache). Since "Loki.css"
			// has already been loaded for the main editor window, we can reliably get the dimensions
			// there.
			//
			// We surround the menu chunk here in a table so that the menu chunk div shrinks
			// in width as appropriate--since divs normally expand width-wise as much as they
			// can.
			var tmp_container = _loki.owner_document.createElement('DIV');
			tmp_container.style.position = 'absolute';
			tmp_container.innerHTML = '<table><tbody><tr><td></td></tr></tbody></table>';
			var tmp_menu_chunk = _get_chunk(_loki.owner_document);
			tmp_container.firstChild.firstChild.firstChild.firstChild.appendChild(tmp_menu_chunk);
			_loki.root.appendChild(tmp_container);
			var width = tmp_menu_chunk.offsetWidth;
			var height = tmp_menu_chunk.offsetHeight;
			_loki.root.removeChild(tmp_container);

			// This simple method of getting width and height would work, if we hadn't
			// loaded a stylesheet for the popup (see above):
			// (NB: we could also use setTimeout for the below, but that would break if 
			// the style sheet wasn't stored in the cache and thus had to be actually
			// downloaded.)
			//popup.show(x, y, 1, 1);
			//var width = menu_chunk.offsetWidth;
			//var height = menu_chunk.offsetHeight;

			Util.Event.add_event_listener(popup.document, 'click', function() { popup.hide(); });

			// Show the popup
			popup.show(click_event.screenX, click_event.screenY, width, height);
		} else {
			// Determine the coordinates at which the menu should be displayed.
			var frame_pos = Util.Element.get_position(_loki.iframe);
			var event_pos = {x: click_event.clientX, y: click_event.clientY};
			var root_offset = Util.Element.get_relative_offsets(_loki.owner_window, _loki.root);

			var x = frame_pos.x + event_pos.x - root_offset.x;
			var y = frame_pos.y + event_pos.y - root_offset.y;
			
			// Create menu, hidden
			var menu_chunk = _get_chunk(_loki.owner_document);
			_loki.root.appendChild(menu_chunk);
			menu_chunk.style.position = 'absolute';
			menu_chunk.style.visibility = 'hidden';

			// Position menu
			menu_chunk.style.left = (x - 1) + 'px';
			menu_chunk.style.top = (y - 1) + 'px';

			// Watch the "click" event for all windows to close the menu
			function close_menu() {
				var w;
				
				if (menu_chunk.parentNode) {
					menu_chunk.parentNode.removeChild(menu_chunk);
					
					var w = _loki.window;
					while (w) {
						w.document.removeEventListener('click', close_menu, false);
						w.document.removeEventListener('contextmenu', close_menu, false);
						w = (w != w.parent) ? w.parent : null;
					}
				}
			}
			
			function add_close_listeners() {
				var w = _loki.window;
				while (w) {
					w.document.addEventListener('click', close_menu, false);
					w.document.addEventListener('contextmenu', close_menu, false);
					w = (w != w.parent) ? w.parent : null;
				}
			}
			
			add_close_listeners.defer();
	
			// Show menu
			menu_chunk.style.visibility	= '';
		}
	}
}