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
	var is_li = Util.Node.curry_is_tag('LI');
	Util.OOP.inherits(self, UI.Masseuse);

	this.massage_node_descendants = function(node)
	{
		_tagnames.each(function massage_list_tag_descendants(tag) {
			var lists = $A(node.getElementsByTagName(tag));
			var i, length;
			for (i = 0, length = lists.length; i < length; ++i) {
				self.massage_elem(lists[i]);
			}
		});
	};
	
	this.unmassage_node_descendants = function(node)
	{
		_tagnames.each(function unmassage_list_tag_descendants(tag) {
			var lists = $A(node.getElementsByTagName(tag));
			var i, length;
			for (i = 0, length = lists.length; i < length; ++i) {
				self.unmassage_elem(lists[i]);
			}
		});
	};

	// <ul><li>out<ul><li>in</li></ul></li><li>out again</li></ul>
	//   -->
	// <ul><li>out</li><ul><li>in</li></ul><li>out again</li></ul>
	this.massage_elem = function massage_list(list)
	{
		var parent = list.parentNode;
		var next_item;
		if (parent.nodeName == 'LI') {
			next_item = Util.Node.next_matching_sibling(parent, is_li);
			parent.parentNode.insertBefore(list, next_item);
		}
	};

	// <ul><li>out</li><ul><li>in</li></ul><li>out again</li></ul>
	//   -->
	// <ul><li>out<ul><li>in</li></ul></li><li>out again</li></ul>
	this.unmassage_elem = function unmassage_list(list)
	{
		var prev_item;
		
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
