#import "ui/key_event.js"

// Class: Loki.ParagraphMaker
// Creates new paragraphs (or any block-level elements).
Loki.ParagraphMaker = Loki.Class.create({
	// Constructor: ParagraphMaker
	// Creates a new paragraph maker.
	//
	// Parameters:
	//     (Window) window - the window containing the document on which
	//                       paragraph will be made
	initialize: function ParagraphMaker(window, source) {
		this.window = (window) ? $extend(window) : null;
	},
	
	// Method: getBoundaries
	//
	// Parameters:
	//     (Range) [range] - the range whose boundaries are desired; defaults to
	//                       the selected range of the ParagraphMaker's
	//                       associated window
	getBoundaries: function get_range_boundary_blocks(range) {
		range = $extend(range || this.window.getSelectedRange());
		var bounds = range.getBoundaries();
		var nodes = range.getBoundaryNodes(bounds);
		var w = this.window;
		
		function get_block(node) {
			var n;
			for (n = node; n; n = n.parentNode) {
				if (!Loki.Object.isElement(n))
					continue;
				//if (w.getComputedStyle(n, null).display == "block")
				if (Loki.Block.isBlock(n))
					return n;
			}
			
			throw new Error("Invariant failure: all elements should have a " +
				"block-level ancestor somewhere.");
		}
		
		bounds.start.block = get_block(nodes[0]);
		bounds.end.block = get_block(nodes[1]);
		
		return bounds;
	},
	
	handleEvent: function pm_handle_return(event) {
		var b = this.getBoundaries();
		var block_name;
		
		// The tag name of the block that will be created.
		var block_name = (b.start.block & b.start.block.nodeName != 'BODY')
			? b.start.block.nodeName
			: 'P';
		
		this.insertBlock(block_name, b);
	},
	
	insertBlock: function pm_insert_block(after_tag, bounds) {
		if (!bounds)
			bounds = this.getBoundaries();
		var document = this.window.document;
		var selection = this.window.getSelection();
		var before_tag = bounds.start.block.nodeName;
		var range;
		var b = bounds; // shorthand
		var w = this.window;
		
		function create_new_block(side, tag)
		{
			return (side.block && side.block.nodeName == tag)
				? side.block.cloneNode(false)
				: document.createElement(tag);
		}
		
		function is_block(element) {
			// var style = this.window.getComputedStyle(element, null);
			// return style.display == "block";
			return Loki.Block.isBlock(element);
		}
		
		function find_chop_node(side, direction)
		{
			var sibling = direction + 'Sibling';
			
			var node = (side.container.nodeType == Node.TEXT_NODE)
				? side.container
				: side.container.childNodes[side.offset];
			
			function is_chop(node)
			{
				return (
					node == loki.body ||
					node.nodeType == Node.DOCUMENT_NODE ||
					(node.nodeType == Node.ELEMENT_NODE && is_block(node))
				);
			}
			
			for (var n = node; n; n = n[sibling] || n.parentNode) {
				if (is_chop(n))
					return n;
			}
			
			return null; // should be effectively unreachable
		}
		
		function get_last_relevant_child(node) {
			var n, type;
			for (n = node.lastChild; n; n = n.previousSibling) {
				type = n.nodeType;
				if (type == Node.ELEMENT_NODE) {
					return n;
				} else if (type == Node.TEXT_NODE && (/S/).test(n.nodeValue)) {
					return n;
				}
			}
			
			return null;
		}
		
		function pad_block(block)
		{
			var c = get_last_relevant_child(block);
			if (c && c.tagName == 'BR')
				return;
			
			block.appendChild(document.createElement('BR'));
		}
		
		// Create the new before and after blacks.
		var before = create_new_block(bounds.start, before_tag);
		var after = create_new_block(bounds.end, after_tag);
		
		// Remove any ID attribute that might have made its way onto the after
		// block if it was cloned.
		after.removeAttribute('id');
		
		// Find the chop nodes.
		var start_chop = find_chop_node(b.start, 'previous');
		var end_chop = find_chop_node(b.end, 'next');
		
		var preserver = document.createRange();
		
		// Copy the contents of the existing block (up to the carat) into
		// the new "before" block that was created above.
		if (start_chop.nodeName == before_tag)
			preserver.setStart(start_chop, 0);
		else
			preserver.setStartBefore(start_chop);
		preserver.setEnd(b.start.container, bounds.start.offset);
		before.appendChild(preserver.cloneContents());
		
		// Copy the contents after the carat into the new "after" block.
		if (end_chop.nodeName == before_tag)
			preserver.setEnd(end_chop, end_chop.childNodes.length);
		else
			preserver.setEndAfter(end_chop);
		preserver.setStart(bounds.end.container, bounds.end.offset);
		after.appendChild(preserver.cloneContents());
		
		// Delete the original contents.
		range = $extend(document.createRange());
		if (!start_chop.previousSibling &&
			start_chop.parentNode.nodeName == before_tag)
		{
			range.setStartBefore(start_chop.parentNode);
		} else if (start_chop.nodeName == before_tag) {
			range.setStartBefore(start_chop);
		} else if (b.start.container.nodeName == before_tag && !b.start.offset){
			range.setStartBefore(b.start.container);
		} else {
			range.setStart(b.start.container, b.start.offset)
		}
		
		if (!end_chop.nextSibling &&
			end_chop.parentNode.nodeName == before_tag)
		{
			range.setEndAfter(end_chop.parentNode);
		} else if (end_chop.nodeName == before_tag) {
			range.setEndAfter(end_chop);
		} else {
			range.setEnd(b.end.container, b.end.offset);
		}
		range.deleteContents();
		
		pad_block(before);
		pad_block(after);
		
		// Opera needs this done in the reverse order from everyone else
		// for some reason.
		if (!Loki.Browser.Opera) {
			range.insertNode(after);
			range.insertNode(before);
		} else {
			range.insertNode(before);
			range.insertNode(after);
		}
		
		before.normalize();
		after.normalize();
		
		// Move cursor and scroll into view.
		range = document.createRange();
		range.selectNodeContents(after);
		range.collapse(true);
		
		function select_and_scroll()
		{
			w.selectRange(range);

			if (after.scrollIntoView)
				after.scrollIntoView(false);
		}
		
		if (!Loki.Browser.WebKit) {
			select_and_scroll();
		} else {
			setTimeout(select_and_scroll, 5); // absolute voodoo
		}
			
		// All done!
		return [before, after];
	},
});

Loki.UI.KeyEvent.addInterpretation(13, "return");
