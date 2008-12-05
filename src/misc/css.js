// Namespace: Loki.Misc.CSS
// Tools for working with CSS and selectors.
Loki.Misc.CSS = {
	// Function: elementFromSelector
	// Creates a new element from a CSS selector. The element name in the
	// selector is used (defaults to "div" if none is specified), the ID and
	// class names are applied, and any attributes are applied ([attr] =>
	// attr="attr", and [attr=value] => attr="value"). If multiple simple
	// selectors are given, the values specified in later selectors are
	// successively merged in.
	//
	// Parameters:
	//     (Document) doc - the document on which to create the element
	//     (String) selector - the selector to turn into an element
	//
	// Returns:
	//     (Element) - the created element
	elementFromSelector: function create_element_from_selector(doc, selector) {
		var data = {element: 'div', classes: [], attributes: []};
		base2.forEach(Loki.Misc.CSS.parseSelector(selector), function(sd) {
			if (sd.element != '*')
				data.element = sd.element;
			data.id = sd.id;
			base2.forEach(sd.classes, function(cl) {
				data.classes.push(cl);
			});
			base2.forEach(sd.attributes, function(at) {
				data.attributes.push(at);
			});
		});
		
		var attributes = {};
		if (data.element)
		if (data.id)
			attributes.id = data.id;
		if (data.classes.length > 0)
			attributes.className = data.classes.join(' ');
		
		base2.forEach(data.attributes, function(attr) {
			if (attr.operator && attr.operator != '=')
				return;
			attributes[attr.name] = attr.value || attr.name;
		});
		
		return base2.DOM.Document.build(doc, data.element, attributes);
	},
	
	// Function: parseSelector
	// Parses a CSS selector. The parser only includes partial selector support.
	// If you only need to parse a simple selector, try
	// <Loki.Misc.CSS#parseSimpleSelector>.
	//
	// Parameters:
	//     (String) selector - the selector to parse
	//
	// Returns:
	//     (Array) - each parsed simple selector that made up _selector_
	parseSelector: function parse_css_selector(selector) {
		return base2.map(selector.split(/\s*,\s*/),
			Loki.Misc.CSS.parseSimpleSelector, Loki.Misc.CSS);
	},
	
	// Function: parseSimpleSelector
	// Parses a simple CSS selector (one part of a ","-joined selector).
	//
	// Parameters:
	//     (String) selector - the selector to parse
	//
	// Returns:
	//     (Object) - the parsed selector
	parseSimpleSelector: function parse_simple_css_selector(selector) {
		var parser = new Loki.Parser(selector);
		var data = {
			element: null,
			id: null,
			classes: [],
			attributes: []
		};
		
		data.element = parser.scan(/^\w+/) || '*';
		
		var control, part, match, attr;
		while (!parser.terminated()) {
			control = parser.scan(/[#\.\[]/);
			if (!control)
				break;
			
			if (control == "#") {
				data.id = parser.scan(/[\w\-]+/);
			} else if (control == ".") {
				part = parser.scan(/[\w\-]+/);
				if (part)
					data.classes.push(part);
			} else if (control == "[") {
				part = parser.scanUntil("]");
				match = /^([\w\-]+)\s*(?:([~\|\^\$\*]?=)\s*(.*))?$/.exec(part);
				if (!match)
					continue;
				attr = {name: match[1]};
				if (match.length > 2) {
					attr.operator = match[2];
					attr.value = match[3];
				}
				data.attributes.push(attr);
			}
		}
		
		return data;
	}
};