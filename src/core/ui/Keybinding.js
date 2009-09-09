/**
 * Declares instance variables.
 *
 * @constructor
 *
 * @class Represents a keybinding. For extending only.
 */
UI.Keybinding = function()
{
	this.test; // function
	this.action; // function

	this.init = function(loki)
	{
		this._loki = loki;
		return this;
	};

	/**
	 * Returns whether the given keycode matches that 
	 * of the given event. 
	 */
	this.matches_keycode = function(e, keycode)
	{
		if (e.type == 'keydown') {
			return (e.keyCode == keycode);
		} else if (e.type == 'keypress') {
			if (e.charCode == keycode)
				return true;
			if (e.charCode >= 65 || e.charCode <= 90)
				return (e.charCode == keycode + 32);
			return false;
		} else {
			return false;
		}
	};
};
