/**
 * Declares instance variables.
 *
 * @constructor
 *
 * @class Represents toolbar button.
 */
UI.Paste_Button = function()
{
	Util.OOP.inherits(this, UI.Button);

	this.image = 'paste.png';
	this.title = 'Paste (Ctrl+V)';
	this.click_listener = function()
	{
		this._clipboard_helper.paste();
	};

	this.init = function(loki)
	{
		this.superclass.init.call(this, loki);
		this._clipboard_helper = (new UI.Clipboard_Helper).init(this._loki);
		return this;
	};
};
