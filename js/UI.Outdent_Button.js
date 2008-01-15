/**
 * Declares instance variables.
 *
 * @constructor
 *
 * @class Represents "outdent" toolbar button.
 */
UI.Outdent_Button = function()
{
	var self = this;
	Util.OOP.inherits(self, UI.Button);

	this.image = 'outdent.gif';
	this.title = 'Unindent list item(s)';
	this.helper = null;
	
	this.click_listener = function outdent_button_onclick() 
	{
		// Only outdent if we're inside a UL or OL 
		// (Do this to avoid misuse of BLOCKQUOTEs.)
		
		if (!this._helper)
			this.helper = (new UI.List_Helper).init(this._loki);
			
		if (this.helper.get_ancestor_list()) {
			this._loki.exec_command('Outdent');
		} else {
			this.helper.nag_about_indent_use();
		}
	};
	
};
