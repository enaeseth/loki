// Loki.IERange builds a W3C-compatible interface on top of an Internet Explorer
// text range. Its usage should be mostly transparent; simply use
// > window.getSelectedRange()
// on any base2-extended window. A native W3C range will be returned where
// available, and under IE, this wrapper will be returned. There are a couple of
// gotchas:
//     - Use range.getCommonAncestor() instead of range.commonAncestorContainer
//     - Use range.getBoundaries() instead of, e.g., range.startContainer.
Loki.IERange = Loki.Class.create({
	initialize: function IERange(real) {
		this.real = real;
	},
	
	getCommonAncestor: function get_range_common_ancestor() {
		return this.real.parentElement();
	},
	
	getBoundaries: function get_range_boundaries() {
		var rng = this.real;
		var dupe; // duplicate of a range
		var parent; // some node's parent element

		function get_boundary(side)
		{		
			dupe = rng.duplicate();
			dupe.collapse((side == 'start') ? true : false);

			// Find the text node in which the now-collapsed selection lies
			// by trying to move its starting point (i.e. the whole thing)
			// back really far, seeing how many characters were actually
			// moved, and then traversing the range's parent element's
			// text node children to find the text node that it refers to.

			// Establish a base by finding the position of the parent.
			parent = dupe.parentElement();
			var parent_range =
				parent.ownerDocument.body.createTextRange();
			parent_range.moveToElementText(parent);
			var base = Math.abs(parent_range.move('character', -0xFFFFFF));

			var offset = (Math.abs(dupe.move('character', -0xFFFFFF)) - base);
			var travelled = 0;

			for (var i = 0; i < parent.childNodes.length; i++) {
				var child = parent.childNodes[i];

				if (child.nodeType == Node.ELEMENT_NODE) {
					// IE counts each interspersed element as occupying
					// one character. We have to correct for this when
					// ending within a text node, but it conveniently
					// allows us to find when we're stopping at an
					// element.

					if (travelled < offset) {
						// Not this element; move on.
						travelled++;
						continue;
					}

					// Found it! It's an element!
					return {
						node: parent,
						offset: base2.DOM.Traversal.getNodeIndex(child)
					}
				} else if (child.nodeType != Node.TEXT_NODE) {
					// Not interested.
					continue;
				}

				var cl = child.nodeValue.length;
				if (travelled + cl < offset) {
					// The offset doesn't lie with this text node. Add its
					// length to the distance we've travelled and move on.
					travelled += cl;
					continue;
				}

				// Found it!
				return {
					node: child,
					offset: offset - travelled
				};
			}

			// End of the parent
			return {
				container: parent,
				offset: parent.childNodes.length
			};
		}

		return {
			start: get_boundary('start'),
			end: get_boundary('end')
		};
	},
	
	deleteContents: function delete_range_contents() {
		this.real.pasteHTML('');
	},
	
	/** @param {Node} node */
	insertNode: function insert_node_in_range(node) {
		var bounds = Util.Range.get_boundaries(rng);
		var point;
		
		if (bounds.start.container.nodeType == Node.TEXT_NODE) {
			// Inserting the node into a text node; split it at the insertion
			// point.
			point = bounds.start.container.splitText(bounds.start.offset);
			
			// Now the node can be inserted between the two text nodes.
			bounds.start.container.parentNode.insertBefore(node, point);
		} else {
			point = (bounds.start.container.hasChildNodes())
				? bounds.start.container.childNodes[bounds.start.offset]
				: null;
			bounds.start.container.insertBefore(node, point);
		}
	},
	
	getBoundaryNodes: function get_boundary_nodes() {
		function get_boundary_node(b) {
			var c = b.container, d, l;
			if (c.nodeType == Node.TEXT_NODE)
				return b.container;
			d = c.childNodes[b.offset];
			if (d)
				return d;
			l = c.childNodes.length;
			if (b.offset >= l)
				return c.childNodes[l - 1];
			return c; // shouldn't ever be necessary...
		}
		
		var bounds = this.getBoundaries();
		var nodes = [
			get_boundary_node(bounds.start),
			get_boundary_node(bounds.end)
		];
		
		nodes.start = nodes[0];
		nodes.end = nodes[1];
		
		return nodes;
	},
	
	splitTextNodes: function split_range_text_nodes() {
		var b = this.getBoundaries();
		
		function fix_boundary(bound) {
			var container, offset, index, split;
			
			if ((container = bound.container).nodeType == Node.TEXT_NODE) {
				offset = bound.offset;
				bound.container = container.parentNode;
				if (offset == 0) {
					bound.offset = base2.DOM.Traversal.getNodeIndex(container);
				} else if (offset == container.nodeValue.length) {
					bound.offset = (1 +
						base2.DOM.Traversal.getNodeIndex(container));
				} else {
					console.debug(container, bound.offset);
					split = container.splitText(bound.offset);
					if (bound === b.start && container == b.end.container) {
						console.info("!");
						b.end.container = split;
						b.end.offset -= bound.offset;
					}
					bound.offset = base2.DOM.Traversal.getNodeIndex(split);
				}
			}
			
			return bound;
		}
		
		b.start = fix_boundary(b.start);
		b.end = fix_boundary(b.end);
		
		return b;
	},
	
	enumerateNodes: function enumerate_range_nodes(iterator) {
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
		
		var bounds = this.getBoundaryNodes();
		var nodes;
		var start = bounds.start;
		var end = bounds.end;
		var node;
		
		if (iterator) {
			for (node = start; node; node = get_following_node(node)) {
				iterator(node);
				if (node === end)
					break;
			}
		} else {
			nodes = [];
			for (node = start; node; node = get_following_node(node)) {
				nodes.push(node);
				if (node === end)
					break;
			}
			return nodes;
		}
	},
	
	cloneRange: function clone_range() {
		return new Loki.IERange(rng.duplicate());
	},
	
	cloneContents: function clone_range_contents() {
		// This is just painfully hackish, but the option of writing the code
		// to properly traverse a range and clone its contents is far worse.
		
		var html = this.get_html();
		var doc = this.real.parentElement().ownerDocument;
		var hack = doc.createElement('DIV');
		var frag = doc.createDocumentFragment();
		
		hack.innerHTML = html;
		while (hack.firstChild) {
			frag.appendChild(hack.firstChild);
		}
		
		return frag;
	},
	
	getHTML: function get_range_html() {
		return this.real.htmlText;
	},
	
	getText: function get_range_text() {
		return this.real.text;
	},
	
	isCollapsed: function is_range_collapsed() {
		return this.real.text.length == 0;
	},
	
	intersectsNode: function range_intersectcs_node(node) {
		var node_rng = doc.body.createTextRange();
		node_rng.moveToNodeText(node);
		
		return (this.real.compareEndPoints('EndToStart', node_rng) == -1 &&
			this.real.compareEndPoints('StartToEnd', node_rng) == 1);
	},
	
	compareBoundaryPoints: function compare_range_boundary_points(how, other) {
		return this.real.compareEndPoints(how, other);
	},
	
	selectNodeContents: function range_select_node_contents(node) {
		this.real.moveToElementText(node);
	},
	
	surroundedByNode: function range_surrounded_by_node(node) {
		var r = node.ownerDocument.createTextRange();
		r.moveToElementText(node);
		
		return (this.real.compareEndPoints('StartToStart', r) >= 0
			&& this.real.compareEndPoints('EndToEnd', r) <= 0);
	},
	
	containsNode: function range_contains_node(node) {
		var r = node.ownerDocument.createTextRange();
		r.moveToElementText(node);
		
		return (r.compareEndPoints('StartToStart', this.real) >= 0
			&& r.compareEndPoints('EndToEnd', this.real) <= 0);
	},
	
	setStart: function set_range_start(container, offset) {
		this._set_endpoint('Start', container, offset);
	},
	
	setEnd: function set_range_end(container, offset) {
		this._set_endpoint('End', container, offset);
	},
	
	setStartBefore: function set_range_start_before(container) {
		this._set_endpoint('Start', container.parentNode,
			base2.DOM.Traversal.getNodeIndex(container));
	},
	
	setStartAfter: function set_range_start_after(container) {
		this._set_endpoint('Start', container.parentNode,
			base2.DOM.Traversal.getNodeIndex(container) + 1);
	},
	
	setEndBefore: function set_range_end_before(container) {
		this._set_endpoint('End', container.parentNode,
			base2.DOM.Traversal.getNodeIndex(container));
	},
	
	setEndAfter: function set_range_end_after(container) {
		this._set_endpoint('End', container.parentNode,
			base2.DOM.Traversal.getNodeIndex(container) + 1);
	},
	
	_set_endpoint: function _ie_text_range_set_endpoint(which, node, offset) {
		// Frustratingly, we cannot directly set the absolute end points of an
		// Internet Explorer text range; we can only set them in terms of an end
		// point of another text range. So, we create a text range whose start
		// point will be the desired node and offset and then set the given
		// endpoint of the range in terms of our new range.
		
		var rng = this.real;
		var marker = rng.parentElement().ownerDocument.body.createTextRange();
		var parent = (node.nodeType == Node.TEXT_NODE)
			? node.parentNode
			: node;
		var node_of_interest;
		var char_offset;

		marker.moveToElementText(parent);

		// IE text ranges use the character as their principal unit. So, in
		// order to translate from the W3C container/offset convention, we must
		// find the number of characters a node is located from the start of
		// "parent".
		function find_node_character_offset(node)
		{
			var stack = [parent];
			var offset = 0;
			var o;

			while (o = stack.pop()) { // assignment intentional
				if (node && o == node)
					return offset;

				if (o.nodeType == Node.TEXT_NODE) {
					offset += o.nodeValue.length;
				} else if (o.nodeType == Node.ELEMENT_NODE) {
					if (o.hasChildNodes()) {
						for (var i = o.childNodes.length - 1; i >= 0; i--) {
							stack.push(o.childNodes[i]);
						}
					} else {
						offset += 1;
					}
				}
			}

			if (!node)
				return offset;

			throw new Error('Could not find the node\'s offset in characters.');
		}

		if (node.nodeType == Node.TEXT_NODE) {
			if (offset > node.nodeValue.length) {
				throw new Error('Offset out of bounds.');
			}

			char_offset = find_node_character_offset(node);
			char_offset += offset;
		} else {
			if (offset > node.childNodes.length) {
				throw new Error('Offset out of bounds.');
			}

			node_of_interest = (offset == node.childNodes.length)
				? null
				: node.childNodes[offset];
			char_offset = find_node_character_offset(node_of_interest);
		}

		marker.move('character', char_offset);
		rng.setEndPoint(which + 'ToEnd', marker)
	}
});
