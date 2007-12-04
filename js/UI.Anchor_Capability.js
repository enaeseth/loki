/**
 * @class Allows the creation and editing of anchors.
 * @base UI.Capability
 * @author Eric Naeseth
 * @constructor
 * @param {UI.Loki}
 */
UI.Anchor_Capability = function Anchors(loki)
{
	Util.OOP.inherits(this, UI.Capability, loki, 'Anchors');
	
	var dh;
	var cap = this;
	var bubble = UI.Bubble.create_new(loki, {
		anchor: null,
		
		materialize: function materialize(body, anchor)
		{
			this.anchor = anchor;
			
			function add(e) {
				body.appendChild(e);
			}
			
			var name_span = this._text(cap.get_name_from_placeholder(anchor));
			name_span.style.fontStyle = 'italic';
			
			add(this._text('Anchor: '));
			add(name_span);
			add(this._separator());
			add(this._action('Edit', function() {
				this._select(anchor);
				this.execute(anchor);
			}, cap));
			add(this._separator());
			add(this._action('Remove', function() {
				this.remove_anchor(anchor);
			}, cap));
		},
		
		dematerialize: function dematerialize()
		{
			this.anchor = null;
		}
	});
	var dialog;
	
	this._select = function select(anchor)
	{
		var sel = this.get_selection();
		Util.Selection.select_node(sel, anchor);
	}
	
	this.activate = function activate(first_time)
	{
		if (first_time)
			loki.bubbler.add(bubble, 'anchor');
		dh = new Util.Document(loki.document);
	}
	
	this.context_changed = (function extend(original) {
		return function context_changed()
		{
			original.apply(this, arguments);
			
			var anchor = this.get_selected_anchor_placeholder();
			if (anchor && anchor != bubble.anchor && !bubble.visible)
				loki.bubbler.show(bubble, anchor);
			else if (!anchor)
				loki.bubbler.close(bubble);
		}
	})(this.context_changed);
	
	this.execute = function execute(anchor)
	{
		if (!dialog) {
			dialog = new UI.Anchor_Dialog();
		}
		
		dialog.init({
			base_uri: loki.settings.base_uri,
			submit_listener: function anchor_dialog_submitted(info)
			{
				if (anchor) {
					anchor.setAttribute('loki:anchor_name', info.name);
				} else {
					cap.insert_anchor(info);
				}
			},
			remove_listener: this.remove_anchor.bind(this),
			selected_item: {name: (this.get_selected_anchor_name() || '')}
		});
		dialog.open();
	}
	
	this._determine_illumination = function determine_anchor_illumination()
	{
		return !!this.get_selected_anchor_placeholder();
	}
	
	this.insert_anchor = function insert_anchor(info)
	{
		var dummy = this.create_placeholder(info);
		var sel = this.get_selection();
		Util.Selection.collapse(sel, /* to its beginning */ true);
		Util.Selection.paste_node(sel, dummy);
	}
	
	this.remove_anchor = function remove_anchor(anchor)
	{
		if (!anchor) {
			anchor = this.get_selected_anchor_placeholder();
			if (!anchor) {
				throw new Error('No anchor selected.');
			}
		}
		
		// Move cursor.
		var sel = this.get_selection();
		Util.Selection.select_node(sel, anchor);
		Util.Selection.collapse(sel, /* to its end */ false);
		
		if (anchor.parentNode)
			anchor.parentNode.removeChild(anchor);
	}
	
	this.get_selected_anchor_placeholder = function get_sel_anchor_placeholder()
	{
		var range = Util.Range.create_range(this.get_selection());
		
		var img = Util.Range.get_nearest_ancestor_element_by_tag_name(range,
			'IMG');
		if (img && this.is_placeholder(img))
			return img;
	}
	
	this.get_name_from_placeholder = function get_name_from_placeholder(ph)
	{
		return (ph && ph.getAttribute)
			? ph.getAttribute('loki:anchor_name')
			: undefined;
	}
	
	this.get_selected_anchor_name = function get_selected_anchor_name()
	{
		var placeholder = this.get_selected_anchor_placeholder();
		return this.get_name_from_placeholder(placeholder);
	}
	
	this.get_anchors = function get_anchors()
	{
		var scans = {
			'A': function is_named_anchor(a)
			{
				return !!a.name;
			},
			
			'IMG': function is_placeholder(img)
			{
				return this.is_placeholder(img);
			}
		};
		
		var anchors = [];
		
		for (var name in scans) {
			var elements = loki.document.getElementsByTagName(name);
			anchors.append(Util.Array.find_all(elements, scans[name], this));
		}
		
		return anchors;
	}
	
	this.create_placeholder = function create_placeholder(anchor)
	{
		var name;
		
		if (typeof(anchor) == 'object') {
			if (typeof(anchor.name) == 'string') {
				name = anchor.name;
			} else {
				throw new TypeError('If an object is passed to ' +
					'UI.Anchor_Capability.create_placeholder, it must have a ' +
					'"name" property.');
			}
		} else {
			name = String(anchor);
		}
		
		var placeholder = dh.create_element('img', {
			className: 'loki__anchor_placeholder',
			src: loki.settings.base_uri + 'images/anchor_symbol.gif',
			'loki:fake': 'true',
			'loki:anchor_name': name
		});
		
		Util.Event.observe(placeholder, 'click', function(ev) {
			loki.bubbler.show(bubble, Util.Event.get_target(ev));
		});
		
		return placeholder;
	}
	
	this.is_placeholder = function is_placeholder(node)
	{
		return (node && node.tagName.toLowerCase() == 'img' &&
			node.getAttribute('loki:fake') && 
			node.getAttribute('loki:anchor_name'));
	}
	
	this.create_anchor = function create_anchor(placeholder)
	{
		if (placeholder.tagName == 'A') {
			return placeholder.cloneNode(true);
		} else if (this.is_placeholder(placeholder)) {
			return dh.create_element('a', {
				name: placeholder.getAttribute('loki:anchor_name')
			});
		} else {
			return null;
		}
	}
	
	function AnchorMasseuse(parent)
	{
		Util.OOP.inherits(self, UI.Masseuse, loki);
		
		function replace(old_node, new_node)
		{
			old_node.parentNode.replaceChild(new_node, old_node);
		}
		
		this.massage_node_descendants = function massage_anchors(node)
		{
			var anchors = node.getElementsByTagName('A');
			
			for (var i = anchors.length - 1; i >= 0; i--) {
				var anchor = anchors[i];
				if (anchor.name) {
					replace(anchor, parent.create_placeholder(anchor));
				}
			}
		}
		
		this.unmassage_node_descendants = function unmassage_anchors(node)
		{
			var faux = node.getElementsByTagName('IMG');
			
			for (var i = faux.length - 1; i >= 0; i--) {
				var img = faux[i];
				if (parent.is_placeholder(img)) {
					replace(img, parent.create_anchor(img));
				}
			}
		}
	}
	
	this._add_button('anchorInNav.gif', 'Create anchor').autofocus = false;
	this.masseuses.push(new AnchorMasseuse(this));
}