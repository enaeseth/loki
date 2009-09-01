/**
 * @class Container for functions relating to document elements.
 */
Util.Element = {
	/**
	 * Set of empty elements
	 * @type Object
	 */
	empty: (['BR', 'AREA', 'LINK', 'IMG', 'PARAM', 'HR', 'INPUT', 'COL',
		'BASE', 'META'].toSet()),
		
	/**
	 * Determines if the given node or tag name represents an empty HTML tag.
	 * @param {Element|String}
	 * @return {Boolean}
	 */
	empty_tag: function is_empty_tag(el)
	{
		var tag = (el.nodeName || String(el)).toUpperCase();
		return (tag in Util.Element.empty);
	},
	
	/**
	 * Gets an element's computed styles.
	 * @param {Window}	window	the element's window
	 * @param {Element}	elem	the element whose computed style is desired
	 * @return {object}
	 */
	get_computed_style: function get_element_computed_style(window, elem)
	{
		if (!elem || !Util.is_valid_object(window)) {
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
	 * @return {boolean}
	 */
	is_block_level: function is_block_level_element(window, elem)
	{
		var s;
		
		try {
		    s = Util.Element.get_computed_style(window, elem);
		    if (s.display == 'inline' || s.display == 'none')
		        return false;
		    // Assume that everything else ('block', 'table-cell', 'list-item',
		    // etc.) is a block.
			return true;
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
	 * @param {Boolean} [no_translation=false] if true, attribute names that may
	 * be language keywords (like "class" and "for") will not be translated
	 * @return {Object}	an object whose keys are attribute names and whose
	 *					values are the corresponding values
	 */
	get_attributes: function get_element_attributes(elem, no_translation)
	{
		var attrs = {};
		
		if (!elem) {
			throw new TypeError('No element provided; cannot get attributes.');
		}
		
		if (elem.nodeType != Util.Node.ELEMENT_NODE) {
			return attrs;
		} else if (elem.hasAttributes && !elem.hasAttributes()) {
			return attrs;
		}
		
		var names = Util.Element._get_attribute_names(elem);
		var i, name, v, length = names.length;
		for (i = 0; i < length; i++) {
			name = names[i];
			v = elem.getAttribute(name);
			try {
				v = v.toString();
			} catch (e) {
				// Why not just test for toString? Because IE will throw an
				// exception.
			}
			
			switch (name) {
				case 'class':
				case 'className':
					attrs[(no_translation) ? 'class' : 'className'] = v;
					break;
				case 'for':
				case 'htmlFor':
					attrs[(no_translation) ? 'for' : 'htmlFor'] = v;
					break;
				case 'style':
					attrs.style = elem.style.cssText;
					break;
				default:
					attrs[name] = v;
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
		if (!elem || elem.nodeType != Util.Node.ELEMENT_NODE) {
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
	 * @return {void}
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
	 * @return {void}
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
	 * @return {boolean}
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
	 * @return {boolean}
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
	 * @return {string}
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
	 * @return {array}
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
	 * @return {void}
	 */
	set_all_classes: function set_all_classes_on_element(elem, class_names)
	{
		elem.className = all_classes;
	},
	
	/**
	 * Sets all of the classes on an element.
	 * @param {Element} elem
	 * @param {array} class_names
	 * @return {void}
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
	 * @return {void}
	 */
	remove_all_classes: function remove_all_classes_from_element(elem)
	{
		elem.removeAttribute('className');
		elem.removeAttribute('class');
	},
	
	/**
	 * Find all elements below the given root with a matching class name.
	 * @param {Element|Document} root	the root element
	 * @param {string} classes	the class name(s) to search for
	 * @return {array}	an array (NOT a NodeList) of elements
	 */
	find_by_class: function find_elements_by_class_name(root, classes)
	{
		if (root.getElementsByClassName) { // use native impl. where available
			return Util.Array.from(root.getElementsByClassName(classes));
		}
		
		function xpath_evaluate(expression)
		{
			var results = [];
			var query;
			var i, length;
			
			if (!document.evaluate || !XPathResult) {
				throw new Util.Unsupported_Error("XPath");
			}
			
			query = document.evaluate(expression, root, null,
				XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
			for (i = 0, length = query.snapshotLength; i < length; i++) {
				results.push(query.snapshotItem(i));
			}
			return results;
		}
		
		classes = classes.toString().replace(/^\s*/, '').replace(/\s*$/, '');
		if (document.evaluate) {
			function convert(cn) {
				return (cn.length > 0) ? "[contains(concat(' ', @class, ' '), "
					+ "' " + cn + " ')]" : null;
			}
			var expr = classes.split(/\s+/).map(convert).join('');
			return (expr.length) ? xpath_evaluate('.//*' + expr) : [];
		} else {
			var found = [];
			var children = root.getElementsByTagName("*")
			var child;
			
			classes = classes.split(/\s+/);
			var test = (classes.length == 1)
				? function(e) { return Util.Element.has_class(e, classes[0]); }
				: function(e) { return Util.Element.has_classes(e, classes); };
			
			for (var i = 0; child = children[i]; i++) {
				if (test(child))
					found.push(child);
			}
			
			return found;
		}
	},
	
	/**
	 * Returns an element's name's prefix or an empty string if there is none.
	 * (e.g. <o:p> --> 'o';  <p> --> '')
	 * @param {Element}	elem
	 * @return {string}
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
	 * @return {object}
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
		if (!Util.Node.is_element(elem) || !Util.is_valid_object(window)) {
			throw new TypeError('Must provide valid window and element ' +
				'objects to Util.Event.get_relative_offsets().');
		}
		
		var pos = {x: 0, y: 0};
		
		for (var e = elem; e && e.nodeName != 'HTML'; e = e.parentNode) {
			var position = Util.Element.get_computed_style(window, e).position;
			if (position == 'relative') {
				pos.x += e.offsetLeft;
				if (!Util.Element._buggy_ie_offset_top())
					pos.y += e.offsetTop;
			}
		}
		
		return pos;
	},
	
	/**
	 * True if the browser is IE ≤ 7, which incorrectly calculates elements'
	 * offsetTop attribute.
	 * @see http://www.quirksmode.org/dom/w3c_cssom.html#offsetParent
	 * @type Boolean
	 */
	_buggy_ie_offset_top: function buggy_ie_offset_top() {
		var match, major;
		
		if (typeof(buggy_ie_offset_top.result) == 'undefined') {
			if (!Util.Browser.IE) {
				buggy_ie_offset_top.result = false;
			} else {
				match = /^(\d)/.exec(Util.Browser.get_version());
				if (match && match.length && match.length >= 1) {
					major = parseInt(match[1]);
					buggy_ie_offset_top.result =  (major <= 7);
				} else {
					buggy_ie_offset_top.result = false;
				}
			}
		}
		
		return buggy_ie_offset_top.result;
	}
};

Util.Element._get_attribute_names = (function has_outer_html() {
	var guinea_pig = document.createElement('P');
	var parser = null;
	var attrs;
	guinea_pig.className = "_foo";
	
	if (guinea_pig.outerHTML && (/_foo/.test(guinea_pig.outerHTML))) {
		return function _get_attribute_names_from_outer_html(el) {
			var result;
			
			if (!parser) {
				parser = new Util.HTML_Parser();
				parser.add_listener('open', function tag_opened(n, attributes) {
					attrs = Util.Object.names(attributes);
					parser.halt();
				});
			}
			
			parser.parse(el.outerHTML);
			result = attrs;
			attrs = null;
			return result;
		};
	} else if (Util.Browser.Gecko) {
		// It looks like at least Firefox 3 is giving us the attributes in
		// reversed declaration order, so we'll read them out backwards.
		return function _get_attribute_names_reversed(el) {
			var length = el.attributes.length;
			var attributes = {};
			var a;
			for (var i = (length - 1); i >= 0; i--) {
				a = el.attributes[i];
				if (!a.specified || a.nodeName in attributes)
					continue;
				attributes[a.nodeName] = true;
			}
			return Util.Object.names(attributes);	
		};
	} else {
		return function _get_attribute_names(el) {
			var length = el.attributes.length;
			var attributes = {};
			var a;
			for (var i = 0; i < length; i++) {
				a = el.attributes[i];
				if (!a.specified || a.nodeName in attributes)
					continue;
				attributes[a.nodeName] = true;
			}
			return Util.Object.names(attributes);	
		};
	}
})();
