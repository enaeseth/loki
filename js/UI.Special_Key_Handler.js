/**
 * @class Special key handling for Loki.
 * @author Eric Naeseth
 */
UI.Special_Key_Handler = {
	/**
	 * Handles a key event.
	 * @param {UI.Key_Event}	event
	 * @return {void}
	 */
	handle_event: function handle_special_key_event(event)
	{
		var key_name = UI.Key_Event._handling_map[event.code];
		var handler = this._default_handlers[key_name];
		if (handler) {
			this[handler](event);
		} else {
			event.allow_browser_handling();
		}
	},
	
	/**
	 * Default handling for presses of the Enter key.
	 *
	 * Generally, we want to insert a new paragraph at the selection, but
	 * there are many special cases.
	 *
	 * The algorithm used here owes heavily to TinyMCE.
	 */
	handle_enter: function handle_enter(event)
	{
		var loki = event.loki;
		var b = this.get_boundaries(loki);
		var block_name;
		
		// Internet Explorer is, for once, wonderful.
		if (Util.Browser.IE) {
			event.allow_browser_handling();
			return;
		}
		
		/*
		// Determine whether or not to permit browser handling.
		// Modern releases of TinyMCE bail out if Opera is detected and allow it
		// to use its default behavior since it is apparently "really good".
		// We may want to do the same after some testing.
		function browser_handling_is_acceptable()
		{
			// If we're inside a list or a preformatted block, the default 
			// browser behavior (inserting a <br> tag or a simple line break,
			// respectively) is what we want.
			function is_list_or_pre(node)
			{
				return /^(OL|UL|DL|PRE)$/.test(node.nodeName);
			}
			
			if (find(b.start.block, is_list_or_pre))
				return true;
			
			return false;
		}
		
		if (browser_handling_is_acceptable()) {
			event.allow_browser_handling();
			return;
		}
		*/
		
		// The tag name of the block that will be created.
		var block_name = (b.start.block & b.start.block.nodeName != 'BODY')
			? b.start.block.nodeName
			: 'P';
		
		this.insert_block(loki, b, block_name);
	},
	
	/**
	 * Gets the relevant boundaries for the Loki selection, including the
	 * boundaries' blocks.
	 * @see Util.Range.get_boundaries()
	 * @param {UI.Loki}	loki
	 * @return {object}
	 */
	get_boundaries: function get_boundaries(loki)
	{
		var body = loki.body;
		var selected_range = loki.get_selected_range();
		
		var b = Util.Range.get_boundaries(selected_range);
		
		function is_on_body()
		{
			return [b.start, b.end].every(function side_refers_to_body(side) {
				if (side.container.nodeType == Util.Node.TEXT_NODE) {
					return (side.offset == 0 &&
						side.container.parentNode == body);
				} else if (side.container == body) {
					return side.offset == 0;
				} else if (side.container.nodeType == Util.Node.ELEMENT_NODE) {
					return side.container.childNodes[side.offset] == body;
				}
			});
		}
		
		var is_block_level = this.is_block_level;
		function get_block(side)
		{
			var node = (side.container.nodeType == Util.Node.TEXT_NODE)
				? side.container.parentNode
				: side.container;
			
			for (var n = node; n; n = n.parentNode) {
				if (is_block_level(n))
					return n;
			}
			
			throw new Error('Node ' + Util.Node.get_debug_string(node) + 
				' has no block-level ancestors.');
		}
		
		// If the caret is directly on the editing document's body, we need to
		// move it to the first block (if one exists).
		if (is_on_body() && is_block_level(body.firstChild)) {
			b.start.container = b.end.container = body.firstChild;
			b.start.block = b.end.block = body.firstChild;
			b.start.offset = b.end.offset = 0;
		} else {
			// Not on the body; find the relevant blocks for each boundary.
			b.start.block = get_block(b.start);
			b.end.block = get_block(b.end);
		}
		
		return b;
	},
	
	/**
	 * Starts a new block at the current selection.
	 * Currently requires W3C ranges.
	 * @param {UI.Loki}	loki
	 * @param {object}	b	the selection boundaries
	 * @param {string}	after_tag	the tag name of the new block
	 * @return {array}	the newly-created elements
	 */
	insert_block: function insert_block(loki, b, after_tag)
	{
		var selection = loki.get_selection();
		var before_tag = b.start.block.nodeName;
		var range;
		
		function create_new_block(side, tag)
		{
			return (side.block && side.block.nodeName == tag)
				? side.block.cloneNode(false)
				: loki.document.createElement(tag);
		}
		
		var is_block = this.is_block_level;
		function find_chop_node(side, direction)
		{
			var sibling = direction + 'Sibling';
			
			var node = (side.container.nodeType == Util.Node.TEXT_NODE)
				? side.container
				: side.container.childNodes[side.offset];
			
			function is_chop(node)
			{
				return (n == loki.body || n.nodeType == Util.Node.DOCUMENT_NODE
					|| (n.nodeType == Util.Node.ELEMENT_NODE && is_block(n)));
			}
			
			for (var n = node; n; n = n[sibling] || n.parentNode) {
				if (is_chop(n))
					return n;
			}
			
			return null; // should be effectively unreachable
		}
		
		function pad_block(block)
		{
			if (Util.Element.is_basically_empty(block)) {
				block.appendChild(loki.document.createElement('BR'));
			}
		}
		
		// Create the new before and after blacks.
		var before = create_new_block(b.start, before_tag);
		var after = create_new_block(b.end, after_tag);
		
		// Remove any ID attribute that might have made its way onto the after
		// block if it was cloned.
		after.removeAttribute('id');
		
		// Find the chop nodes.
		var start_chop = find_chop_node(b.start, 'previous');
		var end_chop = find_chop_node(b.end, 'next');
		
		var preserver = Util.Document.create_range(loki.document);
		
		// Copy the contents of the existing block (up to the carat) into
		// the new "before" block that was created above.
		if (start_chop.nodeName == before_tag)
			Util.Range.set_start(preserver, start_chop, 0);
		else
			Util.Range.set_start_before(preserver, start_chop);
		Util.Range.set_end(preserver, b.start.container, b.start.offset);
		before.appendChild(preserver.cloneContents());
		
		// Copy the contents after the carat into the new "after" block.
		if (end_chop.nodeName == before_tag)
			Util.Range.set_end(preserver, end_chop, end_chop.childNodes.length);
		else
			Util.Range.set_end_after(preserver, end_chop);
		Util.Range.set_start(preserver, b.end.container, b.end.offset);
		after.appendChild(preserver.cloneContents());
		
		// Delete the original contents.
		range = Util.Document.create_range(loki.document);
		if (!start_chop.previousSibling &&
			start_chop.parentNode.nodeName == before_tag)
		{
			Util.Range.set_start_before(range, start_chop.parentNode);
		} else if (start_chop.nodeName == before_tag) {
			Util.Range.set_start_before(range, start_chop);
		} else if (b.start.container.nodeName == before_tag && !b.start.offset){
			Util.Range.set_start_before(range, b.start.container);
		} else {
			Util.Range.set_start(range, b.start.container, b.start.offset)
		}
		
		if (!end_chop.nextSibling && end_chop.parentNode.nodeName == before_tag){
			Util.Range.set_end_after(range, end_chop.parentNode);
		} else if (end_chop.nodeName == before_tag) {
			Util.Range.set_end_after(range, end_chop);
		} else {
			Util.Range.set_end(range, b.end.container, b.end.offset);
		}
		Util.Range.delete_contents(range);
		
		pad_block(before);
		pad_block(after);
		
		// Opera needs this done in the reverse order from everyone else
		// for some reason.
		if (!Util.Browser.Opera) {
			Util.Range.insert_node(range, after);
			Util.Range.insert_node(range, before);
		} else {
			Util.Range.insert_node(range, before);
			Util.Range.insert_node(range, after);
		}
		
		before.normalize();
		after.normalize();
		
		// Move cursor and scroll into view.
		range = Util.Document.create_range(loki.document);
		Util.Range.select_node_contents(range, after);
		range.collapse(true);
		
		function select_and_scroll()
		{
			Util.Selection.select_range(selection, range);

			if (after.scrollIntoView)
				after.scrollIntoView(false);
		}
		
		if (!Util.Browser.WebKit) {
			select_and_scroll();
		} else {
			select_and_scroll.defer(); // absolute voodoo
		}
			
		// All done!
		return [before, after];
	},
	
	/**
	 * Tries two possible ways to see if an element is a block: via its
	 * computed CSS, if available; otherwise blindly via its tag name.
	 */
	is_block_level: function is_block_level(node)
	{
		// Util.Element.is_block_level will throw a TypeError if it is
		// passed a non-element.
		if (!node || node.nodeType != Util.Node.ELEMENT_NODE)
			return false;
			
		try {
			// Try via computed CSS.
			return Util.Element.is_block_level(loki.window, node);
		} catch (e) {
			// Try via tag name.
			return Util.Node.is_block_level_element(node);
		}
	},
	
	/** @ignore */
	handle_delete: function handle_delete(event)
	{
		// Prevent anything from happening until support for this is written.
	},
	
	/** @ignore */
	_default_handlers: {
		ENTER: 'handle_enter',
		DELETE: 'handle_delete',
		BACKSPACE: 'handle_delete'
	}
};