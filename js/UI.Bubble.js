/**
 * Do not call this method directly; instead use
 * UI.Bubble_Manager.create_bubble().
 * @class Bubbles.
 * @constructor
 * @author Eric Naeseth
 * @param {UI.Bubble_Manager}	manager	the bubble's manager
 * @param {UI.Loki}	loki	the Loki instance
 */
UI.Bubble = function Bubble(manager, loki)
{
	if (typeof(manager) != 'object' || typeof(loki) != 'object')
		throw new TypeError();
	
	var bubble = this;
	var doc = loki.document;
	var dh = new Util.Document(doc);
	
	this.materialize = Util.Function.unimplemented;
	
	this._create_element = function create_element(name, attributes, children)
	{
		return dh.create_element(name, attributes, children);
	}
	
	this._create_element_ns = function create_element_ns(name, attributes, children)
	{
		function make_non_selectable(attrs)
		{
			if (!attrs.style) {
				attrs.style = '-moz-user-select: none';
			} else {
				attrs.style.MozUserSelect = 'none';
			}
			
			return attrs;
		}
		
		return this._create_element(name, make_non_selectable(attributes || {}),
			children);
	}
	
	function is_function()
	{
		for (var i = 0; i < arguments.length; i++) {
			if (typeof(arguments[i]) != 'function')
				return false;
		}
		
		return true;
	}
}