/**
 * @class Changes paragraph styles.
 *
 * @base UI.Capability
 * @author Eric Naeseth
 * @constructor
 * @param {UI.Loki}	loki	the Loki instance for which the capability is being
 * 							provided
 */
UI.Style_Capability = function Styles(loki)
{
	Util.OOP.inherits(this, UI.Capability, loki, 'Paragraph styles');
	
	var styles = UI.Styles.get(loki.settings.styles);
	var doc_lookup_table = {};
	
	var selected_range;
	var applied_styles; // The hierarchy of styles applicable in context
	var start_container;
	var end_container;
	var active_styles = {}; // A flag map of the styles applicable in context
	
	Util.Object.enumerate(styles, function process_style(identifier, style) {
		var tag = style.tag;
		
		if (!(tag in doc_lookup_table)) {
			doc_lookup_table[tag] = [];
		}
		
		doc_lookup_table[tag].push(style);
		
		style.chosen(loki, this);
	}, this);
	
	/**
	 * Gets the list of styles that are applied (in full) to the current
	 * Loki selection. Styles closest in the tree to the selection are given
	 * first.
	 * @type array
	 */
	this.get_applied_styles = function get_applied_styles()
	{
		return (applied_styles || []);
	}
	
	this.add_menu_items = function add_style_menu_items(menu)
	{
		var group = menu.add_group('Style');
		
		Util.Object.enumerate(styles, function add_style_menu_item(id, style) {
			var active = (style.identifier in active_styles);
			var state = (active)
				? UI.Menu.STATE_ON
				: UI.Menu.STATE_OFF;
			
			group.add_item(new UI.Menu.Item(style.name, [this, function() {
				if (active)
					this.remove(style)
				else
					this.apply(style);
			}], {state: state}));
		}, this);
	}
	
	this.context_changed = function context_changed()
	{
		var selection = loki.get_selection();
		
		if (Util.is_function(selection.getRangeAt)) {
			// OK to use default behavior.
			selected_range = loki.get_selected_range();
		} else if (selection.createRangeCollection) {
			// We're using IE; make sure we get a text range.
			var ie_range_col = selection.createRangeCollection();
			if (ie_range.col.length <= 0)
				return;
			selected_range = ie_range_col.item(0);
		} else {
			throw new Util.Unsupported_Error('W3C or text ranges');
		}
		
		start_container = get_range_container(selected_range, 'start');
		end_container = get_range_container(selected_range, 'end');
		
		applied_styles = [];
		var new_active_styles = {};
		for (var e = start_container; e; e = e.parentNode) {
			var e_style = get_style(e);
			if (!e_style)
				continue;
			
			if (Util.Range.surrounded_by_node(selected_range, e)) {
				// We have a winner!
				
				if (!(e_style.identifier in new_active_styles)) {
					if (e_style.identifier in active_styles) {
						delete active_styles[e_style.identifier];
					} else {
						e_style.selected();
					}
					
					new_active_styles[e_style.identifier] = true;
				}
				
				applied_styles.push({
					style: e_style,
					container: e
				});
			}
		}
		
		// active_styles is now really the styles that were previously active
		// but no longer are
		for (var style_id in active_styles) {
			styles[style_id].deselected();
		}
		
		active_styles = new_active_styles;
	}
	
	function reselect(range)
	{
		(function reselector() {
			Util.Selection.select_range(loki.get_selection(), range);
		}).defer();
	}
	
	function collapse_style_identifier(style)
	{
		if (Util.is_string(style)) {
			if (style in styles) {
				return styles[style];
			} else {
				throw new Error('No style with the identifier "' + style + '"' +
					' is available.');
			}
		} else if (Util.is_valid_object(style) && Util.is_string(style.tag)) {
			return style;
		} else {
			throw new Error('Please provide a valid style.');
		}
	}
	
	function find_conflicting_style(style)
	{
		var category = style.category;
		
		if (!category) {
			// Nothing can conflict.
			return null;
		}
		
		for (var i = 0; i < applied_styles.length; i++) {
			var applied_style = applied_styles[i].style;
			if (applied_style != style && applied_style.category == category) {
				return applied_styles[i];
			}
		}
		
		return null;
	}
	
	function get_applied_container(style)
	{
		for (var i = 0; i < applied_styles.length; i++) {
			if (applied_styles[i].style == style)
				return applied_styles[i].container;
		}
		
		return null;
	}
	
	this.apply = function apply_paragraph_style(style)
	{
		style = collapse_style_identifier(style);
		var conflict = find_conflicting_style(style);
		
		if (!conflict) {
			wrap(collect(start_container, end_container), style);
		} else {
			rewrap(collect(start_container, end_container), style);
		}
		
		reselect(selected_range);
	}
	
	this.remove = function remove_paragraph_style(style)
	{
		style = collapse_style_identifier(style);
		
		var container = get_applied_container(style);
		if (!container) {
			throw new Error('The style "' + style.name + '" does not appear ' +
				' to actually be applied.');
		}
		
		rewrap(collect(start_container, end_container), null);
		
		reselect(selected_range);
	}
	
	function is_paragraph(node)
	{
		return (node.nodeType == Util.Node.ELEMENT_NODE &&
			node.nodeName == 'P');
	}
	
	function get_paragraph(node)
	{
		for (var n = node; n != null; n = n.parentNode) {
			if (is_paragraph(n))
				return n;
		}
		
		return null;
	}
	
	function collect(from, to)
	{
		var nodes = [];
		
		function contained(node)
		{
			return Util.Range.contains_node(selected_range, node);
		}
		
		function get_next(n)
		{
			if (!is_paragraph(n) && n.hasChildNodes() && !contained(n)) {
				return n.firstChild;
			} else if (n.nextSibling) {
				return n.nextSibling;
			} else if (n.parentNode) {
				return n.parentNode.nextSibling;
			} else {
				return null;
			}
		}
		
		var last = get_paragraph(to);
		if (!last)
			return [];
		
		for (var n = get_paragraph(from); n; n = get_next(n)) {
			nodes.push(n);
			if (n == last)
				break;
		}
		
		return nodes;
	}
	
	function get_range_container(range, which)
	{
		var clone;
		
		switch (which) {
			case 'start':
				if (Util.is_valid_object(range.startContainer)) {
					return range.startContainer;
				} else if (range.parentElement) {
					clone = range.duplicate();
					clone.collapse(true);
					return clone.parentElement();
				} else {
					throw new Util.Unsupported_Error("getting a range's " +
						"start container");
				}
				break;
			case 'end':
				if (Util.is_valid_object(range.endContainer)) {
					return range.endContainer;
				} else if (range.parentElement) {
					clone = range.duplicate();
					clone.collapse(false);
					return clone.parentElement();
				} else {
					throw new Util.Unsupported_Error("getting a range's " +
						"end container");
				}
				break;
			default:
				throw new Error('Unknown range container "' + which + '".');
		}
	}
	
	function get_style(node)
	{
		if (node.nodeType != Util.Node.ELEMENT_NODE)
			return null;
		
		var possibles = doc_lookup_table[node.tagName.toUpperCase()];
		if (!possibles)
			return null;
		
		var len = possibles.length;
		var found;

		var lookup = {};
		var node_classes = Util.Element.get_class_array(node);
		for (var c = 0; c < node_classes.length; c++) {
			lookup[node_classes[c]] = true;
		}
		
		for (var i = 0; i < len; i++) {
			var possible = possibles[i];
			found = true;
			
			for (var j = 0; j < possible.classes.length; j++) {
				if (!(possible.classes[i] in lookup)) {
					found = false;
					break;
				}
			}
			
			if (found) {
				return possible;
			}
		}
		
		return null;
	}
	
	/**
	 * Creates a new container for the application of the given style.
	 * @param {object}	style	the style
	 * @return the new container
	 * @type {HTMLElement}
	 */
	function create_style_container(style)
	{
		if (!style)
			return null;
			
		var props = (style.classes && style.classes.length > 0)
			? {className: style.classes}
			: null;
		
		return Util.Document.create_element(loki.document, style.tag, props);
	}
	
	function wrap(elements, style)
	{
		var new_container = create_style_container(style);
		
		var first_el = elements[0];
		first_el.parentNode.insertBefore(new_container, first_el);
		
		for (var i = 0; i < elements.length; i++) {
			new_container.appendChild(elements[i]);
		}
		
		return new_container;
	}
	
	function rewrap(elements, style)
	{
		var first = elements[0];
		var last = elements[elements.length - 1];
		
		// Verify the sanity of the situation.
		if (first.parentNode != last.parentNode) {
			throw new Error('Unable to rewrap elements in a new paragraph ' +
				'style that have different parent nodes.');
		}
		
		var old_container = first.parentNode;
		var new_container; // don't create it yet in case we switch to replace()
		
		function add_to_new()
		{
			for (var i = 0; i < elements.length; i++) {
				new_container.appendChild(elements[i]);
			}
		}
		
		function add_before(target)
		{
			var p = target.parentNode;
			
			for (var i = 0; i < elements.length; i++) {
				p.insertBefore(elements[i], target);
			}
		}
		
		function get_prev_element(el)
		{
			for (var n = el.previousSibling; n; n = n.previousSibling) {
				if (n.nodeType == Util.Node.ELEMENT_NODE)
					return n;
			}
			return null;
		}
		
		function get_next_element(el)
		{
			for (var n = el.nextSibling; n; n = n.nextSibling) {
				if (n.nodeType == Util.Node.ELEMENT_NODE)
					return n;
			}
			return null;
		}
		
		var before = get_prev_element(first);
		var after = get_next_element(last);
		
		if (!before) {
			// Starting at the first child of the old container.
			
			if (!after) {
				// and ending at the last child. Replace the container instead.
				return replace(first.parentNode, style);
			}
			
			new_container = create_style_container(style);
			if (new_container) {
				old_container.parentNode.insertBefore(new_container,
					old_container);
				add_to_new();
			} else {
				add_before(old_container);
			}
		} else if (!after) {
			// Ending at the last child of the old container.
			
			new_container = create_style_container(style);
			var reference = old_container.nextSibling;
			if (new_container) {
				old_container.parentNode.insertBefore(new_container,
					reference); // OK even if reference is null; see W3C spec.
				add_to_new();
			} else {
				add_before(reference);
			}
		} else {
			// Working somewhere in the middle of the old container.
			
			new_container = create_style_container(style);
			var aft_container = old_container.cloneNode(false);
			var reference = old_container.nextSibling; // ok if null; see spec
			if (new_container) {
				old_container.parentNode.insertBefore(new_container, reference);
				add_to_new();
			} else {
				add_before(reference);
			}
			
			old_container.parentNode.insertBefore(aft_container, reference);
			for (var ae = after; ae; ae = ae.nextSibling) {
				aft_container.appendChild(ae);
			}
		}
		
		return new_container;
	}
	
	function replace(el, new_style)
	{
		if (!Util.is_valid_object(el) || !el.tagName)
			throw new TypeError();
			
		if (!new_style) {
			return remove(el);
		}
		
		var new_container = create_style_container(new_style);
		while (el.firstChild) {
			new_container.appendChild(el.firstChild);
		}
		
		el.parentNode.replaceChild(new_container, el);
		
		return new_container;
	}
	
	function remove(style_container)
	{
		var parent = style_container.parentNode;
		
		while (style_container.firstChild)
			parent.insertBefore(style_container.firstChild, style_container);
		
		return parent.removeChild(style_container);
	}
}