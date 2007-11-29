/**
 * @class Paragraphification controller.
 *
 * @base UI.Capability
 * @author Eric Naeseth
 * @constructor
 * @param {UI.Loki} the Loki instance for which the capability is being provided
 */
UI.Paragraphifier = function Paragraphifier(loki)
{
	Util.OOP.inherits(this, UI.Capability, loki, 'Paragraphification control');
	
	// XXX: TinyMCE leeching is so very icky.
	var control = new TinyMCEControl();
	control.init(loki.window, loki.iframe, loki);
	var tinyMCE = new TinyMCE();
	tinyMCE.init(loki.window, control);
	
	this.activate = function activate()
	{
		// Create the first paragraph tag if necessary.
		possibly_paragraphify();
	}
	
	function possibly_paragraphify(event)
	{
		var sel = Util.Selection.get_selection(loki.window);
		var rng = Util.Range.create_range(sel);
		var container = Util.Range.get_start_container(rng);
		
		if (container && container.nodeName == 'BODY') {
			loki.toggle_block('p');
		}
		
		if (event)
			tinyMCE.handleEvent(event);
		return true;
	}
	
	function delete_special_elements(event)
	{
		// XXX: Old code only did this if !IE; why?
		Util.Fix_Keys.fix_delete_and_backspace(event, loki.window);
		return true;
	}
	
	function fix_enter_for_ie(event)
	{
		return (Util.Browser.IE)
			? Util.Keys.fix_enter_ie(event, loki.window, loki)
			: true;
	}
	
	this._add_keybinding(Util.Function.optimist, possibly_paragraphify);
	this._add_keybinding('Delete || Backspace', delete_special_elements);
	this._add_keybinding('Enter', fix_enter_for_ie);
}