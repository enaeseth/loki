/**
 * @class Provides the capability of making text bold (and not bold).
 *
 * @base UI.Capability
 * @author Eric Naeseth
 * @constructor
 * @param {UI.Loki} the Loki instance for which the capability is being provided
 */
UI.Bold_Capability = function Bold(loki)
{
	Util.OOP.inherits(this, UI.Capability, loki, 'Strong (bold) text');
	
	this.execute = function()
	{
		this.loki.exec_command('Bold');
	}
	
	this._determine_relevancy = function()
	{
		return this.loki.query_command_state('Bold');
	}
	
	this.masseuses.push(new UI.Semantic_Element_Masseuse(loki, 'B', 'STRONG'));
	this._add_button('bold.gif', 'Bold');
	this._add_keybinding('Ctrl B');
}