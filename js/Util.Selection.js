Util.Selection = function()
{
};

Util.Selection.CONTROL_TYPE = 1;
Util.Selection.TEXT_TYPE = 2;

/**
 * Gets the current selection in the given window.
 *
 * @param	window_obj	the window object whose selection is desired
 * @return				the current selection
 */
Util.Selection.get_selection = function get_window_selection(window_obj)
{
	if (!Util.is_valid_object(window_obj)) {
		throw new TypeError('Must pass an object to get_selection().');
	}
	
	if (typeof(window_obj.getSelection) == 'function') {
		return window_obj.getSelection();
	} else if (window_obj.document.selection) {
		return window_obj.document.selection;
	} else {
		throw new Util.Unsupported_Error('getting a window\'s selection');
	}
};

/**
 * Inserts a node at the current selection. The original contents of
 * the selection are is removed. A text node is split if needed.
 *
 * @param	sel				the selection
 * @param	new_node		the node to insert
 */
Util.Selection.paste_node = function paste_node_at_selection(sel, new_node)
{
	// Remember node or last child of node, for selection manipulation below
	if ( new_node.nodeType == Util.Node.DOCUMENT_FRAGMENT_NODE )
		var selectandum = new_node.lastChild;
	else
		var selectandum = new_node;

	// Actually paste the node
	var rng = Util.Range.create_range(sel);
	Util.Range.delete_contents(rng);
	//sel = Util.Selection.get_selection(self._loki.window);
	rng = Util.Range.create_range(sel);
	Util.Range.insert_node(rng, new_node);

	// IE
	if ( Util.Browser.IE )
	{
		rng.collapse(false);
		rng.select();
	}
	// In Gecko, move selection after node
	{
		// Select all first, to avoid the annoying Gecko
		// quasi-random highlighting bug
		try // in case document isn't editable
		{
			selectandum.ownerDocument.execCommand('selectall', false, null);
			Util.Selection.collapse(sel, true); // to beg
		} catch(e) {}

		// Move the cursor where we want it
		Util.Selection.select_node(sel, selectandum); // works
		Util.Selection.collapse(sel, false); // to end
	}
};

/**
 * Removes all ranges from the given selection.
 *
 * @param	sel		the selection
 */
Util.Selection.remove_all_ranges = function clear_selection(sel)
{
	if (sel.removeAllRanges) {
		// Mozilla
		sel.removeAllRanges();
	} else if (sel.empty && !Util.is_boolean(sel.empty)) {
		sel.empty();
	} else {
		throw new Util.Unsupported_Error('clearing a selection');
	}
};

/**
 * Sets the selection to be the current range
 */
Util.Selection.select_range = function select_range(sel, rng)
{
	if (!Util.is_valid_object(sel)) {
		throw new TypeError('A selection must be provided to select_range().');
	} else if (!Util.is_valid_object(rng)) {
		throw new TypeError('A range must be provided to select_range().');
	}
	
	if (Util.is_function(sel.addRange, sel.removeAllRanges)) {
		sel.removeAllRanges();
		sel.addRange(rng);
	} else if (rng.select) {
		rng.select();
	} else {
		throw new Util.Unsupported_Error('selecting a range');
	}
};

/**
 * Selects the given node.
 */
Util.Selection.select_node = function(sel, node)
{
	// Mozilla
	try
	{
		// Select all first, to avoid the annoying Gecko
		// quasi-random highlighting bug
		try // in case document isn't editable
		{
			node.ownerDocument.execCommand('selectall', false, null);
			Util.Selection.collapse(sel, true); // to beg
		} catch(e) {}

		var rng = Util.Range.create_range(sel);
		rng.selectNode(node);
	}
	catch(e)
	{
		// IE
		try
		{
			mb('Util.Selection.select_node: in IE chunk: node', node);
			// This definitely won't work in most cases:
			/*
			if ( node.createTextRange != null )
				var rng = node.createTextRange();
			else if ( node.ownerDocument.body.createControlRange != null )
				var rng = node.ownerDocument.body.createControlRange();
			else
				throw('Util.Selection.select_node: node has neither createTextRange() nor createControlRange().');
			*/

			/*
			try
			{
				var rng = node.createTextRange();
			}
			catch(g)
			{
				var rng = node.createControlRange();
			}
			*/
			rng.select();
		}
		catch(f)
		{
			throw(new Error('Util.Selection.select_node: Neither the Gecko nor the IE way of selecting the node worked. ' +
							'When the Gecko way was tried, an error with the following message was thrown: <<' + e.message + '>>. ' +
							'When the IE way was tried, an error with the following message was thrown: <<' + f.message + '>>.'));
		}
	}
};


/**
 * Selects the contents of the given node. See 
 * Util.Range.select_node_contents for more information.
 */
Util.Selection.select_node_contents = function(sel, node)
{
	var rng = Util.Range.create_range(sel);
	Util.Range.select_node_contents(rng, node);
	Util.Selection.select_range(sel, rng);
};

/**
 * Collapses the given selection.
 *
 * @param	to_start	boolean: true for start, false for end
 */
Util.Selection.collapse = function(sel, to_start)
{
	// Gecko
	try
	{
		if ( to_start )
			sel.collapseToStart();
		else
			sel.collapseToEnd();
	}
	catch(e)
	{
		// IE
		try
		{
			var rng = Util.Range.create_range(sel);
			if ( rng.collapse != null )
			{
				rng.collapse(to_start);
				rng.select();
			}
			// else it's a controlRange, for which collapsing doesn't make sense (?)
		}
		catch(f)
		{
			throw(new Error('Util.Selection.collapse: Neither the Gecko nor the IE way of collapsing the selection worked. ' +
							'When the Gecko way was tried, an error with the following message was thrown: <<' + e.message + '>>. ' +
							'When the IE way was tried, an error with the following message was thrown: <<' + f.message + '>>.'));
		}

	}
};

/**
 * Returns whether the given selection is collapsed.
 */
Util.Selection.is_collapsed = function selection_is_collapsed(sel)
{
	if (!Util.is_undefined(sel.isCollapsed))
		return sel.isCollapsed;
		
	if (sel.anchorNode && sel.focusNode) {
		return (sel.anchorNode == sel.focusNode &&
			sel.anchorOffset == sel.focusOffset);
	}
	
	var rng;
	
	try {
		rng = Util.Range.create_range(sel);
	} catch (e) {
		if (e.code == 1)
			return true;
		else
			throw e;
	}
	
	if ( rng.text != null )
		return rng.text == '';
	else if ( rng.length != null )
		return rng.length == 0;
	else if ( rng.collapsed != null )
		return rng.collapsed;
	else
		throw("Util.Selection.is_selection_collapsed: Couldn't determine whether selection is collapsed.");
};

/**
 * Creates a bookmark for the current selection: a representation of the state
 * of the selection from which that state can be restored.
 *
 * The returned object should be treated as opaque except for one method:
 * restore(), which reselects whatever was selected when the bookmark was
 * created.
 *
 * @param {Window}	window	the window object
 * @param {Selection} sel	a window selection
 * @param {Range} [rng]	the selected range, if already known
 * @return {object} a bookmark object with a restore() method
 *
 * Algorithm from TinyMCE.
 */
Util.Selection.bookmark = function create_selection_bookmark(window, sel, rng)
{
	if (!rng) {
		// Create the range from the selection if one was not provided.
		// The range should be provided by Loki due to the quirk of Safari
		// explained in the function listen_for_context_changes within UI.Loki.
		
		rng = Util.Range.create_range(sel);
	}
	
	var doc = Util.Selection.get_document(sel, range);
	var dim = Util.Document.get_dimensions(doc);
	var elem;
	var i;
	var other_range;
	
	if (doc != window.document) {
		throw new Error('The selection and window are for different ' +
			'documents.');
	}
	
	var pos = {
		x: dim.scroll.left,
		y: dim.scroll.top
	}
	
	// Try the native Windows IE text range implementation. This branch was not
	// in the original TinyMCE code.
	if (range.getBookmark) {
		try {
			var mark_id = range.getBookmark();
			return {
				range: range,
				id: mark_id,
				
				restore: function restore_native_ie_bookmark()
				{
					this.range.moveToBookmark(this.id);
				}
			}
		} catch (e) {
			// Ignore the error and try the other methods.
		}
	}
	
	if (sel.addRange && doc.createRange && doc.createTreeWalker) {
		// W3C Traversal and Range, and Mozilla (et al.) selections
		
		// Returns a bookmark object that only re-scrolls to the marked position
		function position_only_bookmark(position)
		{
			return {
				window: window,
				pos: position,
				
				restore: function restore_position_only_bookmark()
				{
					if (typeof(console) == 'object') {
						var message = 'Position-only bookmark used.';
						
						if (console.warn)
							console.warn(message);
						else if (console.log)
							console.log(message);
					}
					
					this.window.scrollTo(this.pos.x, this.pos.y);
				}
			}
		}
		
		// Gets the currently selected element or the common ancestor element
		// for the selection's start and end. Taken directly from TinyMCE; I
		// don't understand all of what it's doing.
		function get_node()
		{
			var elem = rng.commonAncestorContainer;
			
			// Handle selection of an image or another control-like element
			// (e.g. an anchor).
			if (!rng.collapsed) {
				var wk = Util.Browser.WebKit;
				var same_container = (rng.startContainer == rng.endContainer ||
					(wk && rng.startContainer == rng.endContainer.parentNode));
				if (same_container) {
					if (wk || rng.startOffset - rng.endOffset < 2) {
						if (rng.startContainer.hasChildNodes()) {
							elem =
								rng.startContainer.childNodes[rng.startOffset];
						}
							
					}
				}
			}
			
			while (elem) {
				if (elem.nodeType == Util.Node.ELEMENT_NODE)
					return elem;
				elem = elem.parentNode;
			}
			
			return null;
		}
		
		// Image selection
		elem = get_node();
		if (elem && elem.nodeName == 'IMG') {
			// TinyMCE does this, though I don't know why.
			return position_only_bookmark(pos);
		}
		
		// Determines the textual position of a range relative to the body,
		// given the range's relevant start and end nodes. Only gives an answer
		// if start and end are both text nodes.
		function get_textual_position(start, end)
		{
			var bounds = {start: undefined, end: undefined};
			var walker = document.createTreeWalker(doc.body,
				NodeFilter.SHOW_TEXT, null, false);
			// Note that the walker will only retrieve text nodes.
			
			for (var p = 0, n = walker.nextNode(); n; n = walker.nextNode()) {
				if (n == start) {
					// Found the starting node in the tree under the root.
					// Store the position at which it was found.
					bounds.start = p;
				}
				
				if (n == end) { // not "else if" in case start == end.
					// Found the ending node in the tree under the root.
					// Store the position at which it was found and return the
					// boundaries.
					bound.end = p;
					return bounds;
				}
				
				if (n.nodeValue)
					p += n.nodeValue.length;
			}
			
			return null; // Never did find the end node. Eek.
		}
		
		var bounds, start, end;
		if (Util.Selection.is_collapsed(sel)) {
			bounds = get_textual_position(sel.anchorNode, sel.focusNode);
			if (!bounds) {
				return position_only_bookmark(pos);
			}
			
			bounds.start += sel.anchorOffset;
			bound.end += sel.focusOffset;
		} else {
			bounds = get_textual_position(rng.startContainer, rng.endContainer);
			if (!bounds) {
				return position_only_bookmark(pos);
			}
			
			bounds.start += rng.startOffset;
			bound.end += rng.endOffset;
		}
		
		return {
			selection: sel,
			window: window,
			document: doc,
			body: doc.body,
			pos: pos,
			start: bounds.start,
			end: bounds.end,
			
			restore: function restore_w3c_bookmark()
			{
				var walker = this.document.createTreeWalker(this.body,
					NodeFilter.SHOW_TEXT, null, false);
				var bounds = {};
				var pos = 0;
				
				window.scrollTo(this.pos.x, this.pos.y);
				
				while (n = walker.nextNode()) { // assignment intentional
					if (n.nodeValue)
						pos += n.nodeValue.length;
					
					if (pos >= this.start && !bounds.startNode) {
						// This is the first time we've reached our marked
						// starting position. Record the starting node and
						// offset.
						bounds.startNode = n;
						bounds.startOffset = this.start -
							(pos - n.nodeValue.length);
					}
					
					if (pos >= this.end) { // not "else if" in case start == end
						// We've reached our ending position. Record the ending
						// node and offset and stop the search.
						bounds.endNode = n;
						bounds.endOffset = this.end -
							(pos - n.nodeValue.length);
						
						break;
					}
				}
				
				if (!bounds.endNode)
					return;
				
				var range = this.document.createRange();
				range.setStart(bounds.startNode, bounds.setOffset);
				range.setEnd(bounds.endNode, bounds.endOffset);
				
				this.selection.removeAllRanges();
				this.selection.addRange(range);
				
				if (!Util.Browser.Opera) // ???
					this.window.focus();
			}
		};
	} else if (rng.length && rng.item) {
		// Internet Explorer control range.
		
		elem = rng.item(0);
		
		// Find the index of the element in the NodeList of elements with its
		// tag name. I'm not sure why this is being done (perhaps it keeps the
		// selected Node object from being retained?), or if it works properly,
		// but I'm just porting the TinyMCE implementation.
		function get_element_index(elem)
		{
			var elements = doc.getElementsByTagName(elem.nodeName);
			for (var i = 0; i < elements.length; i++) {
				if (elements[i] == n)
					return i;
			}
		}
		
		i = get_element_index(elem);
		if (Util.is_blank(i)) {
			throw new Error('Cannot create bookmark; the selected element ' +
				'cannot be found in the editing document.');
		}
		
		return {
			window: window,
			tag: e.nodeName,
			index: i,
			pos: pos,
			
			restore: function restore_ie_control_range_bookmark()
			{
				var rng = doc.body.createControlRange();
				var elements = doc.getElementsByTagName(this.tag);
				var el = elements[this.index];
				if (!el) {
					throw new Error('Could not retrieve the bookmark target.');
				}
				
				this.window.scrollTo(this.pos.x, this.pos.y);
				rng.addElement(el);
				rng.select();
			}
		};
	} else if (!Util.is_blank(rng.length) && rng.moveToElementText) {
		// Internet Explorer text range
		
		// Figure out the position of the range. We do this in a slightly crude
		// way, by attempting to move the range backwards by a large number of
		// characters and seeing how many characters we actually moved.
		function find_relative_position(range, collapse_to_start)
		{
			range.collapse(collapse_to_start);
			// TextRange.move() returns the number of units actually moved
			return Math.abs(range.move('character', -0xFFFFFF));
		}
		
		// Establish a baseline by finding the position of the body.
		other_range = doc.body.createTextRange();
		other_range.moveToElementText(doc.body);
		var body_pos = find_relative_position(other_range, true);
		
		// Find how far the start side of the selection is from the selection's
		// base.
		other_range = rng.duplicate();
		var start_pos = find_relative_position(other_range, true);
		
		// Find the length of the range by finding how far the end side is
		// from the base and subtracting the start position from it.
		other_range = rng.duplicate();
		var length = find_relative_position(other_range, false) - start_pos;
		
		return {
			window: window,
			body: doc.body,
			start: start_pos - body_pos, // start pos. of range relative to body
			length: length,
			pos: pos,
			
			restore: function restore_ie_text_range_bookmark()
			{
				// Sanity check
				if (b.start < 0) {
					throw new Error('Invalid bookmark: starting point is ' +
						'negative.');
				}
				
				this.window.scrollTo(this.pos.x, this.pos.y);
				
				// Create a new range that we can select.
				var range = this.body.createTextRange();
				range.moveToElementText(this.body);
				range.collapse(true); // collapse to beginning of body
				
				// The move methods are relative, so we first move the range's
				// start forward to the bookmarked start position.
				range.moveStart('character', b.start);
				
				// In doing so, we also moved the end position forward by the
				// same amount (because you can't have a range's end occur
				// before its start). Now all we have to do is move the end of
				// the range forward by the bookmarked length.
				range.moveEnd('character', b.length);
				
				// Done!
				range.select();
			}
		};
	} else {
		throw new Util.Unsupported_Error('bookmarking a selection');
	}
};

/**
 * Gets the selection's owner document.
 * @param {Selection}	sel 
 * @param {Range}	rng	the selected range, if already known
 * @return {Document}
 */
Util.Selection.get_document = function get_selection_document(sel, rng)
{
	if (!rng) {
		// Create the range from the selection if one was not provided.
		// The range should be provided by Loki due to the quirk of Safari
		// explained in the function listen_for_context_changes within UI.Loki.
		
		rng = Util.Range.create_range(sel);
	}
	
	var elem = (sel.anchorNode // Mozilla (and friends) selection object
		|| rng.startContainer // W3C Range
		|| (rng.parentElement && rng.parentElement())); // IE TextRange
		
	if (!elem) {
		throw new Util.Unsupported_Error("getting a selection's owner " +
			"document");
	}
	
	return elem.ownerDocument;
}

/**
 * Returns the selected element, if any. Otherwise returns null.
 * Imitates FCK code.
 */
Util.Selection.get_selected_element = function(sel)
{
	if ( Util.Selection.get_selection_type(sel) == Util.Selection.CONTROL_TYPE )
	{
		// Gecko
		if ( sel.anchorNode != null && sel.anchorOffset != null )
		{
			return sel.anchorNode.childNodes[sel.anchorOffset];
		}
		// IE
		else
		{
			var rng = Util.Range.create_range(sel);
			if ( rng != null && rng.item != null )
				return rng.item(0);
		}
	}
};

/**
 * Gets the type of currently selection.
 * Imitates FCK code.
 */
Util.Selection.get_selection_type = function(sel)
{
	var type;

	// IE
	if ( sel.type != null )
	{
		if ( sel.type == 'Control' )
			type = Util.Selection.CONTROL_TYPE;
		else
			type = Util.Selection.TEXT_TYPE;
	}

	// Gecko
	else
	{
		type = Util.Selection.TEXT_TYPE;

		if ( sel.rangeCount == 1 )
		{
			var rng = sel.getRangeAt(0);
			if ( rng.startContainer == rng.endContainer && ( rng.endOffset - rng.startOffset ) == 1 )
			{
				type = Util.Selection.CONTROL_TYPE;
			}
		}
	}

	return type;
};

/**
 * Moves the cursor to the end (but still inside) the given
 * node. This is useful to call after performing operations 
 * on nodes.
 */
Util.Selection.move_cursor_to_end = function(sel, node)
{
	// Move cursor
	var rightmost = Util.Node.get_rightmost_descendent(node);
	if ( rightmost.nodeName == 'BR' && rightmost.previousSibling != null )
		rightmost = Util.Node.get_rightmost_descendent(rightmost.previousSibling);
	mb('rightmost', rightmost);

	// XXX This doesn't really work right in IE, although it is close
	// enough for now
	if ( rightmost.nodeType == Util.Node.TEXT_NODE )
		Util.Selection.select_node(sel, rightmost);
	else
		Util.Selection.select_node_contents(sel, rightmost);

	Util.Selection.collapse(sel, false); // to end
};
