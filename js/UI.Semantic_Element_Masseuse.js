/**
 * @class A masseuse that swaps instances of "non-semantic" elements in the
 * document being edited in Loki for an instance of a corresponding semantic
 * element (e.g. <b> and <strong>).
 * @extends UI.Masseuse
 * @constructor
 * @param {UI.Loki} the Loki instance to massage for
 * @param {string} the name of the non-semantic element to replace
 * @param {string} the name of the desired semantic element
 * @param {object} styles that would be applied to an equivalent unsemantic span
 */
UI.Semantic_Element_Masseuse = function(loki, unsemantic_name, semantic_name,
	styles)
{
	Util.OOP.inherits(this, UI.Masseuse, loki);
	
	function replace_node(element, make_fake)
	{
		var new_tag = (make_fake) ? unsemantic_name : semantic_name;
		var replacement = element.ownerDocument.createElement(new_tag);
		
		if (!element.hasAttributes || element.hasAttributes()) {
			for (var name in element.attributes) {
				if (!make_fake && name == 'loki:fake')
					continue;
				
				var attr = element.attributes[name];
				if (!attr.specified)
					continue;
					
				if (typeof(attr.nodeValue) == 'string' && !attr.nodeValue)
					continue;
					
				replacement.setAttribute(attr.nodeName, attr.nodeValue);
			}
		}
		
		if (make_fake)
			replacement.setAttribute('loki:fake', 'true');
		else
			replacement.removeAttribute('loki:fake'); // not redundant
		
		while (element.firstChild != null) {
			replacement.appendChild(element.removeChild(element.firstChild));
		}
		
		return replacement;
	}
	
	function replace_descendants(node, make_fake)
	{
		var old_tag = (make_fake) ? semantic_name : unsemantic_name;
		var elements = node.getElementsByTagName(old_tag);
		
		for (var i = elements.length - 1; i >= 0; i--) {
			var e = elements[i];
			e.parentNode.replaceChild(replace_node(e, make_fake), e);
		}
	}
	
	this.massage_node_descendants = function(node)
	{
		replace_descendants(node, true);
	}
	
	this.unmassage_node_descendants = function(node)
	{
		replace_descendants(node, false);
		
		var elements = node.getElementsByTagName('SPAN');
		for (var i = elements.length - 1; i >= 0; i--) {
			var e = elements[i];
			var c = e.cloneNode(true);
			var matches = true;
			
			for (var name in styles) {
				if (e.style[name] != styles[name]) {
					matches = false;
					break;
				} else {
					c.style[name] = '';
				}
			}
			
			if (!matches)
				continue;
			
			if (typeof(c.style.cssText) == 'string' && !c.style.cssText)
				e.parentNode.replaceChild(replace_node(c, false), e);
		}
	}
}