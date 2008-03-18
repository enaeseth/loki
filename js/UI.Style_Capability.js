/**
 * @class Changes element styles.
 *
 * @base UI.Capability
 * @author Eric Naeseth
 * @constructor
 * @param {UI.Loki}	loki	the Loki instance for which the capability is being
 * 							provided
 */
UI.Style_Capability = function Styles(loki)
{
	Util.OOP.inherits(this, UI.Capability, loki, 'Element styles');
	
	var styles = UI.Styles.get(loki.settings.styles);
	var selected_range = null;
	var tag_lookup = {};
	var style_storage = {};
	
	return;
	
	Util.Object.enumerate(styles, function process_style(id, style) {
		var tag = style.tag;
		
		if (!(tag in tag_lookup))
			tag_lookup[tag] = [];
		tag_lookup[tag].push(style);
		
		style.dispatch_event(new UI.Style.Event('choose', loki, this));
	}, this);
	
	/**
	 * Retrieves (creating if necessary) a storage space for styles that is
	 * local to the capability's Loki instance.
	 */
	this.get_storage = function get_style_instance_storage(style)
	{
		var id = style.identifier;
		
		if (typeof(id) != 'string') {
			throw new TypeError('Styles must have string identifiers.');
		}
	
		return style_storage[id] || (style_storage[id] = {});
	}
}