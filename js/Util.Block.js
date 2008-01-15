/**
 * Defines the behavior of the block level elements with regard to paragraphs.
 * Replaces Util.BLE_Rules.
 */
Util.Block = {
	/**
	 * Element is a block-level element.
	 * @type integer
	 */
	BLOCK: 1,
	
	/**
	 * Element is a paragraph. It cannot contain two line breaks in succession.
	 */
	PARAGRAPH: 2,
	
	/**
	 * Element can contain paragraphs (and, in fact, all inline content should
	 * be within them).
	 * @type integer
	 */
	PARAGRAPH_CONTAINER: 4,
	
	/**
	 * Inline content nodes should be direct children of this element unless
	 * multiple paragraphs are desired, in which case it should behave as a
	 * paragraph container.
	 * @type integer
	 */
	MULTI_PARAGRAPH_CONTAINER: 8,
	
	/**
	 * Directly contains inline content; should not contain paragraphs.
	 * @type integer
	 */
	INLINE_CONTAINER: 16,
	
	/**
	 * Block-level element that may not contain anything.
	 * @type integer
	 */
	EMPTY: 32,
	
	/**
	 * Can exist as either a block-level element or an inline child of a block-
	 * level element.
	 * @type integer
	 */
	MIXED: 64,
	
	get_flags: function get_flags(element)
	{
		return (this._get_flag_map()[element.tagName] || 0);
	},
	
	is_block: function is_block(element)
	{
		return !!(this.get_flags(element) & Util.Block.BLOCK);
	},
	
	is_paragraph_container: function is_paragraph_container(element)
	{
		return !!(this.get_flags(element) & Util.Block.PARAGRAPH_CONTAINER);
	},
	
	is_multi_paragraph_container: function is_multi_paragraph_container(element)
	{
		return !!(this.get_flags(element) &
			Util.Block.MULTI_PARAGRAPH_CONTAINER);
	},
	
	is_inline_container: function is_inline_container(element)
	{
		return !!(this.get_flags(element) & Util.Block.INLINE_CONTAINER);
	},
	
	is_empty: function is_empty(element)
	{
		return !!(this.get_flags(element) & Util.Block.EMPTY);
	},
	
	is_mixed: function is_mixed(element)
	{
		return !!(this.get_flags(element) & Util.Block.MIXED);
	},
	
	/**
	 * Accepts either an HTML document or an element and enforces paragraph
	 * behavior inside that node and its children.
	 * @param {Node}     root        an HTML document or element
	 * @param {object}	 [settings]  parameters that change enforcement settings
	 * @config {object}  [overrides] if specified, allows element flags to be
	 *                               overridden
	 * @return {void}
	 */
	enforce_rules: function enforce_paragraph_rules(root, settings)
	{
		var node;
		var waiting;
		var flags;
		var child;
		var descend;
		
		if (!settings)
			settings = {};
		
		if (root.nodeType == Util.Node.DOCUMENT_NODE) {
			root = root.body;
		} else if (root == root.ownerDocument.documentElement) {
			root = root.ownerDocument.body;
		} else if (root.tagName == 'HEAD') {
			throw new Error('Cannot enforce paragraph rules on a HEAD tag.');
		}
		
		function get_flags(element)
		{
			return (settings.overrides && settings.overrides[element.tagName])
				|| Util.Block.get_flags(element);
		}
		
		function is_relevant(node)
		{
			// The regular expression below is different than that used
			// in Util.Node.is_non_whitespace_text_node; the latter does
			// not include spaces. I'm not actually sure which is correct.
			
			return (node.nodeType == Util.Node.ELEMENT_NODE || 
				node.nodeType == Util.Node.TEXT_NODE &&
				/\S/.test(node.nodeValue));
		}
		
		function is_br(node)
		{
			return node && node.tagName == 'BR';
		}
		
		function is_breaker(node)
		{
			var breaker = null;
			
			if (!is_br(node))
				return false;
				
			// Mozilla browsers (at least) like to keep a BR tag at the end
			// of all paragraphs. As a result, if the user tries to insert a
			// line break at the end of a paragraph, the HTML will end up as:
			//    <p> ...<br><br></p>
			// This is bad because we will detect this as a "breaker" and
			// possibly insert a new paragraph afterwards and delete both the
			// user's line break and Mozilla's. As a workaround, we will only
			// treat two BR's as a breaker if they do not come at the end of
			// their parent.
				
			for (var s = node.nextSibling; s; s = s.nextSibling) {
				if (!breaker) {
					if (is_br(s))
						breaker = [node, s];
					else if (is_relevant(s))
						return false;
				} else if (is_relevant(s)) {
					// The breaker is not at the end of its parent.
					return breaker;
				}
			}
			
			return false;
		}
		
		function belongs_inside_paragraph(node)
		{
			var ok_types = [Util.Node.TEXT_NODE, Util.Node.COMMENT_NODE];
			var flags;
			
			if (ok_types.contains(node.nodeType))
				return true;
			
			flags = get_flags(node);
			return !(flags & Util.Block.BLOCK) || !!(flags & Util.Block.MIXED);
		}
		
		// Factored out this enforcement because both normal paragraph
		// containers and containers that can only contain 0 or >2 paragraphs
		// both potentially use the same behavior.
		function enforce_container_child(context, node, c)
		{
			var br;
			var next;
			
			if (!context.p)
				context.p = null;
			
			if (br = is_breaker(c)) { // assignment intentional
				context.p = c.ownerDocument.createElement('P');
				next = br[1].nextSibling;
				br.each(function(b) {
					node.removeChild(b);
				});
				node.insertBefore(context.p, next);
			} else if (belongs_inside_paragraph(c)) {
				if (!context.p && is_relevant(c)) {
					context.p = c.ownerDocument.createElement('P');
					node.insertBefore(context.p, c);
				}
				
				if (context.p) {
					next = c.nextSibling;
					context.p.appendChild(c);
				}
			} else if (context.p) {
				delete context.p;
			}
			
			if (!next)
				next = c.nextSibling;
			
			return next;
		}
		
		var enforcers = {
			PARAGRAPH: function enforce_paragraph(node)
			{
				var new_p;
				var next;
				var br;
				
				function create_split_paragraph()
				{
					var next_s;
					
					new_p = node.ownerDocument.createElement('P');
					for (var c = next; c; c = next_s) {
						next_s = c.nextSibling;
						new_p.appendChild(c);
					}
					
					node.parentNode.insertBefore(new_p, node.nextSibling);
					return new_p;
				}
				
				for (var c = node.firstChild; c; c = next) {
					next = null;
					
					if (!belongs_inside_paragraph(c)) {
						if (!c.previousSibling) {
							node.parentNode.insertBefore(c, node);
						} else {
							next = c.nextSibling;
							
							if (next) {
								// Create a new paragraph, move all of the
								// children that followed the breaker into it,
								// and continue using that paragraph.
								node = create_split_paragraph();
								next = node.firstChild;
								
								// Move the item that does not belong in the
								// paragraph outside of it and place it between
								// the existing paragraph and the new split
								// paragraph.
								// (Remember, "node" now refers to the split-off
								// paragraph.)
								node.parentNode.insertBefore(c, node);
							} else {
								node.parentNode.insertBefore(c,
									node.nextSibling);
							}
						}
					} else if (br = is_breaker(c)) { // assignment intentional
						next = br[1].nextSibling;
						br.each(function(b) {
							b.parentNode.removeChild(b);
						});
						
						if (next) {
							// Create a new paragraph, move all of the
							// children that followed the breaker into it,
							// and continue using that paragraph.
							node = create_split_paragraph();
							next = node.firstChild;
						}
					}
					
					if (!next)
						next = c.nextSibling;
				}
				
				return false;
			},
			
			PARAGRAPH_CONTAINER: function enforce_p_container(node)
			{
				var context = {};
				var next;
				
				for (var c = node.firstChild; c; c = next) {
					next = enforce_container_child(context, node, c);
				}
				
				return node.hasChildNodes();
			},
			
			MULTI_PARAGRAPH_CONTAINER: function enforce_multi_p_container(node)
			{
				var multi = false;
				var context = {};
				var br;
				var next;
				
				function create_upto(stop)
				{
					var para = stop.ownerDocument.createElement('P');
					
					var c = node.firstChild;
					var worthwhile = false;
					var next;
					while (c && c != stop) {
						if (!worthwhile && is_relevant(c))
							worthwhile = true;
						
						next = c.nextSibling;
						para.appendChild(c);
						c = next;
					}
					
					if (worthwhile)
						return node.insertBefore(para, stop);
					
					return null;
				}
				
				for (var c = node.firstChild; c; c = next) {
					if (!multi) {
						next = c.nextSibling;
						
						if (!belongs_inside_paragraph(c)) {
							create_upto(c);
							multi = true;
						} else if (br = is_breaker(c)) { // assignment intent.
							multi = !!create_upto(c);
							next = br[1].nextSibling;
							br.each(function(b) {
								b.parentNode.removeChild(b);
							});
						}
					} else {
						next = enforce_container_child(context, node, c);
					}
				}
				
				return node.hasChildNodes();
			},
			
			INLINE_CONTAINER: function enforce_inline_container(node)
			{
				// When we discover paragraphs in one of these containers, we
				// actually want to replace them with double line breaks.
				
				var next;
				var next_pc;
				
				function add_br_before(n)
				{
					var br = n.ownerDocument.createElement('BR');
					n.parentNode.insertBefore(br, n);
					return br;
				}
				
				function is_basically_first(n)
				{
					var m = n;
					while (m = m.previousSibling) { // assignment intentional
						if (m.nodeType == Util.Node.ELEMENT_NODE) {
							return false;
						}
						
						if (m.nodeType == Util.Node.TEXT_NODE &&
							(/\S/.test(m.nodeValue)))
						{
							return false;
						}
					}
					
					return true;
				}
				
				for (var c = node.firstChild; c; c = next) {
					next = c.nextSibling;
					if (c.tagName == 'P') {
						if (!is_basically_first(c)) {
							add_br_before(c);
							add_br_before(c);
						}
						
						for (var pc = c.firstChild; pc; pc = next_pc) {
							next_pc = pc.nextSibling;
							node.insertBefore(pc, c);
						}
						
						node.removeChild(c);
					}
				}
				
				return false;
			},
			
			EMPTY: function enforce_empty_block_level_element(node)
			{
				while (node.firstChild)
					node.removeChild(node.firstChild);
				
				return false;
			}
		};
		
		waiting = [root];
		
		while (node = waiting.pop()) { // assignment intentional
			flags = get_flags(node);
			
			if (!flags & Util.Block.BLOCK)
				continue;
				
			descend = true; // default to descend if we don't find an enforcer
			                // for the current node
			for (var name in enforcers) {
				if (flags & Util.Block[name]) {
					descend = enforcers[name](node);
					break;
				}
			}
			
			if (!descend)
				continue;
			
			// Add the node's children (if any) to the processing stack.
			for (child = node.lastChild; child; child = child.previousSibling) {
				if (child.nodeType == Util.Node.ELEMENT_NODE)
					waiting.push(child);
			}
		}
	},
	
	_get_flag_map: function _get_block_flag_map()
	{
		var map;
		var NORMAL = 0;
		
		if (!this._flag_map) {
			// Util.Block.BLOCK is added to all of these at the final step.
			map = {
				P: Util.Block.PARAGRAPH,
				
				BODY: Util.Block.PARAGRAPH_CONTAINER,
				OBJECT: Util.Block.PARAGRAPH_CONTAINER,
				BLOCKQUOTE: Util.Block.PARAGRAPH_CONTAINER,
				FORM: Util.Block.PARAGRAPH_CONTAINER,
				FIELDSET: Util.Block.PARAGRAPH_CONTAINER,
				BUTTON: Util.Block.PARAGRAPH_CONTAINER,
				MAP: Util.Block.PARAGRAPH_CONTAINER,
				NOSCRIPT: Util.Block.PARAGRAPH_CONTAINER,
				DIV: Util.Block.PARAGRAPH_CONTAINER, // changed from multi

				H1: Util.Block.INLINE_CONTAINER,
				H2: Util.Block.INLINE_CONTAINER,
				H3: Util.Block.INLINE_CONTAINER,
				H4: Util.Block.INLINE_CONTAINER,
				H5: Util.Block.INLINE_CONTAINER,
				H6: Util.Block.INLINE_CONTAINER,
				ADDRESS: Util.Block.INLINE_CONTAINER,
				PRE: Util.Block.INLINE_CONTAINER,

				TH: Util.Block.MULTI_PARAGRAPH_CONTAINER,
				TD: Util.Block.MULTI_PARAGRAPH_CONTAINER,
				LI: Util.Block.MULTI_PARAGRAPH_CONTAINER,
				DT: Util.Block.MULTI_PARAGRAPH_CONTAINER,
				DD: Util.Block.MULTI_PARAGRAPH_CONTAINER, // changed from pc
				
				UL: NORMAL,
				OL: NORMAL,
				DL: NORMAL,
				
				TABLE: NORMAL,
				THEAD: NORMAL,
				TBODY: NORMAL,
				TFOOT: NORMAL,
				TR: NORMAL,
				NOFRAMES: NORMAL,
				
				HR: Util.Block.EMPTY,
				IFRAME: Util.Block.EMPTY,
				
				// XXX: browsers seem to treat these as inline always
				INS: Util.Block.MIXED,
				DEL: Util.Block.MIXED
			};
			
			this._flag_map = {};
			for (var name in map) {
				this._flag_map[name] = (map[name] | Util.Block.BLOCK);
			}
		}
		
		return this._flag_map;
	}
};
