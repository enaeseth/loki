/**
 * @class Editing of preformatted text (i.e., <PRE> tags).
 * @base UI.Capability
 * @author Eric Naeseth
 * @constructor
 * @param {UI.Loki}
 */
UI.Preformatting_Capability = function Preformatted(loki)
{
	Util.OOP.inherits(this, UI.Capability, loki, 'Pre-formatted text');
	
	this.execute = function execute_preformatting()
	{
		loki.toggle_block('pre');
	}
	
	this._determine_illumination = function determine_pre_illumination()
	{
		return 'pre' == loki.query_command_value('FormatBlock');
	}
	
	this._add_button('pre.gif', 'Pre-formatted');
}