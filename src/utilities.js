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
	if (!node)
		return node;
	if (node.cloneRange)
		return _extend_range(node);
	return base2.DOM.bind(node);
}

function _extend_range(range) {
	var exts = _extend_range.extensions;
	if (!exts.getBoundaryNodes)
		exts.getBoundaryNodes = Loki.IERange.prototype.getBoundaryNodes;
	if (!exts.enumerateNodes)
		exts.enumerateNodes = Loki.IERange.prototype.enumerateNodes;
	if (!exts.splitTextNodes) {
		exts.splitTextNodes = function split_range_text_nodes() {
			var b = Loki.IERange.prototype.splitTextNodes.call(this);
			this.setStart(b.start.container, b.start.offset);
			this.setEnd(b.end.container, b.end.offset);
			return b;
		};
	}
	Loki.Object.extend(range, exts, false);
	return range;
}
_extend_range.extensions = {
	getCommonAncestor: function get_range_common_ancestor() {
		return this.commonAncestorContainer;
	},

	getBoundaries: function get_range_boundaries() {
		return {
			start: {
				container: this.startContainer,
				offset: this.startOffset
			},
			end: {
				container: this.endContainer,
				offset: this.endOffset
			}
		};
	},

	getHTML: function get_range_html() {
		var frag = this.cloneContents();
		var container =
			this.startContainer.ownerDocument.createElement('DIV');
		container.appendChild(frag);
		return container.innerHTML;
	},

	intersectsNode: function range_intersects_node(node) {
		var doc = node.ownerDocument;

		node_rng = doc.createRange();

		try {
			node_rng.selectNode(node);
		} catch (e) {
			node_rng.selectNodeContents(node);
		}

		return (this.compareBoundaryPoints(Range.END_TO_START,
				node_rng) == -1
			&& this.compareBoundaryPoints(Range.START_TO_END,
				node_rng) == 1);
	},

	surroundedByNode: function range_surrounded_by_node(node) {
		var r = node.ownerDocument.createRange();
		try {
			r.selectNode(node);
		} catch (e) {
			r.selectNodeContents(node);
		}

		return this.compareBoundaryPoints(Range.START_TO_START, r) >= 0
			&& this.compareBoundaryPoints(Range.END_TO_END, r) <= 0;
	},

	containsNode: function range_contains_node(node) {
		var r = node.ownerDocument.createRange();
		try {
			r.selectNode(node);
		} catch (e) {
			r.selectNodeContents(node);
		}

		return r.compareBoundaryPoints(Range.START_TO_START, this) >= 0
			&& r.compareBoundaryPoints(Range.END_TO_END, this) <= 0;
	},

	isCollapsed: function is_range_collapsed() {
		return this.collapsed;
	}
};

(function extend_base2() {
	var extensions = {};
	var RangeExtensions;
	
	// base2.DOM.Document.implement(base2.DOM.Interface.extend({
	// 	createRange: function create_document_range(document) {
	// 		return this.base(document);
	// 		// return Loki.Object.extend(this.base(document), RangeExtensions,
	// 		// 	false);
	// 	}
	// }));
	
	var camelize;
	if (typeof("".camelize) == "function") {
		// Prototype; use its camelize function.
		camelize = function camelize(str) {
			return str.camelize();
		};
	} else {
		function capitalize(str) {
			return str.charAt(0).toUpperCase() + str.substr(1);
		}
		
		camelize = function camelize(str) {
			var parts = str.split("-");
			
			var camelized = (str.charAt(0) == '-')
				? [capitalize(parts[0])]
				: [parts[0]];
			
			for (var i = 1; i < parts.length; i++) {
				camelized.push(capitalize(parts[i]));
			}
			
			return camelized.join('');
		};
	}
	
	var WHITESPACE_PATTERN = /^\s*$/;
	extensions.Node = {
		isTag: function node_is_tag(name) {
			return false;
		},
		
		isElement: function node_is_element() {
			return false;
		},
		
		isTextNode: function node_is_textual() {
			return this.nodeType == Node.TEXT_NODE;
		},
		
		isEmptyTag: function node_is_empty_tag() {
			return false;
		},
		
		getAttributes: function get_node_attributes() {
			return {};
		},
		
		containsOnlyWhitespace: function node_contains_only_whitespace() {
			if (!this.isTextNode())
				return false;
			
			return WHITESPACE_PATTERN.test(this.nodeValue);
		},
		
		findChildren: function find_children(test) {
			var matches = [];
			
			if (typeof(test) == "string") {
				// CSS selector
				var sel = test;
				test = function test_selector(element) {
					return $extend(element).matchesSelector(sel);
				};
			}
			
			return base2.filter(this.childNodes, test);
		}
	};
	
	var empty_tags = {
		BR: true, AREA: true, LINK: true, IMG: true, PARAM: true, HR: true,
		INPUT: true, COL: true, BASE: true, META: true
	};
	
	extensions.Element = {
		isTag: function element_is_tag(name) {
			return this.tagName == name.toUpperCase();
		},
		
		isElement: function element_is_element() {
			return true;
		},
		
		isTextNode: function element_is_text_node() {
			return false;
		},
		
		isEmptyTag: function element_is_empty_tag() {
			return (this.nodeName in empty_tags);
		},
		
		getStyle: function get_element_style(name) {
			name = (name == "float")
				? "cssFloat"
				: camelize(name);
			
			var value = this.style[name];
			if (!value || value == "auto") {
				var doc = $extend(this.ownerDocument);
				var computed;
				
				try {
					computed = doc.defaultView.getComputedStyle(this, "");
				} catch (e) {
					// Work around a base2 bug.
					if (Window && Window.prototype) {
						computed = Window.prototype.getComputedStyle.call(
							doc.defaultView, this, "");
					}
				}
				value = (computed) ? computed[name] : null;
			}
			
			return (name == "opacity")
				? (value ? parseFloat(value) : 1.0)
				: (value == "auto" ? null : value);
		},
		
		setStyle: function set_element_style(styles) {
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
				property = camelize(name);
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
		},
		
		setOpacity: function set_element_opacity(value) {
			this.style.opacity = (value == 1 || value === '')
				? '' : (value < 0.00001) ? 0 : value;
			return this;
		},
		
		getAttributes: function get_element_attributes(no_translation) {
			var attrs = {};

			if (this.hasAttributes && !this.hasAttributes()) {
				return attrs;
			}

			for (var i = 0; i < this.attributes.length; i++) {
				var a = this.attributes[i];
				if (!a.specified || a.nodeName in attrs)
					continue;

				var v = (a.nodeValue.toString)
					? a.nodeValue.toString()
					: a.nodeValue;

				switch (a.nodeName) {
					case 'class':
					case 'className':
						attrs[(no_translation) ? 'class' : 'className'] = v;
						break;
					case 'for':
					case 'htmlFor':
						attrs[(no_translation) ? 'for' : 'htmlFor'] = v;
						break;
					case 'style':
						attrs.style = this.style.cssText;
						break;
					default:
						attrs[a.nodeName] = v;
				}
			}

			return attrs;
		},
		
		replaceWithChildren: function replace_element_with_children() {
			var parent = this.parentNode;
			
			if (!parent)
				return false;
			
			while (this.firstChild) {
				parent.insertBefore(this.firstChild, this);
			}
			
			parent.removeChild(this);
			return true;
		}
	};
	
	extensions.Document = {
		build: function document_build(tag, attributes) {
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
						// See http://tinyurl.com/yvsqbx for more information
						// on why this special handling is necessary.

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
		},
		
		makeEditable: function make_document_editable() {
			if (Loki.Browser.IE) {
				this.body.contentEditable = true;
				try {
					// If the doc isn't really editable, this will throw an
					// error. If the document is editable, this is perfectly
					// harmless.
					this.queryCommandState('Bold');
				} catch (e) {
					throw Loki.Error("UnsupportedError", "editor:rich text");
				}
			} else {
				this.designMode = 'On';
				try {
					this.execCommand('undo', false, null);
					this.execCommand('useCSS', false, true);
				} catch (e) {
					throw Loki.Error("UnsupportedError", "editor:rich text");
				}
			}
		},
		
		addStyleSheet: function add_style_sheet(url) {
			base2.DOM.bind(this);
			
			function fix_document(document) {
				var root = document.documentElement ||
					document.getElementsByTagName("HTML")[0];
				var body = document.getElementsByTagName("BODY");
				if (!body.length) {
					body = document.createElement("BODY");
					root.appendChild(body);
				} else {
					body = body[0];
				}

				var head = document.createElement("HEAD");
				root.insertBefore(head, body);
			}
			
			var selector = "link[rel=stylesheet][href=" + url + "]";
			try {
				if (this.querySelector(selector)) {
					// already exists
					return false;
				}
			} catch (e) {
				// ignore
			}

			var link = this.build("link", {
				rel: 'stylesheet',
				type: 'text/css',
				href: url
			});
			var head = this.querySelector("head");
			if (!head) {
				fix_document(this);
				head = this.querySelector("head");
			}
			head.appendChild(link);

			return true;
		}
	};
	
	if (!document.createRange && document.body.createTextRange) {
		extensions.Document.createRange = function create_document_range() {
			return new Loki.IERange(document.body.createTextRange());
		};
	}
	
	
	
	extensions.AbstractView = {
		getSelectedRange: function get_window_selected_range() {
			var sel = this.getSelection();
			var range;
			
			if (sel.getRangeAt && typeof(sel.rangeCount) == "number") {
				// W3C Traversal and Range
				if (sel.rangeCount <= 0)
					return null;
				
				range = sel.getRangeAt(0);
				
				// add convenience methods
				_extend_range(range);
				
				return range;
			} else if (sel.createRange) {
				// Internet Explorer TextRange
				return new Loki.IERange(sel.createRange());
			} else {
				throw new Error("Cannot get the window's selected range.");
			}
		},
		
		selectRange: function window_select_range(range) {
			if (range.real && range.real.select) {
				// wrapped IE text range
				range.real.select();
			} else if (this.getSelection) {
				var sel = this.getSelection();
				sel.removeAllRanges();
				sel.addRange(range);
			} else {
				throw new Error("Cannot select a range in the window.");
			}
		}
	};
	
	if (!((window || document.defaultView || {}).getSelection)) {
		extensions.AbstractView.getSelection = function get_window_selection() {
			if (this.document.selection)
				return this.document.selection;
			throw new Error("Cannot get the window's selection.");
		};
	}
	
	function create_static_version(fn) {
		return function() {
			return fn.apply(arguments[0], base2.slice(arguments, 1));
		};
	}
	
	var class_name, class_, ext, name;
	for (class_name in extensions) {
		ext = extensions[class_name];
		class_ = base2.DOM[class_name];
		
		for (name in ext) {
			class_.prototype[name] = ext[name];
			class_[name] = create_static_version(ext[name]);
		}
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
	var word;
	
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
				if (p.scan(":")) {
					word = p.scanUntilChars("|!}");
					if (word) {
						source = Loki.currentLocale.pluralize(word, source);
					}
				} else {
					throw new Error("Illegally-formated pluralization at " +
						p.pos + ".");
				}
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
