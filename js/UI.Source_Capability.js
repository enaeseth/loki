/**
 * @class Allows the user to view and edit the document's HTML source code.
 *
 * @base UI.Capability
 * @author Eric Naeseth
 * @constructor
 * @param {UI.Loki}	loki	the Loki instance for which the capability is being
 * 							provided
 */
UI.Source_Capability = function Source(loki)
{
	Util.OOP.inherits(this, UI.Capability, loki, 'Source code editing');
	
	this._add_button('source.gif', 'Edit HTML Source', function() {
		loki.show_source_view();
	}).autofocus = false;
	
	this._add_source_button('source.gif', 'Edit interactively', function() {
		loki.show_graphical_view();
	}).autofocus = false;
	
	[this._add_button, this._add_source_button].each(function (add) {
		add.call(this, 'raw_source.gif', 'Display raw source', function() {
			Util.Window.alert_debug(loki.get_dirty_html());
		}).autofocus = false;
	}.bind(this));
}