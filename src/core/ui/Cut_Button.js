/**
 * Declares instance variables.
 *
 * @constructor
 *
 * @class Represents toolbar button.
 */
UI.Cut_Button = function()
{
	Util.OOP.inherits(this, UI.Button);

	this.image = 'cut.png';
	this.title = 'Cut (Ctrl+X)';
	this.click_listener = function()
	{
		this._clipboard_helper.cut();
	};

	this.init = function(loki)
	{
		this.superclass.init.call(this, loki);
		this._clipboard_helper = (new UI.Clipboard_Helper).init(this._loki);
		return this;
	};
};
