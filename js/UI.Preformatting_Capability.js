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
	
	loki.add_event_listener('special_key', function (ev) {
		if (ev.code == ev.ENTER) {
			var b = UI.Special_Key_Handler.get_boundaries(loki);
			
			function is_pre(node)
			{
				return node.tagName == 'PRE';
			}
			
			if (Util.Node.find_match_in_ancestry(b.start.block, is_pre)) {
				// The browser will do the right thing in this case without
				// our intervention.
				ev.allow_browser_handling();
			}
		}
	}, this);
	
	this.execute = function execute_preformatting()
	{
		loki.toggle_block('pre');
	}
	
	this._determine_illumination = function determine_pre_illumination()
	{
		return 'pre' == loki.query_command_value('FormatBlock');
	}
	
	this._add_button('pre.gif', 'Pre-formatted');
	this._add_keybinding('Ctrl Shift P');
}