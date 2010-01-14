UI.Transformer = function Transformer(editing_env) {
	this.env = editing_env;
	this.editor = editing_env.editor;
};

Util.OOP.mixin(UI.Transformer, {
	wrap_inline: function wrap_range_inline_content(wrapper, range) {
		if (!range)
			range = this.env.get_selected_range();
		
		var current_wrapper;
		function create_new_wrapper() {
			if (current_wrapper && current_wrapper.childNodes.length == 0) {
				if (current_wrapper.parentNode)
					current_wrapper.parentNode.removeChild(current_wrapper);
				return current_wrapper;
			} else {
				return wrapper.cloneNode(false);
			}
		}
		
		var bounds = Util.Range.get_boundaries(range);
		bounds = this._orient_to_document(range, bounds);
		
		console.debug('original start', bounds.start.container, bounds.start.offset);
		bounds.start = this._fix_boundary(range, 'start', bounds);
		bounds.end = this._fix_boundary(range, 'end', bounds);
		
		current_wrapper = create_new_wrapper();
		console.debug('start', bounds.start.container, bounds.start.offset);
		var node = this._get_start_node(bounds.start);
		var end = this._get_end_node(bounds.end);
		var block = this._get_enclosing_block(node);
		var new_block;
		
		console.debug('node', node);
		console.debug('end', end);
		console.debug('block', block);
		
		node.parentNode.insertBefore(current_wrapper, node);
		
		while (node) {
			if (this._is_block(node)) {
				if (node.childNodes.length > 0) {
					current_wrapper = create_new_wrapper();
					block = node;
					node = block.firstChild;
					if (!this._is_block(node))
						block.insertBefore(current_wrapper, node);
					continue;
				}
			} else {
				current_wrapper.appendChild(node);
			}
			
			if (node === end) {
				break;
			} else if (node.nextSibling) {
				node = node.nextSibling;
			} else {
				while (node && node.parentNode) {
					if (node.parentNode.nextSibling) {
						node = node.parentNode.nextSibling;
						break;
					}
					node = node.parentNode;
				}
				
				console.warn('getting enclosing block of', node);
				new_block = this._get_enclosing_block(node);
				if (new_block !== block) {
					current_wrapper = create_new_wrapper();
					block = new_block;
					block.insertBefore(current_wrapper, node);
				}
			}
		}
		
		if (current_wrapper.childNodes.length == 0) {
			if (current_wrapper.parentNode)
				current_wrapper.parentNode.removeChild(current_wrapper);
		}
	},
	
	unwrap_inline: function unwrap_range_inline_content(test, range) {
		
	},
	
	insert_block: function insert_block_into_range(block, range) {
		if (!range)
			range = this.env.get_selected_range();
		Util.Range.delete_contents(range);
		range.collapse(true);
		
		var bounds = Util.Range.get_boundaries(range);
		bounds = this._orient_to_document(range, bounds);
		
		var start = this._fix_boundary(range, 'start', bounds);
		var point = (start.offset < start.container.childNodes.length) ?
			start.container.childNodes[start.offset] :
			null;
		
		function is_valid(container) {
			var flags = Util.Block.get_flags(container);
			return (flags & Util.Block.BLOCK) &&
				(flags & Util.Block.INLINE_CONTAINER) == 0 &&
				(flags & Util.Block.PARAGRAPH) == 0 ;
		}
		
		var container = start.container;
		var split;
		var node, next_node;
		while (container && !is_valid(container)) {
			if (point) {
				split = container.cloneNode(false);
				this._insert_before(container.parentNode, split,
					container.nextSibling);
				for (node = point; node; node = next_node) {
					next_node = node.nextSibling;
					split.appendChild(node);
				}
				
				point = split;
				container = container.parentNode;
			} else {
				point = container.nextSibling;
				container = container.parentNode;
			}
		}
		
		this._insert_before(container, block, point);
	},
	
	// IE8 needs this stupidity
	_insert_before: function _insert_node_before(parent, node, point) {
		if (point) {
			parent.insertBefore(node, point);
		} else {
			parent.appendChild(node);
		}
	},
	
	_orient_to_document: function _orient_to_document(range, bounds) {
		var result = Util.Range.compare_boundary_points(range, range,
			Util.Range.START_TO_END);
		console.debug(bounds.start.container, bounds.start.offset,
			bounds.end.container, bounds.end.offset, result);
		
		if (result > 0) {
			return {start: bounds.end, end: bounds.start};
		} else {
			return bounds;
		}
	},
	
	_fix_boundary: function _fix_range_boundary(range, which, bounds) {
		var bound = bounds[which];
		var parent = bound.container.parentNode;
		var point;
		
		var set_before = Util.Range['set_' + which + '_before'];
		var set_after = Util.Range['set_' + which + '_after'];
		
		if (bound.container.nodeType == Util.Node.TEXT_NODE) {
			// Break outside of the text node (splitting the existing one
			// if necessary).
			if (bound.offset == 0) {
				set_before(range, bound.container);
				return {
					container: parent,
					offset: Util.Node.get_offset(bound.container)
				}
			} else if (bound.offset == bound.container.nodeValue.length) {
				set_after(range, bound.container);
				return {
					container: parent,
					offset: (Util.Node.get_offset(bound.container) + 1)
				}
			} else {
				bound.container.splitText(bound.offset);
				point = bound.container.nextSibling;
				set_before(range, point);
				
				if (bounds.start.container === bounds.end.container) {
					if (which == 'start') {
						bounds.end.container = point;
						bounds.end.offset -= bounds.start.offset;
					}
				}
				
				return {
					container: parent,
					offset: Util.Node.get_offset(point)
				};
			}
		} else {
			// Don't need to do anything.
			return bound;
		}
	},
	
	_get_start_node: function _get_start_node(bound) {
		var node = bound.container;
		if (bound.offset < node.childNodes.length) {
			return node.childNodes[bound.offset];
		} else {
			return this._get_next_node(node);
		}
	},
	
	_get_end_node: function _get_end_node(bound) {
		var node = bound.container;
		var length = node.childNodes.length;
		var target;
		
		if (bound.offset == 0) {
			while (node && node.parentNode) {
				if (node.parentNode.previousSibling) {
					target = node.parentNode.previousSibling;
					break;
				}
				node = node.parentNode;
			}
			
			if (!target) {
				throw new Error("_get_end_node failed");
			}
		} else if (bound.offset < length) {
			target = node.childNodes[bound.offset - 1];
		} else if (bound.offset == length && length > 0) {
			target = node.lastChild;
		}
		
		return target;
	},
	
	_get_next_node: function _get_next_node(node) {
		if (node.firstChild)
			return node.firstChild;
		else if (node.nextSibling)
			return node.nextSibling;
		
		while (node && node.parentNode) {
			if (node.parentNode.nextSibling)
				return node.parentNode.nextSibling;
			node = node.parentNode;
		}
		return null;
	},
	
	_get_enclosing_block: function _get_enclosing_block(node) {
		return Util.Node.get_enclosing_block(node, this.editor.window);
	},
	
	_is_block: function _node_is_block(node) {
		if (node.nodeType != Util.Node.ELEMENT_NODE)
			return false;
		
		try {
			return Util.Element.is_block_level(this.editor.window, node);
		} catch (e) {
			return Util.Block.is_block(node);
		}
	}
});
