/**
 * Declares instance variables.
 *
 * @constructor
 *
 * @class A class for helping insert link. Contains code
 * common to both the button and the menu item.
 */
UI.Link_Helper = function()
{
	var self = this;
	Util.OOP.inherits(this, UI.Helper);

	this.check_for_linkable_selection = function()
	{
		var sel = Util.Selection.get_selection(self._loki.window);
		var rng = Util.Range.create_range(sel);
		return ( !Util.Selection.is_collapsed(sel) || self.is_selected() )
	};

	/**
	 * Opens the page link dialog.
	 */
	this.open_page_link_dialog = function()
	{
		if ( !this.check_for_linkable_selection() )
		{
			alert('First select some text that you want to make into a link.');
			return;
		}

		if ( this._page_link_dialog == null )
			this._page_link_dialog = new UI.Page_Link_Dialog();
		this._page_link_dialog.init(self._loki,
									{ base_uri : this._loki.settings.base_uri,
						    		  anchor_names : this.get_anchor_names(),
						    		  submit_listener : this.insert_link,
						    		  selected_item : this.get_selected_item(),
						    		  sites_feed : this._loki.settings.sites_feed,
									  finder_feed : this._loki.settings.finder_feed,
									  default_site_regexp : 
										this._loki.settings.default_site_regexp,
									  default_type_regexp : 
										this._loki.settings.default_type_regexp });
		this._page_link_dialog.open();
	};

	/**
	 * Returns info about the selected link, if any.
	 */
	this.get_selected_item = function()
	{
		var sel = Util.Selection.get_selection(this._loki.window);
		var rng = Util.Range.create_range(sel);

		// Look around selection
		var uri = '', new_window = null, title = '';
		var ancestor = Util.Range.get_nearest_ancestor_element_by_tag_name(rng, 'A');
		
		// (Maybe temporary) hack for IE, because the above doesn't work for 
		// some reason if a link is double-clicked
		// 
		// Probably the reason the above doesn't work is that get_nearest_ancestor_node
		// uses get_start_container, which, in IE, collapses a duplicate of the range
		// to front, then gets parentElement of that range. When we doubleclick on a link
		// the text of the entire link (assuming it is one word long) is selected. When a 
		// range is made from such a selection, it is considered _inside_ the A tag, which 
		// is what we want and I, at least, expect. But when the range is collapsed, it 
		// ends up (improperly, I think) _before_ the A tag.
		if ( ancestor == null && rng.parentElement && rng.parentElement().nodeName == 'A' )
		{
			ancestor = rng.parentElement();
		}

		if ( ancestor != null )
		{
			uri = ancestor.getAttribute('href');
			new_window = ( ancestor.getAttribute('target') &&
						   ancestor.getAttribute('target') != '_self' &&
						   ancestor.getAttribute('target') != '_parent' &&
						   ancestor.getAttribute('target') != '_top' );
			title = ancestor.getAttribute('title');
		}

		uri = uri.replace( new RegExp('\%7E', 'g'), '~' ); //so that users of older versions of Mozilla are not confused by this substitution
		var httpless_uri = Util.URI.strip_https_and_http(uri);

		var selected_item = { uri : uri, httpless_uri : httpless_uri, new_window : new_window, title : title };
		return selected_item;
	};

	this.is_selected = function()
	{
		return ( this.get_selected_item().uri != '' );
	};

	/**
	 * Returns an array of the names of named anchors in the current document.
	 */
	this.get_anchor_names = function()
	{
		var anchor_names = new Array();

		var anchor_masseuse = (new UI.Anchor_Masseuse).init(this._loki);
		anchor_masseuse.unmassage_body();

		var anchors = this._loki.document.getElementsByTagName('A');
		for ( var i = 0; i < anchors.length; i++ )
		{
			if ( anchors[i].getAttribute('name') ) // && anchors[i].href == false )
			{
				anchor_names.push(anchors[i].name);
			}
		}
		
		anchor_masseuse.massage_body();
		
		return anchor_names;
	};

	/**
	 * Inserts a link. Params contains uri, and optionally
	 * new_window, title, and onclick. If uri is empty string,
	 * any link is removed.
	 */
	this.insert_link = function(params)
	{
		var uri = params.uri;
		var new_window = params.new_window || false;
		var title = params.title || '';
		var onclick = params.onclick || '';
		
		var tags;

		// If the selection is inside an existing link, select that link
		var sel = Util.Selection.get_selection(self._loki.window);
		var rng = Util.Range.create_range(sel);
		var ancestor = Util.Range.get_nearest_ancestor_element_by_tag_name(rng, 'A');
		if (ancestor && ancestor.getAttribute('href')) {
			tags = [ancestor];
		} else {
			self._loki.exec_command('CreateLink', false, 'hel_temp_uri');
			var links = self._loki.document.getElementsByTagName('A');
			tags = [];
			
			for (var i = 0; i < links.length; i++) {
				if (links[i].getAttribute('href') == 'hel_temp_uri') {
					tags.push(links[i]);
				}
			}
		}
		
		if (!uri || !uri.length) {
			// If no URI received, remove the links.
			tags.each(function remove_link(tag) {
				Util.Node.replace_with_children(tag);
			});
		} else {
			// Update link attributes.
			tags.each(function update_link(tag) {
				function set_attribute(name, value) {
					if (value && value.length > 0)
						tag.setAttribute(name, value);
					else
						tag.removeAttribute(name);
				}
				
				set_attribute('href', uri);
				set_attribute('target', (new_window) ? '_blank' : null);
				set_attribute('title', title);
				set_attribute('loki:onclick', onclick);
			});
			
			// Collapse selection to end so people can see the link and
			// to avoid a Gecko bug that the anchor tag is only sort of
			// selected (such that if you click the anchor toolbar button
			// again without moving the selection at all first, the new
			// link is not recognized).
			var sel = Util.Selection.get_selection(self._loki.window);
			Util.Selection.collapse(sel, false); // to end
		}
	};
};
