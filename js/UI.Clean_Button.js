/**
 * Declares instance variables.
 *
 * @constructor
 *
 * @class Represents toolbar button.
 */
UI.Clean_Button = function()
{
	Util.OOP.inherits(this, UI.Button);

	this.image = 'force_cleanup.gif';
	this.title = 'Cleanup HTML';
	this.click_listener = function()
	{
		UI.Clean.clean(this._loki.body, this._loki.settings);
	};
};
