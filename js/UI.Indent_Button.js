/**
 * Declares instance variables.
 *
 * @constructor
 *
 * @class Represents "indent" toolbar button.
 */
UI.Indent_Button = function()
{
	var self = this;
	Util.OOP.inherits(self, UI.Button);

	this.image = 'indent.png';
	this.title = 'Indent list item(s)';
	this.helper = null;
	
	this.click_listener = function indent_button_onclick() 
	{
		// Only indent if we're inside a UL or OL 
		// (Do this to avoid misuse of BLOCKQUOTEs.)
		
		if (!this._helper)
			this.helper = (new UI.List_Helper).init(this._loki);
		
		var list = this.helper.get_ancestor_list();
		var li = this.helper.get_list_item();
		
		if (list) {
			// Don't indent first element in a list, if it is not in a nested list.
			// This is because in such a situation, Gecko "indents" by surrounding
			// the UL/OL with a BLOCKQUOTE tag. I.e. <ul><li>as|df</li></ul>
			// --> <blockquote><ul><li>as|df</li></ul></blockquote>
			
			if (li.previousSibling || this.helper.get_more_distant_list(list)) {
				this._loki.exec_command('Indent');
				this._loki.document.normalize();
			} else {
				UI.Messenger.display_once('indent_first_li',
					"The first item in a list cannot be indented.");
			}
		} else {
			this.helper.nag_about_indent_use();
		}
	};
};
