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

	this.image = 'cleanup.png';
	this.title = 'Clean up HTML';
	this.click_listener = function()
	{
		UI.Clean.clean(this._loki.body, this._loki.settings, true);
	};
};
