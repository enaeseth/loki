/**
 * @class Allows the creation and editing of links.
 * @base UI.Capability
 * @author Eric Naeseth
 * @constructor
 * @param {UI.Loki}
 */
UI.Link_Capability = function Links(loki)
{
	Util.OOP.inherits(this, UI.Capability, loki, 'Linking');
	
	var dialog = null;
	var cap = this;
	var LinkBubble = UI.Bubble.create({
		link: null,
		
		materialize: function materialize(body, link)
		{
			this.link = link;
			
			function add(e) {
				body.appendChild(e);
			}
			
			add(this._text('Link to: '));
			add(this._link(link.title || link.href, link.href));
			add(this._separator());
			add(this._action('Edit', 'execute', cap));
			add(this._separator());
			add(this._action('Remove', 'delete_link', cap))
		},
		
		dematerialize: function dematerialize()
		{
			this.link = null;
		}
	});
	
	var bubble = new LinkBubble(loki);
	
	this.activate = function activate(initial)
	{
		if (initial)
			loki.bubbler.add(bubble, 'link');
	}
	
	this.context_changed = (function extend_cc(original) {
		return function context_changed() {
			original.call(this);
			
			var link = get_selected_link();
			if (link && link != bubble.link) {
				loki.bubbler.show(bubble, link);
			} else if (!link) {
				loki.bubbler.close(bubble);
			}
		};
	})(this.context_changed);
	
	this.execute = function execute()
	{
		if (!dialog) {
			dialog = new UI.Link_Dialog();
		}
		
		dialog.init(loki, {
			anchor_names: this.get_anchor_names(),
			base_uri: loki.settings.base_uri,
			submit_listener: insert_link.bind(this),
			selected_item: this.get_selected_item(),
			sites_feed: loki.settings.sites_feed,
			finder_feed: loki.settings.finder_feed,
			default_site_regexp: loki.settings.default_site_regexp,
			default_type_regexp: loki.settings.default_type_regexp,
		});
		
		dialog.open();
	}
	
	this.delete_link = function delete_link()
	{
		insert_link.call(this, {});
	}
	
	this.add_menu_items = function add_menu_items(menu)
	{
		var selected = this.is_selected();
		if (!selected && this.is_selection_empty())
			return;
		
		var group = menu.add_group('Link');
		var edit_text = (selected) ? 'Edit link' : 'Create link';
		
		group.add_item(new UI.Menu.Item(edit_text, [this, 'execute']));
		
		if (selected) {
			group.add_item(new UI.Menu.Item('Delete link',
				[this, 'delete_link']));
		}
	}
	
	function insert_link(params)
	{
		var uri = params.uri || '';
		var new_window = !!params.new_window || false;
		var title = params.title || '';
		var onclick = params.onclick || '';
		
		var a_tag;
		
		// If the selection is inside an existing link, select that link.
		var sel = this.get_selection();
		var rng = Util.Range.create_range(sel);
		var ancestor =
			Util.Range.get_nearest_ancestor_element_by_tag_name(rng, 'A');
		
		if (ancestor && ancestor.href) {
			a_tag = ancestor;
		} else {
			loki.exec_command('CreateLink', false, 'http://temporary/');
			
			var sources = [Util.Range.get_common_ancestor(rng), loki.document];
			for (var i = 0; i < sources.length; i++) {
				var links = sources[i].getElementsByTagName('A');
				a_tag = Util.Array.find(links, function is_the_new_link(link) {
					return link.href == 'http://temporary/';
				});
				
				if (a_tag)
					break;
			}
		}
		
		if (!a_tag) {
			throw new Error('Failed to find the link that Loki just created.');
		}
		
		if (!uri.length) { // If the URI is empty, remove the link.
			Util.Node.replace_with_children(a_tag);
		} else { // Otherwise, actually add/update the link attribuets.
			a_tag.href = uri;
			
			if (new_window)
				a_tag.target = '_blank';
			else
				a_tag.removeAttribute('title');
			
			if (title)
				a_tag.title = title;
			else
				a_tag.removeAttribute('title');
			
			if (onclick)
				a_tag.setAttribute('loki:onclick', onclick);
			else
				a_tag.removeAttribute('loki:onclick');
			
			// Collapse selection to end so people can see the link and
			// to avoid a Gecko bug that the anchor tag is only sort of
			// selected (such that if you click the anchor toolbar button
			// again without moving the selection at all first, the new
			// link is not recognized).
			Util.Selection.collapse(this.get_selection(), false); // to end
		}
	}
	
	function get_selected_link()
	{
		var sel = Util.Selection.get_selection(loki.window);
		var rng = Util.Range.create_range(sel);
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
		
		return ancestor;
	}
	
	/**
	 * Returns info about the selected link, if any.
	 */
	this.get_selected_item = function()
	{
		var ancestor = get_selected_link();
		var uri = '', new_window = null, title = '';

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
		
		return {
			uri: uri,
			httpless_uri: httpless_uri,
			new_window: new_window,
			title: title
		};
	};

	this.is_selected = function()
	{
		return this.get_selected_item().uri != '';
	};
	
	/**
	 * Returns an array of the names of named anchors in the current document.
	 */
	this.get_anchor_names = function get_anchor_names()
	{
		var ac = loki.get_capability('anchors');
		if (ac) {
			return ac.get_anchors().pluck('name');
		}
		
		var anchors = loki.document.getElementsByTagName('A');
		var names = [];
		for (var i = 0; i < anchors.length; i++) {
			if (anchors[i].name)
				names.push(anchors[i].name);
		}
		
		return names;
	};
	
	this._determine_relevancy = function _determine_relevancy()
	{
		return !this.is_selection_empty() || this.is_selected();
	}
	
	this._determine_illumination = this.is_selected;
	
	this._add_keybinding('Ctrl K');
	this._add_button('link.gif', 'Create link').autofocus = false;
}