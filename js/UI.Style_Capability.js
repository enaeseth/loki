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
	
	var range;
	var applied_styles;
	var start_container;
	var end_container;
	
	Util.Object.enumerate(styles, function (identifier, style) {
		var tag = style.tag;
		
		if (!(tag in doc_lookup_table)) {
			doc_lookup_table[tag] = [];
		}
		
		doc_lookup_table[tag].push({
			classes: style.classes,
			style: style
		});
		
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
	
	this.activate = function activate()
	{
		
	}
	
	this.context_changed = function context_changed()
	{
		var selection = loki.get_selection();
		
		if (Util.is_function(selection.getRangeAt)) {
			selected_range = loki.get_selected_range(); // OK to use default behavior
		} else if (Util.is_function(selection.createRangeCollection)) {
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
		
		var queue = [start_container];
		/*
		while (queue.length) {
			for (var n = queue.shift(); n; n = n.nextSibling) {
				if (n.hasChildNodes()) {
					queue.push(n.firstChild);
				}
			}
		}
		*/
		applied_styles = [];
		for (var e = start_container; e; e = e.parentNode) {
			var e_style = get_style(e);
			if (!e_style)
				continue;
			
			if (Util.Range.surrounded_by_node(selected_range, e)) {
				// We have a winner!
				applied_styles.push({
					style: e_style,
					container: e
				});
			}
		}
		
		console.debug(applied_styles);
		this.apply(null);
	}
	
	this.apply = function apply(style)
	{
		console.debug(collect(start_container, end_container));
	}
	
	function get_paragraph(node)
	{
		for (var n = node; n != null; n = n.parentNode) {
			if (n.nodeType == Util.Node.ELEMENT_NODE && n.nodeName == 'P')
				return n;
		}
		
		return null;
	}
	
	function collect(from, to)
	{
		var nodes = [];
		
		function is_para(n)
		{
			return (n.nodeType == Util.Node.ELEMENT_NODE && n.nodeName == 'P')
		}
		
		function contained(node)
		{
			return Util.Range.contains_node(selected_range, node);
		}
		
		function get_next(node)
		{
			if (!is_para(n) && node.hasChildNodes() && !contained(node)) {
				return node.firstChild;
			} else if (node.nextSibling) {
				return node.nextSibling;
			} else if (node.parentNode) {
				return node.parentNode.nextSibling;
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
				} else if (Util.is_function(range.parentElement)) {
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
				} else if (Util.is_function(range.parentElement)) {
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

		var lookup;
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
	
	function get_relevant_style_container(style, node)
	{
		var relevant_style;
		var info = null;
		
		while (node) {
			if (node.tagName == 'BODY')
				break;
			
			if (relevant_style = get_style(node)) { // assignment intentional
				var conflicting = (relevant_style.category == style.category);
				
				if (conflicting || (!conflicting && !info)) {
					info = {
						style: relevant_style,
						node: node,
						conflicting: conflicting
					};
				}
				
				if (conflicting)
					return info; // hopefully there can only be one conflict!
			}
			
			node = node.parentNode;
		}
		
		return info;
	}
	
	/**
	 * Creates a new container for the application of the given style.
	 * @param {object}	style	the style
	 * @return the new container
	 * @type {HTMLElement}
	 */
	function create_style_container(style)
	{
		return Util.Document.create_element(loki.document, style.tag,
			{className: style.classes}
		);
	}
	
	function wrap(elements, style)
	{
		var new_container = create_style_container(style);
		
		var first_el = elements[0];
		first_el.insertBefore(new_container, first_el);
		
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
			old_container.parentNode.insertBefore(new_container, old_container);
			add_to_new();
		} else if (!after) {
			// Ending at the last child of the old container.
			
			new_container = create_style_container(style);
			var reference = old_container.nextSibling; // ok if null; see spec
			old_container.parentNode.insertBefore(new_container, reference);
			add_to_new();
		} else {
			// Working somewhere in the middle of the old container.
			
			new_container = create_style_container(style);
			var aft_container = old_container.cloneNode(false);
			var reference = old_container.nextSibling; // ok if null; see spec
			old_container.parentNode.insertBefore(new_container, reference);
			old_container.parentNode.insertBefore(aft_container, reference);
			
			add_to_new();
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
		
		var new_container = create_style_container(style);
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