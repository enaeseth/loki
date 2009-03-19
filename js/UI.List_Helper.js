/**
 * Helps with list functionality.
 * @author Eric Naeseth
 */
UI.List_Helper = function ListHelper()
{
	Util.OOP.inherits(this, UI.Helper);
	
	this.get_ancestor_list = function get_ancestor_list_of_selected_range()
	{
		var sel = Util.Selection.get_selection(this._loki.window);
		var range = Util.Range.create_range(sel);
		
		return Util.Range.get_nearest_ancestor_element_by_tag_name(range, 'UL')
			|| Util.Range.get_nearest_ancestor_element_by_tag_name(range, 'OL');
	};
	
	this.get_list_item = function get_list_item_for_selected_range()
	{
		var sel = Util.Selection.get_selection(this._loki.window);
		var range = Util.Range.create_range(sel);
		
		return Util.Range.get_nearest_ancestor_element_by_tag_name(range, 'LI');
	};
	
	this.get_more_distant_list = function get_list_ancestor_of_list(list)
	{
		return Util.Node.get_nearest_ancestor_element_by_tag_name(list, 'UL')
			|| Util.Node.get_nearest_ancestor_element_by_tag_name(list, 'OL');
	};
	
	this.nag_about_indent_use = function nag_about_indent_use()
	{
		UI.Messenger.display_once('indent_use_nag',
			'The indent and unindent buttons can only be used to indent and' +
			' outdent list items; in particular, it cannot be used to indent' +
			' paragraphs.');
	};
}