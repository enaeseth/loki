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
		
		if (Util.is_function(window.getComputedStyle)) {
			return window.getComputedStyle(elem, null);
		} else {
			return elem.currentStyle;
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
		return Util.Element.get_computed_style(window, elem).display == 'block';
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
			pos.x += e.offsetLeft || e.screenLeft;
			pos.y += e.offsetTop || e.screenTop;
		}
		
		return pos;
	}
};
