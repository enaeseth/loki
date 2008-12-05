// Namespace: Loki.Misc.CSS
// Tools for working with CSS and selectors.
Loki.Misc.CSS = {
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
	
	// Method: parseSimpleSelector
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
				console.debug(part);
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