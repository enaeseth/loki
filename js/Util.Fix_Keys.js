Util.Fix_Keys = function()
{
};

Util.Fix_Keys.fix_delete_and_backspace = function(e, win)
{
	function is_not_at_end_of_body(rng)
	{
		var start_container = rng.startContainer;
		var start_offset = rng.startOffset;
		var rng2 = Util.Range.create_range(sel);
		rng2.selectNodeContents(start_container.ownerDocument.getElementsByTagName('BODY')[0]);
		rng2.setStart(start_container, start_offset);
		var ret = rng2.toString().length > 0;// != '';
		return ret;
	};

	function is_not_at_beg_of_body(rng)
	{
		var start_container = rng.startContainer;
		var start_offset = rng.startOffset;
		var rng2 = Util.Range.create_range(sel);
		rng2.selectNodeContents(start_container.ownerDocument.getElementsByTagName('BODY')[0]);
		rng2.setEnd(start_container, start_offset);
		var ret = rng2.toString().length > 0;// != '';
		return ret;
	};

	function move_selection_to_end(node, sel)
	{
		var rightmost = Util.Node.get_rightmost_descendent(node);
		Util.Selection.select_node(sel, rightmost);
		Util.Selection.collapse(sel, false); // to end
	};

	function remove_trailing_br(node)
	{
		if ( node.lastChild != null && 
			 node.lastChild.nodeType == Util.Node.ELEMENT_NODE && 
			 node.lastChild.tagName == 'BR' )
		{
			node.removeChild(node.lastChild);
		}
	};

	function merge_blocks(one, two)
	{
		while ( two.firstChild != null )
			one.appendChild(two.firstChild);
		two.parentNode.removeChild(two);

		//one.normalize(); // this messes up cursor position
		return;
	};
	
	function is_container(node)
	{
		return (node && node.nodeType == Util.Node.ELEMENT_NODE &&
			node.getAttribute('loki:container'));
	}

	function do_merge(one, two, sel)
	{
		/*
		 * If the node is a special Loki container (e.g. for a horizontal rule),
		 * we shouldn't merge with it. Instead, delete the container (and the)
		 * page element it contains.
		 */
		function handle_containers(node)
		{
			if (is_container(node)) {
				node.parentNode.removeChild(node);
				return true;
			}
			
			return false;
		}
		
		var tags_regexp = new RegExp('BODY|HEAD|TABLE|TBODY|THEAD|TR|TH|TD', '');
		if ( one == null || one.nodeName.match(tags_regexp) ||
			 two == null || two.nodeName.match(tags_regexp) )
		{
			return;
		}
		else if (handle_containers(one) || handle_containers(two))
		{
			return;
		}
		else
		{
			remove_trailing_br(one);
			move_selection_to_end(one, sel);
			merge_blocks(one, two);
			e.preventDefault();
		}
	};
	
	function remove_container(container)
	{
		container.parentNode.removeChild(container);
		e.preventDefault();
	}
	
	function remove_if_container(node)
	{
		if (is_container(node))
			remove_container(node);
	}

	var sel = Util.Selection.get_selection(win);
	var rng = Util.Range.create_range(sel);
	var cur_block = Util.Range.get_nearest_bl_ancestor_element(rng);
	
	function get_neighbor_element(direction)
	{
		if (rng.startContainer != rng.endContainer || rng.startOffset != rng.endOffset)
			return null;
		
		if (direction == Util.Node.NEXT && rng.endContainer.childNodes[rng.endOffset])
			return rng.endContainer.childNodes[rng.endOffset];
		else if (direction == Util.Node.PREVIOUS && rng.startContainer.childNodes[rng.startOffset - 1])
			return rng.startContainer.childNodes[rng.startOffset - 1];
		else
			return null;
	}

	if ( rng.collapsed == true && !e.shiftKey )
	{
		var neighbor = null;
		
		if (e.keyCode == e.DOM_VK_DELETE) {
			if (Util.Range.is_at_end_of_block(rng, cur_block)) {
				do_merge(cur_block, Util.Node.next_element_sibling(cur_block), sel);
			} else if (Util.Range.is_at_end_of_text(rng) && is_container(rng.endContainer.nextSibling)) {
				remove_container(rng.endContainer.nextSibling);
			} else if (neighbor = get_neighbor_element(Util.Node.NEXT)) {
				remove_if_container(neighbor);
			}
		} else if (e.keyCode == e.DOM_VK_BACK_SPACE) {
			// both the following two are necessary to avoid
			// merge on B's here: <p>s<b>|a</b>h</p>
			if (Util.Range.is_at_beg_of_block(rng, cur_block) && rng.isPointInRange(rng.startContainer, 0)) {
				do_merge(Util.Node.previous_element_sibling(cur_block), cur_block, sel);
			} else if (Util.Range.is_at_beg_of_text(rng) && is_container(rng.startContainer.previousSibling)) {
				remove_container(rng.endContainer.nextSibling);
			} else if (neighbor = get_neighbor_element(Util.Node.PREVIOUS)) {
				remove_if_container(neighbor);
			}
		}
	}

	return;
	//mb('rng.startContainer, rng.startContainer.parentNode.lastChild, rng.startContainer.parentNode.firstChild, rng.startOffset, rng.startContainer.length, sel.anchorNode, sel.anchorOffset, sel.focusNode, sel.focusOffset, rng, sel', [rng.startContainer, rng.startContainer.parentNode.lastChild, rng.startContainer.parentNode.firstChild, rng.startOffset, rng.startContainer.length, sel.anchorNode, sel.anchorOffset, sel.focusNode, sel.focusOffset, rng, sel]);
};

Util.Fix_Keys.fix_enter_ie = function(e, win, loki)
{
	// Do nothing if enter not pressed
	if (!( !e.shiftKey && e.keyCode == 13 ))
		return true;

	var sel = Util.Selection.get_selection(win);
	var rng = Util.Range.create_range(sel);
	var cur_block = Util.Range.get_nearest_bl_ancestor_element(rng);

	if ( cur_block && cur_block.nodeName == 'PRE' )
	{
		var br_helper = (new UI.BR_Helper).init(loki);
		br_helper.insert_br();
		return false; // prevent default
	}

	// else
	return true; // don't prevent default
};
