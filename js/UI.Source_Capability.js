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
}