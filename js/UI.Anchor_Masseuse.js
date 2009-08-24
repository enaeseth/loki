/**
 * Declares instance variables.
 *
 * @constructor
 *
 * @class A class for inserting an anchor.
 */
UI.Anchor_Masseuse = function()
{
	var self = this;
	Util.OOP.inherits(self, UI.Masseuse);
	
	function needs_massaging(node) {
		return !!node.name;
	}
	needs_massaging.tag = 'A';
	
	function needs_unmassaging(node) {
		return !!node.getAttribute('loki:anchor_id');
	}
	needs_unmassaging.tag = 'IMG';

	/**
	 * Massages the given node's children, replacing any named anchors with
	 * fake images.
	 */
	this.massage_node_descendants = function(node)
	{
		var anchors = node.getElementsByTagName(needs_massaging.tag);
		var i, anchor;

		for (i = anchors.length - 1; i >= 0; i--) {
			anchor = anchors[i];
			if (needs_massaging(anchor))
				self.massage(anchor);
		}
	};

	/**
	 * Unmassages the given node's descendants, replacing any fake anchor images 
	 * with real anchor elements.
	 */
	this.unmassage_node_descendants = function(node)
	{
		var fakes = node.getElementsByTagName(needs_unmassaging.tag);
		var i, fake;
		
		// Remove anchors that have had their placeholder images deleted.
		var anchors = node.getElementsByTagName(needs_massaging.tag);
		var anchor;
		var placeholder_map = {}, id;
		
		for (i = 0; i < fakes.length; i++) {
		    id = fakes[i].getAttribute('loki:anchor_id');
		    if (id)
		        placeholder_map[id] = fakes[i];
		}
		
		for (i = anchors.length - 1; i >= 0; i--) {
			anchor = anchors[i];
			if (needs_massaging(anchor) && !placeholder_map[anchor.id])
				anchor.parentNode.removeChild(anchor);
		}

        // Unmassage the placeholders that still exist.
		for (i = fakes.length - 1; i >= 0; i--) {
			fake = fakes[i];
			if (needs_unmassaging(fake))
				self.unmassage(fake);
		}
	};
	
	this.massage = function massage_anchor(anchor)
	{
		var doc = anchor.ownerDocument;
		var placeholder;
		var anchor_id = self.assign_fake_id(anchor);
		
		placeholder = Util.Document.create_element(doc, 'img', {
			className: 'loki__named_anchor',
			title: '#' + anchor.name,
			src: self._loki.settings.base_uri + 'images/nav/anchor.gif',
			style: {width: 12, height: 12},
			'loki:fake': true,
			'loki:anchor_id': anchor_id
		});
		
		return anchor.parentNode.insertBefore(placeholder, anchor);
	};
	
	this.update_name = function update_massaged_anchor_name(placeholder, name) {
		var anchor = self.get_anchor_for_placeholder(placeholder);
		
		placeholder.title = '#' + name;
		if (anchor) {
			if (anchor.id && anchor.id == anchor.name) {
				anchor.id = name;
				placeholder.setAttribute("loki:anchor_id", name);
			}
			anchor.name = name;
		}		
	};
	
	this.unmassage = function unmassage_anchor(placeholder) {
		var anchor = self.get_anchor_for_placeholder(placeholder);
		var actual_id;
		var name;
		var expected_id;
		
		if (!anchor) {
			// The original anchor tag was somehow removed from the document.
			anchor = placeholder.ownerDocument.createElement('A');
			anchor.name = placeholder.title.substr(1); // strips leading "#"
			placeholder.parentNode.replaceChild(anchor, placeholder);
			return anchor;
		}
		
		expected_id = placeholder.getAttribute('loki:anchor_id');
		actual_id = (placeholder.nextSibling) ?
		    placeholder.nextSibling.id :
		    null;
		self.remove_fake_id(anchor);
		if (actual_id == expected_id) {
			// Relative position has not changed. Simple.
			placeholder.parentNode.removeChild(placeholder);
			return anchor;
		}
		
		// The user has moved the anchor away from its original position.
		if (!anchor.hasChildNodes()) {
			// Bare named anchor; we can just move it to the correct spot.
			placeholder.parentNode.replaceChild(anchor, placeholder);
			return anchor;
		}
		
		// Anchor has child nodes: it must be split, leaving the original anchor
		// without a name and creating a new named anchor at the placeholder's
		// position.
		name = anchor.name;
		anchor.removeAttribute('name');
		
		anchor = placeholder.ownerDocument.createElement('A');
		anchor.name = name;
		
		placeholder.parentNode.replaceChild(anchor, placeholder);
		return anchor;
	};
	
	this.is_placeholder = function is_anchor_placeholder(elem) {
		return (Util.Node.is_tag(elem, needs_unmassaging.tag)
			&& needs_unmassaging(elem));
	};
	
	this.get_name_from_placeholder = function get_anchor_name(placeholder) {
		var anchor;
		try {
			anchor = self.get_anchor_for_placeholder(placeholder);
			if (anchor && anchor.name)
				return anchor.name;
		} catch (e) { /* ignore it */ }
		
		return placeholder.title.substr(1); // strips leading "#"
	};
	
	this.get_anchor_for_placeholder = function get_real_anchor(placeholder) {
		var id = placeholder.getAttribute('loki:anchor_id');
		
		if (!id) {
			throw new Error('The placeholder has no associated anchor ID.');
		}
		
		return placeholder.ownerDocument.getElementById(id) || null;
	};
};
