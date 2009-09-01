/**
 * Declares instance variables.
 *
 * @constructor
 *
 * @class A class for helping insert an anchor. Contains code
 * common to both the button and the menu item.
 */
UI.Anchor_Helper = function()
{
	var self = this;
	Util.OOP.inherits(self, UI.Helper);

	this.init = function(loki)
	{
		this._loki = loki;
		this._masseuse = (new UI.Anchor_Masseuse()).init(this._loki);
		return this;
	};

	this.is_selected = function()
	{
		return !!this.get_selected_item();
	};
	
	function _get_selected_placeholder()
	{
		var sel = Util.Selection.get_selection(self._loki.window);
		var range = Util.Range.create_range(sel);
	 	var found = Util.Range.find_nodes(range, self._masseuse.is_placeholder,
			true);
			
		if (found.length == 0) {
			return null;
		} else if (found.length > 1) {
			throw new Util.Multiple_Items_Error('Multiple anchor placeholders' +
				' are selected.');
		} else {
			return found[0];
		}
	}

	this.get_selected_item = function()
	{
		var placeholder = _get_selected_placeholder();
		return (placeholder)
			? {name: self._masseuse.get_name_from_placeholder(placeholder)}
			: null;
	};

	this.open_dialog = function()
	{
		var selected_item = self.get_selected_item();
		
		if (!this._dialog)
			this._dialog = new UI.Anchor_Dialog();
	
		this._dialog.init({
			base_uri: self._loki.settings.base_uri,
			submit_listener: self.insert_anchor,
			remove_listener: self.remove_anchor,
			selected_item: selected_item
		});
		this._dialog.open();
	};

	this.insert_anchor = function(anchor_info)
	{
		var selected = _get_selected_placeholder();
		var sel;
		var anchor;
		
		if (selected) {
			self._masseuse.update_name(selected, anchor_info.name);
		} else {
			anchor = self._loki.document.createElement('A');
			anchor.name = anchor_info.name;
			
			sel = Util.Selection.get_selection(self._loki.window);
			Util.Selection.collapse(sel, true); // to beginning
			Util.Selection.paste_node(sel, anchor);
			
			self._masseuse.massage(anchor);
		}
		
		self._loki.window.focus();
	};

	this.remove_anchor = function()
	{
		var selected = _get_selected_placeholder();
		var anchor;
		
		if (!selected)
			return;
		
		anchor = self._masseuse.unmassage(selected);
		if (!anchor.hasChildNodes())
			anchor.parentNode.removeChild(anchor);
		else
			anchor.removeAttribute('name');
	};
};
