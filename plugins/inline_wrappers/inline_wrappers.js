// The inline wrappers plugin provides help in constructing other plugins that
// create and remove elements that wrap inline content (such as STRONG and EM).
Loki.Plugin.create("inline_wrappers", {
	name: "Inline Wrapper Assistance",
	version: "0.1.0",
	depends: "core >= 3.0",
	
	initialize: function InlineWrapperPlugin(editor) {
		InlineWrapperPlugin.superclass.call(this, editor);
		
		this.visual = editor.contexts.visual;
	},
	
	extendSelection: function extend_selection(command, wrapper_sel, tag) {
		function capitalize(s) {
			return s.charAt(0).toUpperCase() + s.substr(1).toLowerCase();
		}
		
		command = capitalize(command);
		
		var editor = this.editor;
		var sel = editor.selection;
		
		function process_range(range) {
			
		}
		
		function find_overall_wrapper(range) {
			var container = $extend(range).getCommonAncestor();
			var node;
			for (node = container; node; node = node.parentNode) {
				node = $extend(node);
				if (!node.isElement())
					continue;
				if (node.matchesSelector(wrapper_sel))
					return node;
			}
			
			var wrapper = null;
			var ends = range.getBoundaryNodes();
			var start = ends[0];
			
			var next;
			for (node = $extend(start); node; node = $extend(next)) {
				if (node.isElement()) {
					if (node.matchesSelector(wrapper_sel)) {
						wrapper = node;
						break;
					} else if (!(next = node.firstChild)) {
						return null;
					}
				} else if (node.isTextNode()) {
					if (!node.containsOnlyWhitespace())
						return null;
				}
				
				if (!(next = node.nextSibling)) {
					return null;
				}
			}
			
			if (!wrapper)
				return wrapper;
			
			start = ends[1];
			for (node = $extend(start); node; node = $extend(next)) {
				if (node.isElement()) {
					if (node === wrapper) {
						return wrapper;
					} else if (!(next = node.lastChild)) {
						return null;
					}
				} else if (node.isTextNode() && !node.containsOnlyWhitespace()){
					return null;
				} else if (!(next = node.previousSibling)) {
					return null;
				}
			}
			
			return null;
		}
		
		function find_internal_wrappers(range) {
			var container;
			container = range.getCommonAncestor();
			if (container) {
				container = $extend(container);
				if (!container.isElement())
					return [];
				return container.querySelectorAll(wrapper_sel);
			}
			
			return [];
		}
		
		function get_wrapping_state() {
			var ranges = sel.getInlineSections();
			
			var state = -1, range;
			for (var i = 0; i < ranges.length; i++) {
				range = $extend(ranges[i]);
				if (state < 0 || state == 2) {
					if (find_overall_wrapper(range)) {
						state = 2;
					} else {
						state = 1;
					}
				}
				
				if (state < 0 || state == 1) {
					if (find_internal_wrappers(range).length) {
						state = 1;
					} else {
						state = 0;
					}
				}
			}
			
			return state;
		}
		
		function is_wrapped() {
			return get_wrapping_state() == 2;
		}
		
		function replace_with_children(node) {
			var parent = node.parentNode;
			if (!parent)
				return;
			var c;
			while ((c = node.firstChild)) {
				parent.insertBefore(c, node);
			}
			parent.removeChild(node);
		}
		
		function get_following_node(n) {
			if (n.hasChildNodes()) {
				n = n.firstChild;
			} else if (n.nextSibling) {
				n = n.nextSibling;
			} else if (n.parentNode && n.parentNode.nextSibling) {
				n = n.parentNode.nextSibling;
			} else {
				n = null;
			}

			return n;
		}
		
		function collect_nodes(from, to) {
			
			var nodes = [];
			var node = from;
			while (node && node !== to) {
				nodes.push(node);
				node = get_following_node(node);
			}
			return nodes;
		}
		
		function rewrap_after(overall, bound) {
			var start = (bound.offset < bound.container.childNodes.length)
				? bound.container.childNodes[bound.offset]
				: get_following_node(bound.container.lastChild);
			
			var nodes = collect_nodes(start, overall);
			if (!nodes.length)
				return null;
			
			var new_wrapper = editor.document.build(tag);
			start.parentNode.insertBefore(new_wrapper, start);
			for (var i = 0; i < nodes.length; i++)
				new_wrapper.appendChild(nodes[i]);
			return new_wrapper;
		}
		
		function reposition_guts(guts, bound) {
			var start = (bound.offset < bound.container.childNodes.length)
				? bound.container.childNodes[bound.offset]
				: bound.container.lastChild;
			var parent = start.parentNode;
			start = start.nextChild;
			
			while (guts.firstChild) {
				parent.insertBefore(guts.firstChild, start);
			}
		}
		
		function set_wrapped(wrapped) {
			function set_range_wrapped(range) {
				var overall = find_overall_wrapper(range);
				var internal = find_internal_wrappers(range);
				var parent, node, guts;
				var b, before;
				
				function extract() {
					if (range.extractContents) {
						return range.extractContents();
					} else {
						var contents = range.cloneContents();
						range.deleteContents();
						return contents;
					}
				}
				
				if (wrapped) {
					base2.forEach(internal, function(iw) {
						replace_with_children(iw);
					});
					
					if (!overall) {
						parent = range.getCommonAncestor();
						node = parent.ownerDocument.build(tag);
						node.appendChild(extract());
						range.insertNode(node);
						
						if (range.isCollapsed()) {
							range.setStart(node, node.childNodes.length);
							range.collapse(true);
							editor.window.selectRange(range);
						}
					}
				} else {
					base2.forEach(internal, function(iw) {
						replace_with_children(iw);
					});	
					
					if (overall) {
						b = range.splitTextNodes();
						rewrap_after(overall, b.end);
						reposition_guts(extract(), b.start);
					}
				}
			}
			
			base2.forEach(sel.getInlineSections(), set_range_wrapped);
		}
		
		function toggle_wrapped() {
			set_wrapped(!is_wrapped());
		}
		
		sel["is" + command] = is_wrapped;
		sel["set" + command] = set_wrapped;
		sel["toggle" + command] = toggle_wrapped;
		sel["_get" + command + "State"] = get_wrapping_state;
		sel["_find" + command + "InternalWrappers"] = find_internal_wrappers;
		sel["_find" + command + "OverallWrapper"] = find_overall_wrapper;
	}
});
