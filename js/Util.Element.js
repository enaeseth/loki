/**
 * @class Container for functions relating to document elements.
 */
Util.Element = {
	/**
	 * Gets an element's computed styles.
	 * @param {Window}	window	the element's window
	 * @param {Element}	elem	the element whose computed style is desired
	 * @type object
	 */
	get_computed_style: function get_element_computed_style(window, elem)
	{
		if (!Util.is_valid_object(window, elem)) {
			throw new TypeError('Valid window and element objects must be ' +
				'provided to Util.Element.get_computed_style.');
		}
		
		if (!elem.nodeType || elem.nodeType != Util.Node.ELEMENT_NODE) {
			throw new TypeError('An element node must be provided to ' + 
				'Util.Element.get_computed_style');
		}
		
		if (Util.is_function(window.getComputedStyle)) {
			return window.getComputedStyle(elem, null);
		} else if (Util.is_valid_object(elem.currentStyle)) {
			return elem.currentStyle;
		} else {
			throw new Util.Unsupported_Error('getting an element\'s computed ' +
				'style');
		}
	},
	
	/**
	 * Tests whether or not an element is at block-level.
	 * Cf. Util.Node.is_block_level_element; this uses different logic.
	 * @param {Window}	window	the element's window
	 * @param {Element}	elem	the element whose block level status is desired
	 * @type boolen
	 */
	is_block_level: function is_block_level_element(window, elem)
	{
		var s = Util.Element.get_computed_style(window, elem);
		
		try {
			return s.display == 'block';
		} catch (e) {
			var ex = new Error('Unable to get the computed style for ' +
				Util.Node.get_debug_string(elem) + '.');
			ex.cause = e;
			throw ex;
		}
	},
	
	/**
	 * Returns the attributes of an element.
	 * @param {Element}	elem
	 * @return {object}	an object whose keys are attribute names and whose
	 *					values are the corresponding values
	 */
	get_attributes: function get_element_attributes(elem)
	{
		var attrs = {};
		
		if (!Util.is_valid_object(elem)) {
			throw new TypeError('Cannot get the attributes of a non-object.');
		}
		
		if (elem.nodeType != Util.Node.ELEMENT_NODE || !elem.hasAttributes())
			return attrs;
		
		for (var i = 0; i < elem.attributes.length; i++) {
			var a = elem.attributes[i];
			if (!a.specified || a.nodeName in attrs)
				continue;
				
			var v = (a.nodeValue.toString)
				? a.nodeValue.toString()
				: a.nodeValue;
			
			switch (a.nodeName) {
				case 'class':
					attrs.className = v;
					break;
				case 'for':
					attrs.htmlFor = v;
					break;
				default:
					attrs[a.nodeName] = v;
			}
		}
		
		return attrs;
	},
	
	/**
	 * Tests if the element is "basically empty".
	 * An element is basically empty if:
	 *    - It contains no image, horizontal rule, or table elements, and
	 *    - It contains no non-whitespace (spaces, tabs, or line breaks) text.
	 * @param {Element}	elem	the element whose emptiness will be tested
	 * @return {boolean}	true if the element is basically empty, false if not
	 *
	 * Logic from TinyMCE.
	 */
	is_basically_empty: function element_is_basically_empty(elem)
	{
		if (elem.nodeType != Util.Node.ELEMENT_NODE) {
			throw new TypeError('Must provide an element node to ' +
				'Util.Element.is_basically_empty(); instead got ' +
				Util.Node.get_debug_string(elem));
		}
		
		var doc = elem.ownerDocument;
		var non_whitespace = /[^ \t\r\n]/;
		var acceptable_tags;
		
		if (doc.createTreeWalker && NodeFilter) {
			// Browser supports DOM Level 2 Traversal; use it in the hope that
			// it will be faster than the other branch which uses string
			// manipulations.
			
			// This map must stay in sync with the pattern in the next branch.
			acceptable_tags = {IMG: true, HR: true, TABLE: true};
			
			var filter = {
				acceptNode: function accept_node_for_emptiness_check(node) {
					switch (node.nodeType) {
						case Util.Node.TEXT_NODE:
							// Allow text nodes through if they have
							// non-whitespace characters so that the code below
							// can safely return false whenever it receives a
							// text node.
							return (non_whitespace.test(node.nodeValue))
								? NodeFilter.FILTER_ACCEPT
								: NodeFilter.FILTER_REJECT
						case Util.Node.ELEMENT_NODE:
							// Similarly, allow elements through only if they're
							// one of the acceptable tags so that the code below
							// will know what to do instantly. But, skip a non-
							// acceptable element instead of rejecting it
							// outright so that any of its descendant text nodes
							// can be processed.
							return (node.tagName in acceptable_tags)
								? NodeFilter.FILTER_ACCEPT
								: NodeFilter.FILTER_SKIP;
						default:
							// No other types should be making it through
							// because of our choice of whatToShow below, but
							// be defensive anyway.
							return NodeFilter.FILTER_SKIP;
					}
				}
			};
			
			var walker = doc.createTreeWalker(elem,
				NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, filter, false);
			
			// Because of our filtering above, if we get any next node back
			// (the next node can be any node below our root, which is the
			// element being tested), we know that the element is not empty.
			// If we get nothing back, that means that the tree walker went
			// through all of the ancestors without finding a node that our
			// filter accepted, and thus the element is empty.
			return !walker.nextNode();
		} else {
			// No traversal support. Look at the element's inner HTML.
			
			// This pattern must be kept in sync with the map in the previous
			// branch.
			acceptable_tags = /^<(img|hr|table)$/ig;
			
			var html = elem.innerHTML;
			
			// Preserve our acceptable tags from being eliminated on the next
			// replacement.
			html = html.replace(acceptable_tags, 'k');
			
			// Remove all non-preserved tags.
			html = html.replace(/<[^>]+>/g, '');
			
			// Check to see if what's remaining contains any non-whitespace
			// characters; if it does, then the element is non-empty.
			return !non_whitespace.test(html);
		}
	},
	
	/**
	 * Adds a class to an element.
	 * @param {Element}	elem	the element to which the class will be added
	 * @param {string}	class_name	the name of the class to add
	 * @type void
	 */
	add_class: function add_class_to_element(elem, class_name)
	{
		var classes = Util.Element.get_class_array(elem);
		classes.push(class_name);
		Util.Element.set_class_array(elem, classes);
	},
	
	/**
	 * Removes a class from an element.
	 * @param {Element}	elem	the element from which the class will be removed
	 * @param {string}	class_name	the name of the class to remove
	 * @type void
	 */
	remove_class: function remove_class_from_element(elem, class_name)
	{
		var classes = Util.Element.get_class_array(elem);

		for (var i = 0; i < classes.length; i++) {
			if (classes[i] == class_name)
				classes.splice(i, 1);
		}

		Util.Element.set_class_array(elem, classes);
	},
	
	/**
	 * Checks if an element has a particular class.
	 * @param {Element}	elem	the element to check
	 * @param {string}	class_name	the name of the class to check for
	 * @return true if the element has the class, false otherwise
	 * @type boolean
	 */
	has_class: function element_has_class(elem, class_name)
	{
		return Util.Element.get_class_array(elem).contains(class_name);
	},
	
	/**
	 * Checks if an element has all of the given classes.
	 * @param {Element}	elem	the element to check
	 * @param {mixed}	classes	either a string or an array of class names
	 * @return true if the element has all of the classes, false if otherwise
	 * @type boolean
	 */
	has_classes: function element_has_classes(elem, classes)
	{
		if (Util.is_string(classes))
			classes = classes.split(/s+/);
		
		var element_classes = Util.Element.get_class_array(elem);
		return classes.every(function check_one_element_class(class_name) {
			return element_classes.contains(class_name);
		});
	},
	
	/**
	 * Returns a string with all of an element's classes or null.
	 * @param {Element}	elem
	 * @type string
	 */
	get_all_classes: function get_all_classes_from_element(elem)
	{
		return (Util.is_valid_object(elem))
			? elem.getAttribute('class') || elem.getAttribute('className')
			: null;
	},
	
	/**
	 * Gets all of an element's classes as an array.
	 * @param {Element}	elem
	 * @type array
	 */
	get_class_array: function get_array_of_classes_from_element(elem)
	{
		return (elem.className && elem.className.length > 0)
			? elem.className.split(/\s+/)
			: [];
	},
	
	/**
	 * Sets all of the classes on an element.
	 * @param {Element} elem
	 * @param {string} class_names
	 * @type void
	 */
	set_all_classes: function set_all_classes_on_element(elem, class_names)
	{
		elem.className = all_classes;
	},
	
	/**
	 * Sets all of the classes on an element.
	 * @param {Element} elem
	 * @param {array} class_names
	 * @type void
	 */
	set_class_array: function set_array_of_classes_on_element(elem, class_names)
	{
		if (class_names.length == 0)
			Util.Element.remove_all_classes(elem);
		else
			elem.className = class_names.join(' ');
	},
	
	/**
	 * Removes all of an element's classes.
	 * @param {Element}	elem
	 * @type void
	 */
	remove_all_classes: function remove_all_classes_from_element(elem)
	{
		elem.removeAttribute('className');
		elem.removeAttribute('class');
	},
	
	/**
	 * Returns an element's name's prefix or an empty string if there is none.
	 * (e.g. <o:p> --> 'o';  <p> --> '')
	 * @param {Element}	elem
	 * @type string
	 */
	get_prefix: function get_element_name_prefix(elem)
	{
		function get_gecko_prefix()
		{
			var parts = node.tagName.split(':');
			return (parts.length >= 2) ? parts[0] : '';
		}
		
		return node.prefix || node.scopeName || get_gecko_prefix();
	},
	
	/**
	 * Finds the absolute position of the element; i.e. its position relative to
	 * the window.
	 * @param {HTMLElement} elem
	 * @type object
	 */
	get_position: function get_element_position(elem)
	{
		var pos = {x: 0, y: 0};
		
		// Loop through the offset chain.
		for (var e = elem; e; e = e.offsetParent) {
			pos.x += (Util.is_number(e.offsetLeft))
			 	? e.offsetLeft
				: e.screenLeft;
			pos.y += (Util.is_number(e.offsetTop))
			 	? e.offsetTop
				: e.screenTop;
		}
		
		return pos;
	},
	
	/**
	 * For each element out of the given element and its ancestors that has a
	 * CSS position of "relative", sums up their x and y offsets and returns
	 * them.
	 * @param {Window}	window	the element's window
	 * @param {HTMLElement}	elem	the element to test
	 * @return {object}	x and y offsets
	 */
	get_relative_offsets: function get_element_relative_offsets(window, elem)
	{
		if (!Util.is_valid_object(window, elem)) {
			throw new TypeError('Must provide valid window and element ' +
				'objects to Util.Event.get_relative_offsets().');
		}
		
		var pos = {x: 0, y: 0};
		
		for (var e = elem; e && e.nodeName != 'HTML'; e = e.parentNode) {
			var position = Util.Element.get_computed_style(window, e).position;
			if (position == 'relative') {
				pos.x += e.offsetLeft;
				pos.y += e.offsetTop;
			}
		}
		
		return pos;
	},
	
	/**
	 * Gets the last "relevant" child of an element; the last child that is
	 * either an element or a text node that contains non-whitespace characters.
	 * @param {Element} n the element whose last relevant child is desired
	 * @reutrn {Node} the last relevant child, or null if there was none
	 */
	get_last_relevant_child: function get_last_relevant_child_of_element(n)
	{
		var c; // child
		for (c = n.lastChild; c; c = c.previousSibling) {
			if (c.nodeType == Util.Node.ELEMENT_NODE) {
				return c;
			} else if (c.nodeType == Util.Node.TEXT_NODE) {
				if (/\S/.test(c.nodeValue))
					return c;
			}
		}
		
		return null;
	}
};
