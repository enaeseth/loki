/**
 * Declares instance variables.
 *
 * @constructor
 *
 * @class A class for massaging a table.
 */
UI.UL_OL_Masseuse = function()
{
	var self = this;
	var _tagnames = ['UL', 'OL'];
	Util.OOP.inherits(self, UI.Masseuse);

	this.massage_node_descendants = function(node)
	{
		for ( var j in _tagnames )
		{
			var uls = node.getElementsByTagName(_tagnames[j]);
			for ( var i = 0; i < uls.length; i++ )
			{
				self.massage_elem(uls[i]);
			}
		}
	};
	
	this.unmassage_node_descendants = function(node)
	{
		for ( var j in _tagnames )
		{
			var uls = node.getElementsByTagName(_tagnames[j]);
			for ( var i = 0; i < uls.length; i++ )
			{
				self.unmassage_elem(uls[i]);
			}
		}
	};

	// <ul><li>out<ul><li>in</li></ul></li><li>out again</li></ul>
	//   -->
	// <ul><li>out</li><ul><li>in</li></ul><li>out again</li></ul>
	this.massage_elem = function(ul)
	{
		
		if ( ul.parentNode.nodeName == 'LI' )
		{
			var old_li = ul.parentNode;
			if ( old_li.nextSibling == null )
				old_li.parentNode.appendChild(ul);
			else
				old_li.parentNode.insertBefore(ul, old_li.nextSibling);
		}
	};

	// <ul><li>out</li><ul><li>in</li></ul><li>out again</li></ul>
	//   -->
	// <ul><li>out<ul><li>in</li></ul></li><li>out again</li></ul>
	this.unmassage_elem = function(list)
	{
		var prev_item;
		var is_li = Util.Node.curry_is_tag('LI');
		
		if (_tagnames.contains(list.parentNode.nodeName)) {
			prev_item = Util.Node.previous_matching_sibling(list, is_li);
			
			if (!prev_item) {
				prev_item = list.ownerDocument.createElement('LI');
				list.parentNode.insertBefore(prev_item, list);
			}
			prev_item.appendChild(list);
		}
	};
};
