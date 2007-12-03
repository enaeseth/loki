/**
 * @class Allows the creation and editing of anchors.
 * @base UI.Capability
 * @author Eric Naeseth
 * @constructor
 * @param {UI.Loki}
 */
UI.Anchor_Capability = function Anchors(loki)
{
	Util.OOP.inherits(this, UI.Capability, loki, 'Anchors');
	
	var dh = new Util.Document(loki.document);
	
	this.get_anchors = function get_anchors()
	{
		var scans = {
			'A': function is_named_anchor(a)
			{
				return !!a.name;
			},
			
			'DIV': function is_placeholder(div)
			{
				return this.is_placeholder(div);
			}
		};
		
		var anchors = [];
		
		for (var name in scans) {
			var elements = loki.document.getElementsByTagName(name);
			anchors.append(Util.Array.find_all(elements, scans[name], this));
		}
		
		return anchors;
	}
	
	this.create_placeholder = function create_placeholder(anchor)
	{
		return dh.create_element('div', {
			className: 'loki__anchor_placeholder',
			'loki:fake': 'true',
			'loki:anchor_name': anchor.name
		});
	}
	
	this.is_placeholder = function is_placeholder(node)
	{
		return (node && node.tagName.toLowerCase() == 'div' &&
			node.getAttribute('loki:fake') && 
			node.getAttribute('loki:anchor_name'));
	}
	
	this.create_anchor = function create_anchor(placeholder)
	{
		if (placeholder.tagName == 'A') {
			return placeholder.cloneNode(true);
		} else if (this.is_placeholder(placeholder)) {
			return dh.create_element('a', {
				name: placeholder.getAttribute('loki:anchor_name')
			});
		} else {
			return null;
		}
	}
	
	function AnchorMasseuse(parent)
	{
		Util.OOP.inherits(self, UI.Masseuse, loki);
		
		function replace(old_node, new_node)
		{
			old_node.parentNode.replaceChild(new_node, old_node);
		}
		
		this.massage_node_descendants = function massage_anchors(node)
		{
			var anchors = node.getElementsByTagName('A');
			
			for (var i = anchors.length - 1; i >= 0; i--) {
				var anchor = anchors[i];
				if (anchor.name) {
					replace(anchor, parent.create_placeholder(anchor));
				}
			}
		}
		
		this.unmassage_node_descendants = function unmassage_anchors(node)
		{
			var faux = node.getElementsByTagName('DIV');
			
			for (var i = faux.length - 1; i >= 0; i--) {
				var div = faux[i];
				if (parent.is_placeholder(div)) {
					replace(div, parent.create_anchor(div));
				}
			}
		}
	}
	
	this.masseuses.push(new AnchorMasseuse(this));
}