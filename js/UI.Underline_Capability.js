/**
 * @class Provides the capability of making text underlined
 * (and not underlined).
 *
 * @extends UI.Capability
 * @author Eric Naeseth
 * @constructor
 * @param {UI.Loki} the Loki instance for which the capability is being provided
 */
UI.Underline_Capability = function Underline(loki)
{
	Util.OOP.inherits(this, UI.Capability, loki, 'Underlined text');
	
	this.execute = function execute_underline()
	{
		this.loki.exec_command('Underline');
	}
	
	this._determine_illumination = function determine_underline_illumination()
	{
		return this.loki.query_command_state('Underline');
	}
	
	this._add_button('underline.gif', 'Underline');
	this._add_keybinding('Ctrl U');
}