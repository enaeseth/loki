// Function: $extend
// If necessary, extends a DOM document or element with fixes. See
// <http://base2.googlecode.com/> for details.
//
// Parameters:
//     (Document|Element) node - the node to extend
//
// Returns:
//     (Document|Element) the extended node
function $extend(node) {
	return base2.DOM.bind(node);
}

(function extend_base2() {
	base2.DOM.Node.isTag = function _node_is_tag(node, name) {
		return false;
	};
	base2.DOM.Node.prototype.isTag = function node_is_tag(name) {
		return false;
	};
	
	base2.DOM.Element.isTag = function _element_is_tag(element, name) {
		return element.tagName == name.toUpperCase();
	};
	base2.DOM.Element.prototype.isTag = function element_is_tag(name) {
		return this.tagName == name.toUpperCase();
	};
	
	function set_element_style(styles) {
		var es = this.style, match, property;
		if (typeof(styles) == "string") {
			if (es.cssText && es.cssText.charAt(es.cssText.length - 1) != ';')
				es.cssText += ';';
			es.cssText += styles;
			if (styles.indexOf('opacity') != -1) {
				base2.DOM.Element.setOpacity(
					this,
					styles.match(/opacity:\s*(\d?\.?\d*)/)[1]
				);
			}
			return this;
		}
		
		for (var name in styles) {
			property = name;
			if (name == 'opacity') {
				base2.DOM.Element.setOpacity(this, styles['opacity']);
			} else {
				if (name == 'float' || name == 'cssFloat') {
					property = (typeof(es.styleFloat) == "undefined")
						? 'cssFloat' : 'styleFloat';
				}
				es[property] = styles[name];
			}
		}
		return this;
	}
	if (!Element || !Element.prototype.setStyle) {
		base2.DOM.Element.prototype.setStyle = set_element_style;
		base2.DOM.Element.setStyle = function _set_element_style(el, styles) {
			return set_element_style.call(el, styles);
		}
	}
	
	function set_element_opacity(value) {
		this.style.opacity = (value == 1 || value === '')
			? '' : (value < 0.00001) ? 0 : value;
		return this;
	}
	if (!Element || !Element.prototype.setOpacity) {
		base2.DOM.Element.prototype.setOpacity = set_element_opacity;
		base2.DOM.Element.setOpacity = function _set_element_opacity(el,
			value)
		{
			return set_element_opacity.call(el, value);
		}
	}
	
	function document_build(tag, attributes) {
		if (!attributes)
			attributes = {};
		
		// XXX: do we need jQuery-style wrapper logic here?
		if (!(/^\w+$/.test(tag))) {
			var temp = this.createElement("DIV");
			temp.innerHTML = tag;
			if (temp.childNodes.length == 1) {
				return $extend(temp.firstChild);
			}
			
			var frag = this.createDocumentFragment();
			while (temp.firstChild)
				frag.appendChild($extend(temp.firstChild));
			return frag;
		}
		
		var elem;
		if (Loki.Browser.IE && attributes.name) {
			elem = this.createElement($format('<{0} name="{1}>"',
				tag.toUpperCase(), attributes.name));
		} else {
			elem = this.createElement(tag.toUpperCase());
		}
		
		for (var name in attributes) {
			var dest_name = name;

			switch (name) {
				case 'className':
				case 'class':
					// In IE, e.setAttribute('class', x) does not work properly:
					// it will indeed set an attribute named "class" to x, but
					// the CSS for that class won't actually take effect. As a
					// workaround, we just set className directly, which works
					// in all browsers.

					// See http://tinyurl.com/yvsqbx for more information.

					var klass = attributes[name];

					// Allow an array of classes to be passed in.
					if (typeof(klass) != 'string' && klass.join)
						klass = klass.join(' ');

					elem.className = klass;
					continue; // note that this continues the for loop!
				case 'htmlFor':
					dest_name = 'for';
					break;
				case 'style':
					base2.DOM.Element.setStyle(elem, attributes.style);
					continue; // note that this continues the for loop!
			}

			var a = attributes[name];
			if (typeof(a) == 'boolean') {
				if (a)
					elem.setAttribute(dest_name, dest_name);
				else
					continue;
			} else {
				elem.setAttribute(dest_name, a);
			}
		}
		
		return $extend(elem);
	}
	base2.DOM.Document.prototype.build = document_build;
	base2.DOM.Document.build = function _doument_build(doc, tag, attributes) {
		return document_build.call(doc, tag, attributes);
	}
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
				source = "(null)";
				break;
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
