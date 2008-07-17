/**
 * Declares instance variables.
 *
 * @constructor
 *
 * @class Changes the alignment of block-level elements.
 */
UI.Align_Helper = function()
{
	var self = this;
	Util.OOP.inherits(self, UI.Helper);

	this.init = function(loki)
	{
		this._loki = loki;
		this._paragraph_helper = (new UI.Paragraph_Helper()).init(this._loki);
		return this;
	};
	
	function get_alignable_elements()
	{
		var elements;
		var selection;
		var range;
		var bounds;
		
		function find_blocks(scan_ancestors) {
			return Util.Range.find_nodes(bounds, Util.Node.is_block,
				scan_ancestors);
		}
		
		// Ensure that there's a paragraph; that we're not directly within the
		// document's body.
		self._paragraph_helper.possibly_paragraphify();
		
		selection = Util.Selection.get_selection(self._loki.window);
		range = Util.Range.create_range(selection);
		bounds = Util.Range.get_boundary_blocks(range, true);
		console.debug(bounds);
		
		// First, see if there are any block-level elements within the selected
		// range.
		elements = find_blocks(false);
		if (elements.length)
			return elements;
		
		// Find any that are ancestors of the range.
		return find_blocks(true);
	};

	this.is_alignable = function selection_is_alignable()
	{
		try {
			return !!get_alignable_elements().length;
		} catch (e) {
			return false;
		}
	};
	
	this.align = function align_selection(position)
	{
		var elements = get_alignable_elements();
		
		position = position.toLowerCase();
		if (!['left', 'center', 'right', 'justify'].contains(position)) {
			throw new Error('Invalid position {' + position + '}.');
		}
		
		if (!elements.length)
			return;
		elements.each(function align_element(el) {
			var w = (self._loki.window.document == el.ownerDocument)
				? self._loki.window
				: Util.Node.get_window(el);
			
			var align = Util.Element.get_computed_style(w, el).textAlign;
			if (align.toLowerCase() == position)
				return;
			
			if (position == 'left') {
				// Try simply removing the inline style, since "left" is
				// probably the default. Check it momentarily, and if the
				// alignment isn't really left, set it explicitly.
				el.style.textAlign = '';
				if (el.style.cssText.length == 0)
					el.removeAttribute('style');
				(function verify_element_alignment() {
					var a = Util.Element.get_computed_style(w, el).textAlign;
					a = a.toLowerCase();
					// For Mozilla, the default alignment is actually "start",
					// which is equivalent to left for our purposes.
					if (a != position && !(position == 'left' && a == 'start'))
						el.style.textAlign = position;
				}).defer();
			} else {
				el.style.textAlign = position;
			}
		});
	};

	this.align_left = function align_selection_to_left()
	{
		this.align('left');
	};

	this.align_center = function align_selection_to_center()
	{
		this.align('center');
	};

	this.align_right = function align_selection_to_right()
	{
		this.align('right');
	};
};
