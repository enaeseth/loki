/**
 * Declares instance variables.
 *
 * @constructor
 *
 * @class Represents toolbar button.
 */
UI.Copy_Button = function()
{
	Util.OOP.inherits(this, UI.Button);

	this.image = 'copy.png';
	this.title = 'Copy (Ctrl+C)';
	this.click_listener = function()
	{
		this._clipboard_helper.copy();
	};

	this.init = function(loki)
	{
		this.superclass.init.call(this, loki);
		this._clipboard_helper = (new UI.Clipboard_Helper).init(this._loki);
		return this;
	};
};
