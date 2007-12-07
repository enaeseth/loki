/**
 * Does nothing.
 * @constructor
 *
 * @class Group of functions related to ranges. Useful links:
 * <li><a href="http://www.w3.org/TR/2000/REC-DOM-Level-2-Traversal-Range-20001113/ranges.html">W3C range spec</a></li>
 * <li><a href="http://www.mozilla.org/docs/dom/domref/dom_range_ref.html">Mozilla's Range interface reference</a></li>
 * <li><a href="http://msdn.microsoft.com/workshop/author/dhtml/reference/objects/obj_textrange.asp">Microsoft's documentation on TextRange objects</a></li>
 */
Util.Range = function()
{
};

/**
 * Creates a range from a selection.
 *
 * @param	sel		the selection from which to create range.
 * @return			the created range
 */
Util.Range.create_range = function create_range_from_selection(sel)
{
	if (typeof(sel.getRangeAt) == 'function')
		return sel.getRangeAt(0);
	else if (typeof(sel.createRange) == 'function')
		return sel.createRange();
	else {
		throw new Util.Unsupported_Error('creating a range from a selection');
	}
};

/**
 * Gets the ancestor node which surrounds the given range.
 * XXX: probably better usually to use get_start_container, to
 * follow the convention used elsewhere in Loki. -NB
 *
 * @param	rng		the range in question
 * @return			the ancestor node which surrounds the range
 */
Util.Range.get_common_ancestor = function get_range_common_ancestor(rng)
{
	if (rng.commonAncestorContainer) // W3C
		return rng.commonAncestorContainer;
	else if (rng.parentElement) // Internet Explorer TextRange
		return rng.parentElement();
	else if (rng.item) // Internet Explorer ControlRange
		return rng.item(0);
	
	throw new Util.Unsupported_Error('getting a range\'s common ancestor');
};

/**
 * Returns the start container of the given range (if
 * the given range is a text range) or starting element
 * (i.e., first contained node, if the given range is a control 
 * range)
 * 
 * @param	rng		the range in question
 * @return			the start container of the range
 */
Util.Range.get_start_container = function get_range_start_container(rng)
{
	// Gecko
	try
	{
		// Control range
		//   This is not precisely like IE's control range. But it is
		//   like it in that if one entire element is selected, 
		//   this function returns that element (rng.item(0)),
		//   which does what we want. (Otherwise, for example editing 
		//   images and links breaks.)
		//   
		//   (Note: if this breaks, consult the archived versions--I've
		//   played with this a lot to get it to work right.)
		var frag = rng.cloneContents();
		if (frag.firstChild == frag.lastChild &&
			 frag.firstChild != null &&
		     frag.firstChild.nodeType != Util.Node.TEXT_NODE &&
			 frag.lastChild != null &&
		     frag.lastChild.nodeType != Util.Node.TEXT_NODE)
		{
			var siblings = rng.commonAncestorContainer.childNodes;
			for (var i = 0; i < siblings.length; i++)
				if (rng.compareNode(siblings[i]) == rng.NODE_INSIDE)
					return siblings[i];
		}

		// Text range
		if (rng.startContainer.nodeType == Util.Node.TEXT_NODE) // imitate IE below
			return rng.startContainer.parentNode;
		else
			return rng.startContainer;
	}
	catch(e)
	{
		// IE
		try
		{
			// Control range
			if (rng.item != null)
			{
				return rng.item(0);
			}
			// Text range
			else if (rng.parentElement != null)
			{
				// original, works in most circumstances:
				//return rng.parentElement();
				var rng2 = rng.duplicate();
				rng2.collapse(true); // to start
				return rng2.parentElement();
			}
		}
		catch(f)
		{
			throw(new Error('Util.Range.get_start_container(): Neither the Mozilla nor the IE way of getting the start container worked. ' +
								'When the Mozilla way was tried, an error with the following message was thrown: <<' + e.message + '>>. ' +
								'When the IE way was tried, an error with the following message was thrown: <<' + f.message + '>>.'));
		}
	}
};

/**
 * Returns the end container of the given range (if
 * the given range is a text range) or ending element
 * (i.e., last contained node, if the given range is a 
 * control range)
 *
 * @param	rng		the range in question
 * @return			the end container of the range
 */
Util.Range.get_end_container = function get_range_end_container(rng)
{
	// Gecko
	try
	{
		// Control range
		//   This is not precisely like IE's control range. But it is
		//   like it in that if one entire element is selected, 
		//   this function returns that element (rng.item(0)),
		//   which does what we want. (Otherwise, for example editing 
		//   images and links breaks.)
		//   
		//   (Note: if this breaks, consult the archived versions--I've
		//   played with this a lot to get it to work right.)
		//
		//   (Note: this does precisely the same thing as get_start_container
		//   for control ranges, because the range is only considered a control
		//   range if the first and last elements are identical. Previous 
		//   versions didn't work this way.)
		var frag = rng.cloneContents();
		if (frag.firstChild == frag.lastChild &&
			 frag.firstChild != null &&
		     frag.firstChild.nodeType != Util.Node.TEXT_NODE &&
			 frag.lastChild != null &&
		     frag.lastChild.nodeType != Util.Node.TEXT_NODE)
		{
			var siblings = rng.commonAncestorContainer.childNodes;
			for (var i = 0; i < siblings.length; i++)
				if (rng.compareNode(siblings[i]) == rng.NODE_INSIDE)
					return siblings[i];
		}

		// Text range
		if (rng.endContainer.nodeType == Util.Node.TEXT_NODE) // imitate IE below
			return rng.endContainer.parentNode;
		else
			return rng.endContainer;
	}
	catch(e)
	{
		// IE
		try
		{
			// Control range
			if (rng.item != null)
			{
				return rng.item(rng.length - 1);
			}
			// Text range
			else if (rng.parentElement != null)
			{
				var rng2 = rng.duplicate();
				rng2.collapse(false); // to end
				return rng2.parentElement();
			}
		}
		catch(f)
		{
			throw(new Error('Util.Range.get_start_container(): Neither the Mozilla nor the IE way of getting the start container worked. ' +
								'When the Mozilla way was tried, an error with the following message was thrown: <<' + e.message + '>>. ' +
								'When the IE way was tried, an error with the following message was thrown: <<' + f.message + '>>.'));
		}
	}
};


/**
 * Deletes the contents of the given range.
 *
 * @param	rng		the range
 */
Util.Range.delete_contents = function delete_range_contents(rng)
{
	if (Util.is_function(rng.deleteContents)) { // W3C
		rng.deleteContents();
	} else if (Util.is_function(rng.pasteHTML)) { // TextRange
		rng.pasteHTML('');
	} else if (Util.is_function(rng.item, rng.remove)) { // ControlRange
		while (rng.length > 0) {
			var item = rng.item(0);
			item.parentNode.removeChild(item);
			rng.remove(0);
		}
	} else {
		throw new Util.Unsupported_Error("deleting a range's contents");
	}
};

/**
 * Inserts a node at the beginning of the given range.
 *
 * @param	rng		the range
 * @param	node	the node to insert
 */
Util.Range.insert_node = function insert_node_in_range(rng, node)
{
	// W3C
	try
	{
		rng.insertNode(node);
	}
	catch(e)
	{
		// IE TextRange
		try
		{
/*
			rng.collapse(true); // collapse to start
			rng.pasteHTML(node.outerHTML);
*/

			rng.collapse(true); // collapse to start
			// XXX (EN): Why is this temporary node pasted?
			rng.pasteHTML('<span id="util_range_insert_node__tmp_node"></span>');
			var tmp = node.ownerDocument.getElementById('util_range_insert_node__tmp_node');
			tmp.parentNode.insertBefore(node, tmp);
			tmp.parentNode.removeChild(tmp);
		}
		catch(f)
		{
			// IE ControlRange
			try
			{
				// Collapse to start
// 				while (rng.length > 0)
// 					rng.remove(0);

				// This will only work, I think, if node is an element
				rng.addElement(node);
			}
			catch(g)
			{
				throw(new Error('Util.Range.insert_node(): Neither the W3C nor the IE way of inserting the given node worked. ' +
								'When the W3C way was tried, an error with the following message was thrown: <<' + e.message + '>>. ' +
								'When the IE TextRange way was tried, an error with the following message was thrown: <<' + f.message + '>>. ' +
								'When the IE ControlRange way was tried, an error with the following message was thrown: <<' + g.message + '>>.'));
			}
		}
	}
};

/**
 * Clones the given range.
 *
 * @param	rng		the range
 * @return			a clone of rng
 */
Util.Range.clone_range = function clone_range(rng)
{
	if (Util.is_function(rng.cloneRange)) {
		return rng.cloneRange();
	} else if (Util.is_function(rng.duplicate)) {
		return rng.duplicate();
	} else {
		throw new Util.Unsupported_Error("cloning a range");
	}
};

/**
 * Gets the html of the range.
 */
Util.Range.get_html = function get_html_of_range(rng)
{
	var html = '';
	try // Gecko
	{
		var frag = rng.cloneContents();
		var container = rng.startContainer.ownerDocument.createElement('DIV');
		container.appendChild(frag);
		html = container.innerHTML;
	}
	catch(e)
	{
		try // IE
		{
			if (rng.htmlText != null)
				html = rng.htmlText;
			else if (rng.length > 0)
			{
				for (var i = 0; i < rng.length; i++)
					html += rng.item(i).outerHTML;
			}
		}
		catch(f)
		{
			throw('Util.Range.get_html(): Neither the Gecko nor the IE way of getting the image worked. ' +
				  'When the Gecko way was tried, an error with the following message was thrown: <<' + e.message + '>>. ' +
				  'When the IE way was tried, an error with the following message was thrown: <<' + f.message + '>>.');
		}
	}
	return html;
};

/**
 * Gets the given range's nearest ancestor which is a block-level
 * element
 *
 * @param	rng		the starting range
 * @return			the matching ancestor, if any
 */
Util.Range.get_nearest_bl_ancestor_element =
	function get_nearest_block_level_ancestor_element_of_range(rng)
{
	return Util.Range.get_nearest_ancestor_node(rng, Util.Node.is_block_level_element);
};

/**
 * Gets the given range's nearest ancestor which maches the given
 * test.
 *
 * @param	rng				the starting range
 * @param	boolean_test	the test
 * @return					the matching ancestor, if any
 */
Util.Range.get_nearest_ancestor_node =
	function get_nearest_ancestor_node_of_range(rng, boolean_test)
{
	//var ancestor = Util.Range.get_common_ancestor(rng);
	var ancestor = Util.Range.get_start_container(rng);
	if (boolean_test(ancestor))
	{
		return ancestor;
	}
	else
	{
		//messagebox("Util.Range.get_nearest_ancestor_node: just before recursing with boolean_test; <br />\n" +
			  //"ancestor.outerHTML is " + ancestor.outerHTML + "<br />\n" +
			  //"ancestor == null is " + (ancestor == null ? 'true' : 'false'));
		return Util.Node.get_nearest_ancestor_node(ancestor, boolean_test);
	}
};

/**
 * Gets the given range's nearest ancestor which is an element whose
 * tagname matches the one given.
 *
 * @param	rng				the starting range
 * @param	tag_name		the desired tag name	
 * @return					the matching ancestor, if any
 */
Util.Range.get_nearest_ancestor_element_by_tag_name =
	function get_nearest_ancestor_element_of_range_by_tag_name(rng, tag_name)
{
	var boolean_test = function(node)
	{
		return (node.nodeType == Util.Node.ELEMENT_NODE &&
			     node.tagName == tag_name);
	};
	return Util.Range.get_nearest_ancestor_node(rng, boolean_test);
};

/**
 * Gets clones of the child nodes of the given range. Currently, this
 * will only work under IE if the given range is a controlRange
 * collection, but not if it's a textRange object. (If a textRange is
 * given, no error will be thrown, but an empty array will be
 * returned.)
 *
 * @param	rng		the range whose children to clone
 * @return			an array of clones of the given range's children
 */
Util.Range.get_cloned_children = function clone_children_of_range(rng)
{
	var child_nodes = new Array();
	try
	{
		var doc_frag = rng.cloneContents();
		var node_list = doc_frag.childNodes;
		for (var i = 0; i < node_list.length; i++)
			child_nodes.push(node_list.item(i));
	}
	catch(e)
	{
		try
		{
			if (rng.item) // if this is a controlRange collection rather than a textRange Object
			{
				for (var i = 0; i < rng.length; i++)
					child_nodes.push(rng.item(i).cloneNode(true));
			}
		}
		catch(f)
		{
			throw(new Error('Util.Range.get_cloned_children(): Neither the W3c nor the Mozilla way of getting the image worked. ' +
							'When the W3C way was tried, an error with the following message was thrown: <<' + e.message + '>>. ' +
							'When the IE way was tried, an error with the following message was thrown: <<' + f.message + '>>.'));
		}
	}
	return child_nodes;
};

/**
 * Returns the text contained in the given range.
 */
Util.Range.get_text = function get_range_text(rng)
{
	var text;
	try // Gecko
	{
		text = rng.toString();		
	}
	catch(e)
	{
		try // IE
		{
			if (rng.text != null) // text range
				text = rng.text;
			else // control range
				text = ''; // XXX is this desirable?
		}
		catch(f)
		{
			throw(new Error('Util.Range.get_text(): Neither the Gecko nor the IE way of getting the text worked. ' +
							'When the Gecko way was tried, an error with the following message was thrown: <<' + e.message + '>>. ' +
							'When the IE way was tried, an error with the following message was thrown: <<' + f.message + '>>.'));
		}
	}
	return text;
};

// XXX: These two functions might only work for Gecko right now (and only need to)
Util.Range.is_at_end_of_block = function is_range_at_end_of_block(rng, block)
{
	var ret =
		Util.Node.get_rightmost_descendent(block) == 
		Util.Node.get_rightmost_descendent(rng.startContainer) &&
		// either the start container is not a text node, or 
		// the range (i.e. cursor) is at the end of the text node
		(//rng.startContainer.nodeType != Util.Node.TEXT_NODE ||
		  rng.startOffset == rng.startContainer.length); // added - 1 // 
	return ret;
};

Util.Range.is_at_beg_of_block = function is_range_at_beginning_of_block(rng, block)
{
	var ret =
		// the start container is on the path to the leftmost descendent of the current block
		Util.Node.get_leftmost_descendent(block) == 
		Util.Node.get_leftmost_descendent(rng.startContainer) &&
		// either the start container is not a text node, or 
		// the range (i.e. cursor) is at the beginning of the text node
		(rng.startContainer.nodeType != Util.Node.TEXT_NODE ||
		  rng.startOffset == 0);
	return ret;
};

Util.Range.is_at_end_of_text = function is_range_at_end_of_text(rng)
{
	return (rng.endContainer.nodeType == Util.Node.TEXT_NODE && rng.endOffset == rng.endContainer.length);
};

Util.Range.is_at_beg_of_text = function is_range_of_beginning_of_text(rng)
{
	return (rng.startContainer.nodeType == Util.Node.TEXT_NODE && rng.startOffset == 0);
}

/**
 * @see Util.Range.surrounded_by_node
 */
Util.Range.intersects_node = function range_intersects_node(rng, node)
{
	var doc = node.ownerDocument;
	var node_rng;
	
	if (Util.is_function(rng.intersectsNode)) { // Gecko < 1.9
		return rng.intersectsNode(node);
	} else if (Util.is_function(doc.createRange)) { // W3C
		node_rng = doc.createRange();
		
		try {
			node_rng.selectNode(node);
		} catch (e) {
			node_rng.selectNodeContents(node);
		}
		
		return (rng.compareBoundaryPoints(Range.END_TO_START, node_rng) == -1
			&& rng.compareBoundaryPoints(Range.START_TO_END, node_rng) == 1);
	} else if (Util.is_function(doc.body.createTextRange)) {
		// This *might* work. -Eric
		
		node_rng = doc.body.createTextRange();
		node_rng.moveToNodeText(node);
		
		return (rng.compareEndPoints('EndToStart', node_rng) == -1 &&
			rng.compareEndPoints('StartToEnd', node_rng) == 1);
	} else {
		throw new Util.Unsupported_Error('testing whether a node intersects ' +
			' a range');
	}
}

// XXX doesn't work, I believe
/**
 * Returns a list of all descendant nodes that match boolean_test.
 */
Util.Range.get_descendant_nodes =
	function get_range_descendant_nodes(rng, boolean_test)
{
	var matches = [];

	// we use depth-first so that the matches are ordered 
	// according to their position in the document
	var search = function(node)
	{
		for (var i = 0; i < node.childNodes.length; i++)
		{
			search(node.childNodes[i]);
			if (Util.Range.intersects_node(rng, node.childNodes[i]) && boolean_test(node))
				matches.push(node.childNodes[i]);
		}
	}

	var ancestor = Util.Range.get_common_ancestor(rng);
	search(ancestor);

	return matches;
};

// XXX doesn't work
Util.Range.get_elements_within_range = Util.Function.unimplemented;
//Util.Range.get_elements_within_range = function(rng, boolean_test)

/**
 * Compares the boundary points of the two given ranges.
 * Modified from <http://msdn.microsoft.com/workshop/author/dhtml/reference/methods/compareendpoints.asp>:
 * @param	how		Util.Range constant that specifies one of the following values:
 * 						START_TO_START	Compare the start of rng1 with the start of rng2.
 * 						START_TO_END	Compare the start of rng1 with the end of rng2.
 * 						END_TO_START	Compare the end of rng1 with the start of rng2.
 * 						END_TO_END		Compare the end of rng1 with the end of rng2.
 * @return			Returns one of the following possible values:
 *						-1	The end point of rng1 is further to the left than the end point of rng2.
 *						0	The end point of rng1 is at the same location as the end point of rng2.
 *						1	The end point of rng1 is further to the right than the end point of rng2.
 */
Util.Range.START_TO_START = 2;
Util.Range.START_TO_END = 3;
Util.Range.END_TO_START = 4;
Util.Range.END_TO_END = 5;
Util.Range.LEFT = -1;
Util.Range.SAME = 0;
Util.Range.RIGHT = 1;
Util.Range.compare_boundary_points =
	function compare_range_boundary_points(rng1, rng2, how)
{
	if (!Util.is_valid_object(rng1, rng2)) {
		throw new TypeError('Two range objects must be passed to ' +
			'Util.Range.compare_boundary_points.');
	}
	
	if (!Util.is_number(how)) {
		throw new TypeError('A Util.Range comparison constant must be passed ' +
			'to Util.Range.compare_boundary_points.')
	}
	
	var real_how;
	if (Util.is_function(rng1.compareBoundaryPoints)) { // W3C
		if (how == Util.Range.START_TO_START)
			real_how = rng1.START_TO_START;
		else if (how == Util.Range.START_TO_END)
			real_how = rng1.START_TO_END;
		else if (how == Util.Range.END_TO_START)
			real_how = rng1.END_TO_START;
		else if (how == Util.Range.END_TO_END)
			real_how = rng1.END_TO_END;

		return rng1.compareBoundaryPoints(real_how, rng2);
	} else if (Util.is_function(rng1.compareEndPoints)) { // IE
		if (how == Util.Range.START_TO_START)
			real_how = "StartToStart";
		else if (how == Util.Range.START_TO_END)
			real_how = "StartToEnd";
		else if (how == Util.Range.END_TO_START)
			real_how = "EndToStart";
		else if (how == Util.Range.END_TO_END)
			real_how = "EndToEnd";

		return rng1.compareEndPoints(real_how, rng2);
	} else {
		throw new Util.Unsupported_Error("comparing two ranges' boundary " +
			"points");
	}
};

/**
 * A good explanation of what this does from <http://www.dotvoid.com/view.php?id=11>:
 * 
 * Sets the startContainer and endContainer to the supplied node 
 * with a startOffset of 0 and an endOffset of the number of child nodes 
 * the node contains or the number of characters that the node contains.
 */
Util.Range.select_node_contents = function range_select_node_contents(rng, node)
{
	if (Util.is_function(rng.selectNodeContents)) {
		rng.selectNodeContents(node);
	} else if (Util.is_function(rng.moveToElementText)) {
		rng.moveToElementText(node);
	} else {
		throw new Util.Unsupported_Error("selecting a node's contents with a " +
			"range");
	}
};

/**
 * Determines whether or not the range is entirely surrounded by the given
 * element.
 * @param {Range}	rng	range
 * @param {Element}	elem	element
 */
Util.Range.surrounded_by_node = 
	function range_surrounded_by_node(rng, elem)
{
	var n_rng;
	var doc = elem.ownerDocument;
	
	if (Util.is_function(doc.createRange)) {
		n_rng = doc.createRange();
		try {
			n_rng.selectNode(elem);
		} catch (e) {
			n_rng.selectNodeContents(elem);
		}
	} else if (Util.is_function(doc.body.createTextRange)) {
		n_rng = doc.body.createTextRange();
		n_rng.moveToNodeText(elem);
	} else {
		throw new Util.Unsupported_Error('checking if a range is entirely ' +
			'enclosed by an element');
	}
	
	var START_TO_START = Util.Range.START_TO_START;
	var END_TO_END = Util.Range.END_TO_END;
	
	return (Util.Range.compare_boundary_points(rng, n_rng, START_TO_START) >= 0
		&& Util.Range.compare_boundary_points(rng, n_rng, END_TO_END) <= 0);
}

/**
 * Gets all blocks that this range encompasses in whole or part,
 * but that do not surround the range. In other words, gets the 
 * blocks that you probably intend to work on when performing a 
 * block-level operation on a range.
 */
Util.Range.get_intersecting_blocks = function get_range_intersecting_blocks(rng)
{
	// INIT

	// Determine start and end blocks
	var start_container = Util.Range.get_start_container(rng);
	var b1;
	if (Util.Node.is_block_level_element(start_container))
		b1 = start_container;
	else
		b1 = Util.Node.get_nearest_bl_ancestor_element(start_container);

	var end_container = Util.Range.get_end_container(rng);
	var b2;
	if (Util.Node.is_block_level_element(end_container))
		b2 = end_container;
	else
		b2 = Util.Node.get_nearest_bl_ancestor_element(end_container);

	// Determine b2_and_ancestors
	var b2_and_ancestors = [];
	var cur_block = b2;
	while (cur_block != null && cur_block.nodeName != 'BODY' && cur_block.nodeName != 'TD')
	{
		b2_and_ancestors.push(cur_block);
		cur_block = cur_block.parentNode;
	}

	// HELPER FUNCTIONS

	function is_b2_or_ancestor(block)
	{
		for (var i = 0; i < b2_and_ancestors.length; i++)
			if (block == b2_and_ancestors[i])
			{
				mb('found match in is_b2_ancestor: block', block);
				return true;
			}
		return false;
	}

	/**
	 * Looks for the branch of the DOM tree that is closest to b1, while still
	 * containing and either b2 or an ancestor of b2 (and b1 or anancestor of b1).
	 * Does this by climbing the tree, starting at b1's parent, looking for an
	 * ancestor of b2 among the current branch's child nodes.
	 *
	 * @return	object with properties branch, b1_or_ancestor, and b2_or_ancestor,
	 * 			the latter two being children of branch.
	 */
	function look_for_closest_branch_common_to_b1_and_b2(branch, b1_or_ancestor)
	{
		// Try this branch
		for (var i = 0; i < branch.childNodes.length; i++)
		{
			var cur = branch.childNodes[i];
			if (is_b2_or_ancestor(cur))
			{
				var b2_or_ancestor = cur;
				return { branch : branch, b1_or_ancestor : b1_or_ancestor, b2_or_ancestor : b2_or_ancestor };
			}
		}

		// Otherwise try parent branch
		return look_for_closest_branch_common_to_b1_and_b2(branch.parentNode, branch);
		// (branch will be the ancestor of b1 among the branch.parentNode.childNodes)
	}

	function get_intersecting_blocks(branch, b1_or_ancestor, b2_or_ancestor)
	{
		var blocks = [];
		var start = false;
		for (var i = 0; i < branch.childNodes.length; i++)
		{
			var cur = branch.childNodes[i];
			if (cur == b1_or_ancestor)
				start = true;
			if (start)
				blocks.push(cur);
			if (cur == b2_or_ancestor)
			{
				start = false;
				break;
			}
		}
		return blocks;
	}

	// DO IT

	var starting_branch = b1.parentNode;
	var ret = look_for_closest_branch_common_to_b1_and_b2(starting_branch, b1)
	return get_intersecting_blocks(ret.branch, ret.b1_or_ancestor, ret.b2_or_ancestor);
};

Util.Range.set_start = function set_range_start(rng, start, offset)
{
	try // W3C
	{
		rng.setStart(start, offset);
	}
	catch(e)
	{
		try // IE
		{
			// Taken from <http://jorgenhorstink.nl/test/javascript/range/range.js>
			var node = start;

			if (start.nodeType == 3) {
			  // text nodes
			  var moveCharacters = offset;
			  var moveToNode = null, collapse = true;
			  while (node.previousSibling) {
				switch (node.previousSibling.nodeType) {
				  case 1:
					// Right candidate node for moving the Range to is found
					moveToNode = node.previousSibling;
					collapse   = false;
					break;
				  case 3:
					moveCharacters += node.previousSibling.data.length;
					break;
				}
				// if a right candidate is found, we escape the while
				if (moveToNode != null) {
				  break;
				}
				node = node.previousSibling;
			  }
			  // no right candidate is found, so we select the parent node
			  // of the start node (which is an Element node always, since
			  // start node is a Text node).
			  if (moveToNode == null) {
				moveToNode = start.parentNode;
				collapse   = true;
			  }
			  rng.moveToElementText(moveToNode);
			  rng.collapse(collapse);
			  rng.move('Character', moveCharacters);
			} else if (start.nodeType == 1) {
			  // elements
			  switch (Range.startContainer.childNodes.item(Range.startOffset).nodeType) {
				case 1:
				case 3:          
				  Range.setStart(Range.startContainer.childNodes.item(Range.startOffset), 0);
				  return this._selectStart(Range);
				  break;
				default:
				  alert('error');
			  }
			}  
		}
		catch(f)
		{
			throw(new Error('Util.Range.set_start(): Neither the W3C nor the IE way of setting the range\'s start worked. ' +
							'When the Mozilla way was tried, an error with the following message was thrown: <<' + e.message + '>>. ' +
							'When the IE way was tried, an error with the following message was thrown: <<' + f.message + '>>.'));
		}
	}
};

Util.Range.set_end = function set_range_end(rng, end, offset)
{
	try // W3C
	{
		rng.setEnd(end, offset);
	}
	catch(e)
	{
		try // IE
		{
			// Taken from <http://jorgenhorstink.nl/test/javascript/range/range.js>
			var node = end;

			if (end.nodeType == 3) {
			  // text nodes
			  var moveCharacters = end.data.length - offset;
			  var moveToNode = null, collapse = false;
			  while (node.nextSibling) {
				switch (node.nextSibling.nodeType) {
				  case 1:
					// Right candidate node for moving the Range to is found
					moveToNode = node.nextSibling;
					collapse   = true;
					break;
				  case 3:
					moveCharacters += node.nextSibling.data.length;
					break;
				}
				// if a right candidate is found, we escape the while
				if (moveToNode != null) {
				  break;
				}
				node = node.nextSibling;
			  }
			  // no right candidate is found, so we select the parent node
			  // of the start node (which is an Element node always, since
			  // start node is a Text node).
			  if (moveToNode == null) {
				moveToNode = end.parentNode;
				collapse   = false;
			  }

			  // block level elements have a closing space after collapsing
			  switch (moveToNode.nodeName.toLowerCase()) {
				case 'p':
				case 'div':
				case 'h1':
				case 'h2':
				case 'h3':
				case 'h4':
				case 'h5':
				case 'h6':
				// need some extension
				  moveCharacters++;
			  }
			  //alert(moveCharacters);
			  WindowsRange.moveToElementText(moveToNode);
			  WindowsRange.collapse(collapse);

			  WindowsRange.move('Character', -moveCharacters);

			} else if (end.nodeType == 1) {
			  // elements
			  switch (Range.endContainer.childNodes.item(Range.endOffset).nodeType) {
				case 3:
				  var offset  = 0; //Range.endContainer.childNodes.item(Range.endOffset).data.length;
				  var refNode = Range.endContainer.childNodes.item(Range.endOffset);
	              //alert(refNode.nodeValue);
				  Range.setEnd(refNode, offset);
				  return this._selectEnd(Range);
				  break;
				default:
				  alert('error');
			  }
			}  
		}
		catch(f)
		{
			throw(new Error('Util.Range.set_end(): Neither the W3C nor the IE way of setting the range\'s start worked. ' +
							'When the Mozilla way was tried, an error with the following message was thrown: <<' + e.message + '>>. ' +
							'When the IE way was tried, an error with the following message was thrown: <<' + f.message + '>>.'));
		}
	}
};
