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
		// Modern releases of TinyMCE bail out if Opera is detected and allow it
		// to use its default behavior since it is apparently "really good".
		// We may want to do the same after some testing.
		
		var loki = event.loki;
		var body = loki.body;
		var selected_range = loki.get_selected_range();
		
		/*
		 * Tries two possible ways to see if an element is a block: via its
		 * computed CSS, if available; otherwise blindly via its tag name.
		 */
		function is_block_level(node)
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
		}
		
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
		
		console.debug(b.start, b.end);
		
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
		
		console.debug(b.start.block, b.end.block);
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