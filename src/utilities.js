// Function: $extend
// If necessary, extends a DOM document or element with fixes. See
// <http://base2.googlecode.com/> for details.
//
// Parameters:
//     (Document|Element) node - the node to extend
//
// Returns:
//     (Document|Element) the extended node
var $extend = (function create_extend_func() {
	function node_is_tag() {
		return false;
	}
	
	function element_is_tag(tag_name) {
		return this.tagName == tag_name.toUpperCase();
	}
	
	return function $extend(node) {
		base2.DOM.bind(node);

		if (node.nodeType == Node.ELEMENT_NODE) {
			node.isTag = element_is_tag;
		} else {
			node.isTag = node_is_tag;
		}

		return node;
	};
})();


// Function: $sel
// Finds elements under the given context that match the given CSS selector.
//
// Parameters:
//     (String) selector - a comma-separated group of CSS selectors
//     (Document|Element) [scope] - the scope under which the search will be
//                                  run; defaults to _document_
//
// Returns:
//     (StaticNodeList) the elements that were found, if any
function $sel(selector, scope) {
	if (!scope)
		scope = document;
	if (typeof(scope.querySelectorAll) != 'function')
		$extend(scope);
	
	return scope.querySelectorAll(selector);
}

// Function: $format
// Formats a string.
//
// Parameters:
//     (String) format - the format description string
//     (any) ... - any indexed format arguments
//     (Object) [named] - any named format arguments
//
// Returns:
//     (String) the formatted string
function $format(format) {
	var args = Array.prototype.slice.call(arguments, 1);
	var named = null;
	
	if (args.length > 0) {
		if (typeof(args[args.length - 1]) == "object") {
			if (!Loki.Object.isArray(args[args.length - 1]))
				named = args[args.length - 1];
		}
	}
	
	return $vformat(format, args, named);
}

// Function: $vformat
// Formats a string.
// Parameters:
//     (String) format - the format description string
//     (any[]) [positional] - any indexed format arguments
//     (Object) [named] - any named format arguments
//
// Returns:
//     (String) the formatted string
function $vformat(format, positional, named) {
	var p = new Loki.Parser(format);
	var output = [];
	var normal, delim, identifier, n, pos, i, source, spec, type, params;
	var min_len, pad;
	
	if (!positional)
		positional = [];
	if (!named)
		named = {};
	
	while (!p.terminated()) {
		normal = p.scanUntilChars("{}");
		if (normal)
			output.push(normal);
		
		delim = p.scan();
		if (!delim)
			continue;
		
		if (delim == "}") {
			if (p.scan() == "}") {
				// escaped }
				output.push("}");
				continue;
			} else {
				p.unscan();
			}
			throw new Error("Unmatched closing delimiter } in format string " +
				"at " + p.pos + ".");
		}
		
		if (p.scan() == "{") {
			// escaped {
			output.push("{");
			continue;
		} else {
			p.unscan();
		}
		
		pos = p.pos;
		identifier = p.scanUntilChars("|!}");
		if (!identifier) {
			throw new Error("Expected identifier at " + pos + ".");
		}
		
		identifier = identifier.split(".");
		source = null;
		for (i = 0; i < identifier.length; i++) {
			n = parseInt(identifier[i]);
			if (source === null) {
				source = (isNaN(n)) ? named : positional;
			}
			
			source = source[(isNaN(n)) ? identifier[i] : n];
			if (typeof(source) == "undefined") {
				throw new Error("Format parameter " +
					identifier.slice(0, i + 1).join(".") + " is not defined.");
			}
		}
		
		delim = p.scan();
		if (delim == "!") {
			if (p.scan("p")) {
				source = Loki.currentLocale.pluralize(source);
			} else {
				pos = p.pos;
				throw new Error("Unknown transformation '" + p.scan() + "' " +
					"at " + pos + ".");
			}
			delim = p.scan();
		}
		
		if (delim == '|') {
			pos = p.pos;
			spec = p.scanUntil("}");
			if (!spec) {
				throw new Error("Expected format spec at " + pos + ".");
			}

			type = spec.charAt(spec.length - 1).toLowerCase();
			if (type == "n") {
				source = Loki.currentLocale.formatNumber(Number(source));
			} else if (type == "d") {
				params = /^(([0 -]?)(\d+))?[dD]$/.exec(spec);
				if (!params) {
					throw new Error('Invalid decimal format spec "' +
						spec + '".');
				}
				source = String(source);
				if (typeof(params[1]) == "string") {
					min_len = parseInt(params[3]);
					pad = params[2] || " ";
					if (pad == "-") {
						for (i = source.length; i < min_len; i++) {
							source += " ";
						}
					} else {
						if (source.length < min_len) {
							for (i = source.length; i < min_len; i++) {
								source = pad + source;
							}
						}
					}
				}
			} else if (type == "s") {
				// nothing for now
			} else {
				throw new Error('Unknown format type "' + type + '".');
			}
			delim = p.scan();
		}
		
		if (delim == "}") {
			output.push(source);
		} else {
			throw new Error("Expected a } at " + p.pos + ".");
		}
		
	}
	
	return output.join('');
}
