// Class: Loki.Selection
// Provides a higher-level interface to manipulating a browser window's
// selection.
Loki.Selection = Loki.Class.create({
	// Constructor: Selection
	// Creates a new Selection object for a window.
	//
	// Parameters:
	//     (Window) window - a browser window
	initialize: function Selection(window) {
		this.window = window;
		this.document = document;
	},
	
	// Method: getInlineSections
	// 
	//
	// Returns:
	//     (Range[]) - one range object for each selected inline section
	getInlineSections: function get_selected_inline_sections() {
		var ranges = [];
		var bounds = null;
		var doc = this.document;
		var range;
		
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
		
		function save_range(r) {
			if (!bounds)
				return false;
			
			if (!r) {
				r = $extend(this.document.createRange());
				r.setStart(bounds.start.container, bounds.start.offset);
				r.setEnd(bounds.end.container, bounds.end.offset);
			}
			
			ranges.push(r);
			return true;
		}
		
		function new_range(container) {
			bounds.start = {container: container || null, offset: 0};
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
		
		function bounds_are_empty(b) {
			return (b.start.offset === b.end.offset &&
				b.start.node === b.end.node);
		}
		
		function is_element(n) {
			return n.nodeType == Node.ELEMENT_NODE;
		}
		
		var sel = this.window.getSelectedRange();
		if (!sel) // nothing selected?
			return ranges;
		if (sel.isCollapsed()) {
			return [sel.cloneRange()];
		}
		
		var termini = sel.getBoundaries();
		bounds = {
			start: Loki.Object.clone(termini.start),
			end: Loki.Object.clone(termini.end)
		};
		
		var start = get_boundary_node(bounds.start);
		var end = get_boundary_node(bounds.end);
		
		var node = start;
		while (node !== end) {
			if (is_element(node) && Loki.Block.isBlock(node)) {
				range = $extend(doc.createRange());
				range.setStart(bounds.start.container, bounds.start.offset);
				range.setEndBefore(node);
				if (!range.isCollapsed())
					save_range(range);
				
				new_range(node);
			}
			
			node = get_following_node(node);
		}
		
		save_range();
		return ranges;
	}
});

