/**
 * Helps with list functionality.
 * @author Eric Naeseth
 */
UI.List_Helper = function ListHelper()
{
	Util.OOP.inherits(this, UI.Helper);
	
	function run_with_proper_selection(fn) {
    	var sel = Util.Selection.get_selection(this._loki.window);
		var range = Util.Range.create_range(sel);
		var get_ancestor = Util.Range.get_nearest_ancestor_element_by_tag_name;
		var bookmark;
		
		function select_item() {
            var item = get_ancestor(range, 'LI');
            if (!item) {
                // hopefully this will never happen, but let's be defensive
                throw new Error('Cannot perform a list indent when selection ' +
                    'is not within a list item.');
            }
            
            Util.Range.select_node_contents(range, item);
            range.collapse(true /* (to start) */);
    	}
		
		// We want to put the selection directly on the list item before running
		// the command, because running indent commands when we're inside a
		// paragraph or a table has a different meaning.
		bookmark = Util.Selection.bookmark(this._loki.window, sel, range);
		select_item(sel, range);
		
		fn.call(this);
		
		// Restore the original selection
		Util.Scheduler.defer(function restore_selection() {
		    bookmark.restore();
		});
	}
	
	this.indent = function indent_list()
	{
	    run_with_proper_selection.call(this, function() {
	        this._loki.exec_command('Indent');
	        this._loki.document.normalize();
	    });
	};
	
	this.outdent = function outdent_list()
	{
	    run_with_proper_selection.call(this, function() {
	        this._loki.exec_command('Outdent');
	    });
	};
	
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