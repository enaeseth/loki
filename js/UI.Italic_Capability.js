/**
 * @class Provides the capability of making text italicized
 * (and not italicized).
 *
 * @extends UI.Capability
 * @author Eric Naeseth
 * @constructor
 * @param {UI.Loki} the Loki instance for which the capability is being provided
 */
UI.Italic_Capability = function Italic(loki)
{
	Util.OOP.inherits(this, UI.Capability, loki, 'Emphasized (italic) text');
	
	this.execute = function execute_italic()
	{
		this.loki.exec_command('Italic');
	}
	
	this._determine_illumination = function determine_italic_illumination()
	{
		return this.loki.query_command_state('Italic');
	}
	
	this.masseuses.push(new UI.Semantic_Element_Masseuse(loki, 'I', 'EM',
		{fontStyle: 'italic'}));
	this._add_button('italic.gif', 'Emphasis');
	this._add_keybinding('Ctrl I');
}