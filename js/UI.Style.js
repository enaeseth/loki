/**
 * @class The base class for styles that apply to block level elements.
 * @constructor
 * @author Eric Naeseth
 * @extends UI.Event_Target
 *
 * @param {string}	identifier	a short string used for selecting the style
 * @param {string}	name	a descriptive name for the style
 * @param {string}	tag		the name of the tag of the style's container
 * @param {string}	class_name	the name of the CSS class that this style uses
 */
UI.Style = function Style(identifier, name, tag, class_name)
{
	Util.OOP.mixin(this, UI.Event_Target);
	
	/**
	 * A short string used for selecting the style.
	 * @type string
	 */
	this.identifier = identifier;
	
	/**
	 * The descriptive, displayable name of the style.
	 * @type string
	 */
	this.name = name;
	
	/**
	 * The tag name of the element that this style modifies.
	 * @type string
	 */
	this.tag = tag;
	
	/**
	 * The name of the class that this style applies to an element.
	 * @type string
	 */
	this.class_name = class_name;
	
	/**
	 * Checks if the given element is an instance of this style.
	 * @param {Node}	node	the node to check
	 * @return {boolean}	true if the element is an instance, false if not
	 */
	this.is_instance = function node_is_instance_of_style(node)
	{
		if (node.nodeType != Util.Node.ELEMENT_NODE)
			return false;
		
		return (node.nodeName == this.tag && 
			Util.Element.has_class(node, this.class_name));
	}
	
	/**
	 * Applies the style.
	 * @param {UI.Style.Context}	context
	 * @return {void}
	 */
	this.apply = function apply_style(context)
	{
		throw new Error('Abstract method UI.Style.apply called.');
	}
	
	/**
	 * Removes the style.
	 * @param {UI.Style.Context}	context
	 * @return {void}
	 */
	this.remove = function remove_style(context)
	{
		throw new Error('Abstract method UI.Style.remove called.');
	}
	
	/**
	 * Checks to see if this style conflicts with another style.
	 * The default implementation always returns false.
	 * @param {UI.Style}	style	the style to check for a conflict with
	 * @return {boolean}	true if there was a conflict, false otherwise
	 */
	this.conflicts_with = function conflicts_with_style(style)
	{
		return false;
	}
}

/**
 * @class The class of UI events relating to styles.
 * @constructor
 * @extends UI.Event
 * @author Eric Naeseth
 *
 * @param {string}	type	the type of event
 * @param {UI.Loki}	loki	the instance of Loki that generated the event
 * @param {object}	styler
 */
UI.Style.Event = function StyleEvent(type, loki, styler)
{
	Util.OOP.inherits(this, UI.Event, type);
	
	/**
	 * The instance of Loki that generated the event.
	 * @type UI.Loki
	 */
	this.loki = loki;
	
	/**
	 * @type object
	 */
	this.styler = styler;
}

/**
 * @class Finds all styles relevant to a selection.
 * @constructor
 * @author Eric Naeseth
 *
 * @param {object}	manager	style manager
 * @param {Selection}	selection editing document selection
 * @param {Range}	selected_range
 * @param {array}	hierarchy	the hierarchy of active styles
 */
UI.Style.Context = function StyleContext(manager, selection, selected_range,
	style_hierarchy)
{
	if (!Util.is_valid_object(manager)) {
		throw new TypeError('A style manager must be provided to a context.');
	}
	
	if (!Util.is_function(manager.get_styles_for_tag, manager.is_active)) {
		throw new TypeError('An invalid style manager was provided.');
	}
	
	/**
	 * The style manager for this context.
	 * @type object
	 */
	this.manager = manager;
	
	/**
	 * The editing document selection.
	 * @type Selection
	 */
	this.selection = selection;
	
	/**
	 * The range that is selected in the editing document.
	 * @type Range
	 */
	this.range = range;
	
	/**
	 * The hierarchy of styles.
	 * Each element of the array is an object with two members: style, which
	 * is the UI.Style object representing the style; and element, which is the
	 * element as which the style has been instantiated in the document.
	 * @type array
	 */
	this.hierarchy = style_hierarchy;
	
	
	/**
	 * Finds the nearest node in the hierarchy that has or conflicts with the
	 * given style.
	 * @param	{UI.Style}	style
	 * @return {object}	a hierarchy node or null if no matching one was found
	 */
	this.get_relevant_instance = function get_relevant_style_instance(style)
	{
		return hierarchy.find(function is_relevant_to_style(node) {
			if (node.style == style || style.conflicts_with(node.style))
				return true;
		}) || null;
	}
	
	/**
	 * Collects all paragraphs in the selected range.
	 * @return {array}	all of the paragraphs in the selected range
	 */
	this.collect_paragraphs = function collect_selected_paragraphs()
	{
		var bounds = get_paragraphs();
		var paras = [];
		
		function get_next(n)
		{
			if (!is_paragraph(n) && n.hasChildNodes()) {
				return n.firstChild;
			} else if (n.nextSibling) {
				return n.nextSibling;
			} else if (n.parentNode) {
				return n.parentNode.nextSibling;
			} else {
				return null;
			}
		}
		
		for (var n = bounds.start; n; n = get_next(n)) {
			if (is_paragraph(n))
				paras.push(n);
			if (n == bounds.end)
				break;
		}
		
		return paras;
	}
	
	/**
	 * Collects all nodes that are or lie between the paragraphs at each end
	 * of the selection.
	 * @return {array}
	 */
	this.collect_all = function collect_all()
	{
		var bounds = get_paragraphs();
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
		
		for (var n = bounds.start; n; n = get_next(n)) {
			nodes.push(n);
			if (n == bounds.end)
				break;
		}
		
		return nodes;
	}
	
	function is_paragraph(node)
	{
		return (node && node.nodeType == Util.Node.ELEMENT_NODE &&
			node.nodeName == 'P');
	}
	
	/*
	 * Determines whether or not an end of the range is just before or just
	 * after (depending on the end being looked at) a paragraph.
	 * Only works for W3C ranges, but that's really all we need this for.
	 */
	function adjoins_paragraph(use_start)
	{
		function is_element(node)
		{
			return node && node.nodeType == Util.Node.ELEMENT_NODE;
		}
		
		if (use_start) {
			return (is_element(range.startContainer) &&
				is_paragraph(range.startContainer[range.startOffset]));
		} else {
			return (is_element(range.endContainer) &&
				is_paragraph(range.endContainer[range.endOffset - 1]));
		}
	}
	
	/*
	 * Gets the paragraphs that are relevant to each end of the range.
	 */
	function get_paragraphs()
	{
		/*
		 * If the node is not a paragraph, get the paragraph that is an ancestor
		 * of the node.
		 */
		function get_node_paragraph(node)
		{
			for (var n = node; n != null; n = n.parentNode) {
				if (is_paragraph(n))
					return n;
			}
	
			// In all contexts where you would need a node's ancestor paragraph
			// when working with styles (probably everything except table cells)
			// there should be one if other parts of Loki are working correctly.
			throw new Error('Node ' + Util.Node.get_debug_string(node) +
				'has no paragraphs for ancestors.');
		}
		
		// Util.Range.get_(start|end)_container were written by Nathanael and,
		// while useful, don't really duplicate the behavior that we want here
		// for W3C ranges.
		return {
			start: (adjoins_paragraph(true))
				? range.startContainer[range.startOffset]
				: get_node_paragraph(Util.Range.get_start_container(range)),
			end: (adjoins_paragraph(false))
				? range.endContainer[range.endOffset - 1]
				: get_node_paragraph(Util.Range.get_end_container(range))
		};
	}
}
