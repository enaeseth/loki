/**
 * Does nothing.
 *
 * @class Container for functions relating to nodes.
 */
Util.Node = function()
{
};

// Since IE doesn't expose these constants, they are reproduced here
Util.Node.ELEMENT_NODE                   = 1;
Util.Node.ATTRIBUTE_NODE                 = 2;
Util.Node.TEXT_NODE                      = 3;
Util.Node.CDATA_SECTION_NODE             = 4;
Util.Node.ENTITY_REFERENCE_NODE          = 5;
Util.Node.ENTITY_NODE                    = 6;
Util.Node.PROCESSING_INSTRUCTION_NODE    = 7;
Util.Node.COMMENT_NODE                   = 8;
Util.Node.DOCUMENT_NODE                  = 9;
Util.Node.DOCUMENT_TYPE_NODE             = 10;
Util.Node.DOCUMENT_FRAGMENT_NODE         = 11;
Util.Node.NOTATION_NODE                  = 12;

// Constants which indicate which direction to iterate through a node
// list, e.g. in get_nearest_non_whitespace_sibling_node
Util.Node.NEXT							 = 1;
Util.Node.PREVIOUS						 = 2;

/**
 * Removes child nodes of <code>node</code> for which
 * <code>boolean_test</code> returns true.
 *
 * @param	node			the node whose child nodes are in question
 * @param	boolean_test	(optional) A function which takes a node 
 *                          as its parameter, and which returns true 
 *                          if the node should be removed, or false
 *                          otherwise. If boolean_test is not given,
 *                          all child nodes will be removed.
 */
Util.Node.remove_child_nodes = function(node, boolean_test)
{
	if ( boolean_test == null )
		boolean_test = function(node) { return true; };

	while ( node.childNodes.length > 0 )
		if ( boolean_test(node.firstChild) )
			node.removeChild(node.firstChild);
};

/**
 * Returns all children of the given node who match the given test.
 * @param {Node} node the node whose children will be traversed
 * @param {Function|String|Number} match either a boolean-test matching function,
 *        or a tag name, or a node type to be matched
 * @return {Node[]} all matching child nodes
 */
Util.Node.find_children = function find_matching_node_children(node, match) {
	var i, length, node_type;
	var children = [], child;
	
	if (!node || !node.nodeType) {
		throw new TypeError('Must provide Util.Node.find_children with a ' +
			'node to traverse.');
	}
	
	if (Util.is_string(match)) {
		match = Util.Node.curry_is_tag(match);
	} else if (Util.is_number(match)) {
		node_type = match;
		match = function is_correct_node_type(node) {
			return (node && node.nodeType == node_type);
		}
	} else if (!Util.is_function(match)) {
		throw new TypeError('Must provide Util.Node.find_children with ' +
			'something to match nodes against.');
	}
	
	for (i = 0, length = node.childNodes.length; i < length; i++) {
		child = node.childNodes[i];
		if (match(child))
			children.push(child);
	}
	
	return children;
};

/**
 * <p>Recurses through the ancestor nodes of the specified node,
 * until either (a) a node is found which meets the conditions
 * specified inthe function boolean_test, or (b) the root of the
 * document tree isreached. If (a) obtains, the found node is
 * returned; if (b)obtains, null is returned.</p>
 * 
 * <li>Example usage 1: <code>var nearest_ancestor = this._get_nearest_ancestor_element(node, function(node) { return node.tagName == 'A' });</code></li>
 * <li>Example usage 2: <pre>
 *
 *          var nearest_ancestor = this._get_nearest_ancestor_element(
 *              node,
 *              function(node, extra_args) {
 *                  return node.tagName == extra_args.ref_to_this.something
 *              },
 *              { ref_to_this : this }
 *          );
 *
 * </pre></li>
 *
 * @param	node			the starting node
 * @param	boolean_test	<p>the function to use as a test. The given function should
 *                          accept the following paramaters:</p>
 *                          <li>cur_node - the node currently being tested</li>
 *                          <li>extra_args - (optional) any extra arguments this function
 *                          might need, e.g. a reference to the calling object (deprecated:
 *                          use closures instead)</li>
 * @param	extra_args		any extra arguments the boolean function might need (deprecated:
 *                          use closures instead)
 * @return					the nearest matching ancestor node, or null if none matches
 */
Util.Node.get_nearest_ancestor_node = function(node, boolean_test, extra_args)
{
	function terminal(node) {
		switch (node.nodeType) {
			case Util.Node.DOCUMENT_NODE:
			case Util.Node.DOCUMENT_FRAGMENT_NODE:
				return true;
			default:
				return false;
		}
	}
	
	for (var n = node.parentNode; n && !terminal(n); n = n.parentNode) {
		if (boolean_test(n, extra_args))
			return n;
	}
	
	return null;
};

/**
 * Returns true if there exists an ancestor of the given node 
 * that satisfies the given boolean_test. Paramaters same as for
 * get_nearest_ancestor_node.
 */
Util.Node.has_ancestor_node =
	function node_has_matching_ancestor(node, boolean_test, extra_args)
{
	return Util.Node.get_nearest_ancestor_node(node, boolean_test, extra_args) != null;
};

/**
 * Finds the node that is equal to or an ancestor of the given node that
 * matches the provided test.
 * @param	{Node}	node	the node to examine
 * @param	{function}	test	the test function that should return true when
 *								passed a suitable node
 * @return {Node}	the matching node if one was found, otherwise null
 */
Util.Node.find_match_in_ancestry =
	function find_matching_node_in_ancestry(node, test)
{
	function terminal(node) {
		switch (node.nodeType) {
			case Util.Node.DOCUMENT_NODE:
			case Util.Node.DOCUMENT_FRAGMENT_NODE:
				return true;
			default:
				return false;
		}
	}
	
	for (var n = node; n && !terminal(n); n = n.parentNode) {
		if (test(n))
			return n;
	}
	
	return null;
}

/**
 * Gets the nearest ancestor of the node that is currently being displayed as
 * a block.
 * @param {Node}	node		the node to examine
 * @param {Window}	node_window	the node's window
 * @type Element
 * @see Util.Node.get_nearest_bl_ancestor_element()
 * @see Util.Element.is_block_level()
 */
Util.Node.get_enclosing_block =
	function get_enclosing_block_of_node(node, node_window)
{
	// Sanity checks.
	if (!node || !node.nodeType) {
		throw new TypeError('Must provide a node to ' + 
			'Util.Node.get_enclosing_block.');
	} else if (!Util.is_valid_object(node_window)) {
		throw new TypeError('Must provide the node\'s window object to ' + 
			'Util.Node.get_enclosing_block.');
	} else if (node_window.document != node.ownerDocument) {
		throw new Error('The window provided to Util.Node.get_enclosing_block' +
			' is not actually the window in which the provided node resides.');
	}
	
	function is_block(node) {
		return (node.nodeType == Util.Node.ELEMENT_NODE &&
			Util.Element.is_block_level(window, node));
	}
	
	return Util.Node.get_nearest_ancestor_node(node, is_block);
}

/**
 * Gets the nearest ancester of node which is a block-level
 * element. (Uses get_nearest_ancestor_node.)
 *
 * @param {Node}	node		the starting node
 * @type Element
 * @see Util.Node.get_enclosing_block()
 */
Util.Node.get_nearest_bl_ancestor_element = function(node)
{
	return Util.Node.get_nearest_ancestor_node(node, Util.Node.is_block_level_element);
};

/**
 * Gets the given node's nearest ancestor which is an element whose
 * tagname matches the one given.
 *
 * @param	node			the starting node
 * @param	tag_name		the desired tag name	
 * @return					the matching ancestor, if any
 */
Util.Node.get_nearest_ancestor_element_by_tag_name = function(node, tag_name)
{
	// Yes, I could use curry_is_tag, but I'd rather only have one closure.
	function matches_tag_name(node)
	{
		return Util.Node.is_tag(node, tag_name);
	}
	
	return Util.Node.get_nearest_ancestor_node(node, matches_tag_name);
};

/**
 * Iterates previouss through the given node's children, and returns
 * the first node which matches boolean_test.
 *
 * @param	node			the starting node
 * @param	boolean_test	the function to use as a test. The given function should
 *                          accept one paramater:
 *                          <li>cur_node - the node currently being tested</li>
 * @return					the last matching child, or null if none matches
 */
Util.Node.get_last_child_node = function(node, boolean_test)
{
	for (var n = node.lastChild; n; n = n.previousSibling) {
		if (boolean_test(n))
			return n;
	}
	
	return null;
};

Util.Node.has_child_node = function(node, boolean_test)
{
	return Util.Node.get_last_child_node(node, boolean_test) != null;
};

/**
 * Returns true if the given node is an element node.
 * @param {Node} node node whose type will be tested
 * @returns {Boolean} true if "node" is an element node, false if otherwise
 */
Util.Node.is_element = function node_is_element(node) {
	return (node && node.nodeType == Util.Node.ELEMENT_NODE);
}

/**
 * Returns true if the given node is a text node.
 * @param {Node} node node whose type will be tested
 * @returns {Boolean} true if "node" is a text node, false if otherwise
 */
Util.Node.is_text = function node_is_text(node) {
	return (node && node.nodeType == Util.Node.TEXT_NODE);
}

/**
 * Returns true if the given node is a document node.
 * @param {Node} node node whose type will be tested
 * @returns {Boolean} true if "node" is a document node, false if otherwise
 */
Util.Node.is_document = function node_is_document(node) {
	return (node && node.nodeType == Util.Node.DOCUMENT_NODE);
}

/**
 * Returns true if the node is an element node and its node name matches the
 * tag parameter, false otherwise.
 *
 * @param	node	node on which the test will be run
 * @param	tag		tag name to look for
 * @type boolean
 */
Util.Node.is_tag = function(node, tag)
{
	return (node.nodeType == Util.Node.ELEMENT_NODE
		&& node.nodeName == tag.toUpperCase());
};

/**
 * Creates a function that calls is_tag using the given tag.
 */
Util.Node.curry_is_tag = function(tag)
{
	return function(node) { return Util.Node.is_tag(node, tag); };
}

/**
 * Finds the offset of the given node within its parent.
 * @param {Node}  node  the node whose offset is desired
 * @return {Number}     the node's offset
 * @throws {Error} if the node is orphaned (i.e. it has no parent)
 */
Util.Node.get_offset = function get_node_offset_within_parent(node)
{
	var parent = node.parentNode;
	
	if (!parent) {
		throw new Error('Node ' + Util.Node.get_debug_string(node) + ' has ' +
			' no parent.');
	}
	
	for (var i = 0; i < parent.childNodes.length; i++) {
		if (parent.childNodes[i] == node)
			return i;
	}
	
	throw new Error();
}

/**
 * Attempts to find the window that corresponds with a given node.
 * @param {Node}  node   the node whose window is desired
 * @return {Window}   the window object if it could be found, otherwise null.
 */
Util.Node.get_window = function find_window_of_node(node)
{
	var doc = (node.nodeType == Util.Node.DOCUMENT_NODE)
		? node
		: node.ownerDocument;
	var seen;
	var stack;
	var candidate;
	
	if (!doc)
		return null;
	
	if (doc._loki__document_window) {
		return doc._loki__document_window;
	}
	
	function accept(w)
	{
		if (!w)
			return false;
		
		if (!seen.contains(w)) {
			seen.push(w);
			return true;
		}
		
		return false;
	}
	
	function get_elements(tag)
	{
		return candidate.document.getElementsByTagName(tag);
	}
	
	seen = [];
	stack = [window];
	
	accept(window);
	
	while (candidate = stack.pop()) { // assignment intentional
		try {
			if (candidate.document == doc) {
				// found it!
				doc._loki__document_window = candidate;
				return candidate;
			}

			if (candidate.parent != candidate && accept(candidate)) {
				stack.push(candidate);
			}


			['FRAME', 'IFRAME'].map(get_elements).each(function (frames) {
				for (var i = 0; i < frames.length; i++) {
					if (accept(frames[i].contentWindow))
						stack.push(frames[i].contentWindow);
				}
			});
		} catch (e) {
			// Sometimes Mozilla gives security errors when trying to access
			// the documents.
		}
	}
	
	// guess it couldn't be found
	return null;
}

Util.Node.non_whitespace_regexp = /[^\f\n\r\t\v]/gi;
Util.Node.is_non_whitespace_text_node = function(node)
{
	// [^\f\n\r\t\v] should be the same as \S, but at least on
	// Gecko/20040206 Firefox/0.8 for Windows, \S doesn't always match
	// what the explicitly specified character class matches--and what
	// \S should match.

	return ( node.nodeType != Util.Node.TEXT_NODE ||
			 Util.Node.non_whitespace_regexp.test(node.nodeValue) );
};

/**
 * Gets the last child node which is other than mere whitespace. (Uses
 * get_last_child_node.)
 *
 * @param	node	the node to look for
 * @return			the last non-whitespace child node
 */
Util.Node.get_last_non_whitespace_child_node = function(node)
{
	node.ownerDocument.normalizeDocument();
	return Util.Node.get_last_child_node(node, Util.Node.is_non_whitespace_text_node);
};

/**
 * Returns the given node's nearest sibling which is not a text node
 * that contains only whitespace.
 *
 * @param	node					the node to look for
 * @param	next_or_previous		indicates which direction to look,
 *                                  either Util.Node.NEXT or
 *                                  Util.Node.PREVIOUS
 */
Util.Node.get_nearest_non_whitespace_sibling_node = function(node, next_or_previous)
{
	do
	{
		if ( next_or_previous == Util.Node.NEXT )
			node = node.nextSibling;
		else if ( next_or_previous == Util.Node.PREVIOUS )
			node = node.previousSibling;
		else
			throw("Util.get_nearest_non_whitespace_sibling_node: Argument next_or_previous must have Util.Node.NEXT or Util.Node.PREVIOUS as its value.");
	}
	while (!( node == null ||
			  node.nodeType != Util.Node.TEXT_NODE ||
			  Util.Node.non_whitespace_regexp.test(node.nodeValue)
		   ))

	return node;
};

/**
 * Determines whether the given node is a block-level element. Tries to use the
 * element's computed style, and if that fails, falls back on what the default
 * is for the element's tag.
 *
 * @see Util.Element.is_block_level
 * @see Util.Block.is_block
 * @param	{Node}	node	the node in question
 * @return	{Boolean}	true if the node is a block-level element
 */
Util.Node.is_block_level_element = function(node)
{
	var w;
	
	if (node.nodeType != Util.Node.ELEMENT_NODE)
		return false;
	
	try {
		w = Util.Node.get_window(node);
		return Util.Element.is_block_level(w, node);
	} catch (e) {
		return Util.Block.is_block(node);
	}
};

Util.Node.is_block = Util.Node.is_block_level_element;

/**
 * Determines whether the given node, in addition to being a block-level
 * element, is also one that it we can nest inside any arbitrary block.
 * It is generally not permitted to surround the elements in the list below 
 * with most other blocks. E.g., we don't want to surround a TD with BLOCKQUOTE.
 */
Util.Node.is_nestable_block_level_element = function(node)
{
	return Util.Node.is_block_level_element(node)
		&& !(/^(BODY|TBODY|THEAD|TR|TH|TD)$/i).test(node.tagName);
};

/**
 * Returns the rightmost descendent of the given node.
 */
Util.Node.get_rightmost_descendent = function(node)
{
	var rightmost = node;
	while ( rightmost.lastChild != null )
		rightmost = rightmost.lastChild;
	return rightmost;
};

Util.Node.get_leftmost_descendent = function(node)
{
	var leftmost = node;
	while ( leftmost.firstChild != null )
		leftmost = leftmost.firstChild;
	return leftmost;
};

Util.Node.is_rightmost_descendent = function(node, ref)
{
	return Util.Node.get_rightmost_descendent(ref) == node;
};

Util.Node.is_leftmost_descendent = function(node, ref)
{
	return Util.Node.get_leftmost_descendent(ref) == node;
};

/**
 * Inserts the given new node after the given reference node.
 * (Similar to W3C Node.insertBefore.)
 */
Util.Node.insert_after = function(new_node, ref_node)
{
	ref_node.parentNode.insertBefore(new_node, ref_node.nextSibling);
};

/**
 * Surrounds the given node with an element of the given tagname, 
 * and returns the new surrounding elem.
 */
Util.Node.surround_with_tag = function(node, tagname)
{
	var new_elem = node.ownerDocument.createElement(tagname);
	Util.Node.surround_with_node(node, new_elem);
	return new_elem;
};

/**
 * Surrounds the given inner node with the given outer node.
 */
Util.Node.surround_with_node = function(inner_node, outer_node)
{
	inner_node.parentNode.insertBefore(outer_node, inner_node);
	outer_node.appendChild(inner_node);
};

/**
 * Replaces given node with its children, e.g.
 * lkj <em>asdf</em> jkl becomes, after replace_with_children(em_node),
 * lkj asdf jkl
 */
Util.Node.replace_with_children = function(node)
{
	var parent = node.parentNode;

	if (!parent)
		return; // node was removed already
	
	while (node.firstChild) {
		parent.insertBefore(node.removeChild(node.firstChild), node);
	}
	
	parent.removeChild(node);
};

/**
 * Moves all children and attributes from old_node to new_node. 
 *
 * If old_node is within a DOM tree (i.e., has a non-null parentNode),
 * it is replaced in the tree with new_node. (Since new_node now has
 * all of old_node's former children, the tree is otherwise exactly as 
 * it was before.)
 *
 * If old_node is not within a DOM tree (i.e., has a null parentNode),
 * old_node's children and attrs are moved to new_node, but new_node
 * is not added to any DOM tree (nor is any error thrown).
 * 
 * E.g.,
 *   asdf <i>inside</i> jkl;    
 * becomes, after swap_node(em_elem, i_elem),
 *   asdf <em>inside</em> jkl;
 */
Util.Node.swap_node = function(new_node, old_node)
{
	for ( var i = 0; i < old_node.attributes.length; i++ )
	{
		var attr = old_node.attributes.item(i);
		new_node.setAttributeNode(attr.cloneNode(true));
	}
	while ( old_node.firstChild != null )
	{
		new_node.appendChild( old_node.removeChild(old_node.firstChild) );
	}
	if ( old_node.parentNode != null )
		old_node.parentNode.replaceChild(new_node, old_node);
};

/**
 * Returns the previous sibling of the node that matches the given test,
 * or null if there is none.
 */
Util.Node.previous_matching_sibling = function(node, boolean_test)
{	
	for (var sib = node.previousSibling; sib; sib = sib.previousSibling) {
		if (boolean_test(sib))
			return sib;
	}
	
	return null;
};

/**
 * Returns the next sibling of the node that matches the given test,
 * or null if there is none.
 */
Util.Node.next_matching_sibling = function(node, boolean_test)
{	
	for (var sib = node.nextSibling; sib; sib = sib.nextSibling) {
		if (boolean_test(sib))
			return sib;
	}
	
	return null;
};

/**
 * Returns the previous sibling of the node that is an element node,
 * or null if there is none.
 */
Util.Node.previous_element_sibling = function(node)
{
	return Util.Node.previous_matching_sibling(node, function(n) {
		return n.nodeType == Util.Node.ELEMENT_NODE;
	})
};

/**
 * Returns the next sibling of the node that is an element node,
 * or null if there is none.
 */
Util.Node.next_element_sibling = function(node)
{
	return Util.Node.next_matching_sibling(node, function(n) {
		return n.nodeType == Util.Node.ELEMENT_NODE;
	})
};

/**
 * @return {String} a string that describes the node
 */
Util.Node.get_debug_string = function get_node_debug_string(node)
{
	var str;
	
	if (!Util.is_number(node.nodeType)) {
		return '(Non-node ' + node + ')';
	}
	
	switch (node.nodeType) {
		case Util.Node.ELEMENT_NODE:
			str = '<' + node.nodeName.toLowerCase();
			
			Util.Object.enumerate(Util.Element.get_attributes(node),
				function append_attribute(name, value) {
					str += ' ' + name + '="' + value + '"';
				}
			);
			
			str += '>';
			break;
		case Util.Node.TEXT_NODE:
			str = '"' + Util.trim(node.nodeValue.toString()) + '"';
			break;
		case Util.Node.DOCUMENT_NODE:
			str = '[Document';
			if (node.location)
				str += ' ' + node.location;
			str += ']';
			break;
		default:
			str = '[' + node.nodeName + ']';
	}
	
	return str;
}

// end file Util.Node.js

