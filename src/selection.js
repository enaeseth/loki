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
	
	// Method: getRange
	// Gets the selected range.
	//
	// Returns:
	//     (Range) - the selected range
	getRange: function get_selection_range() {
		return this.window.getSelectedRange();
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
		
		var bounds = Loki.Object.clone(sel.getBoundaries());
		
		sel.enumerateNodes(function each_node_in_range(node) {
			if (is_element(node) && Loki.Block.isBlock(node)) {
				range = $extend(doc.createRange());
				range.setStart(bounds.start.container, bounds.start.offset);
				range.setEndBefore(node);
				if (!range.isCollapsed())
					save_range(range);
				
				new_range(node);
			}
		});
		
		save_range();
		return ranges;
	}
});

