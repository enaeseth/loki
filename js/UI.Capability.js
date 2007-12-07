/**
 * @class Base class for editor capabilities.
 * @author Eric Naeseth
 * @constructor
 * @param	{UI.Loki}	loki	the Loki instance for which the capability is
 *								being provided
 * @param	{string}	name	a human-presentable name of the capability
 */
UI.Capability = function(loki, name)
{
	this.loki = loki;
	this.name = name;
	
	this.toolbar_items = [];
	this.source_toolbar_items = [];
	this.keybindings = [];
	this.masseuses = [];
	
	this._relevant = true;
	this._illuminated = false;
	
	/**
	 * Called when the contextual menu is being built; the capability should
	 * add any relevant items to the menu.
	 * @param {UI.Menu}	menu	the under-construction contextual menu
	 * @type void
	 */
	this.add_menu_items = function add_menu_items(menu)
	{
		// The default implementation does nothing.
	}
	
	/**
	 * Called by Loki when the editing context changes (e.g. the cursor is
	 * moved). The default implementation will set the relevancy iff a method
	 * named "_determine_relevancy" exists.
	 * @type void
	 */
	this.context_changed = function context_changed()
	{
		if (typeof(this._determine_relevancy) == 'function') {
			this.set_relevancy(this._determine_relevancy());
		}
		
		if (typeof(this._determine_illumination) == 'function') {
			this.set_illumination(this._determine_illumination());
		}
	}
	
	var original_context_changed = this.context_changed
	
	/**
	 * @type boolean
	 */
	this._is_context_aware = function _is_context_aware()
	{
		return (this.context_changed != original_context_changed)
			? true
			: !!(this._determine_relevancy || this._determine_illumination);
	}
	
	this.is_selection_empty = function is_selection_empty()
	{
		return Util.Selection.is_collapsed(loki.get_selection());
	};
	
	/**
	 * Returns true if this capability is currently at all relevant; false if
	 * otherwise.
	 * @type boolean
	 */
	this.is_relevant = function is_relevant()
	{
		return this._relevant;
	}
	
	/**
	 * Sets the relevancy of the capability. The default implementation also
	 * enables/disables any toolbar items.
	 * @param {boolean}	new value
	 * @type void
	 */
	this.set_relevancy = function set_relevancy(value)
	{
		if (value == this._relevant)
			return;
		
		this._relevant = value;
		
		function set_item_status(item) { item.set_enabled(value); }
		this.toolbar_items.each(set_item_status);
		this.source_toolbar_items.each(set_item_status);
	}
	
	/**
	 * Returns true if this capability is currently active; false if
	 * otherwise.
	 * @type boolean
	 */
	this.is_illuminated = this.is_active = function is_illuminated()
	{
		return this._illuminated;
	}
	
	/**
	 * Sets the set_illumination of the capability. The default implementation
	 * also activates/deactivates any toolbar items.
	 * @param {boolean}	new value
	 * @type void
	 */
	this.set_illumination = function set_illumination(value)
	{
		if (value == this._illuminated)
			return;
		
		this._illuminated = value;
		
		function set_item_status(item) { item.set_active(value); }
		this.toolbar_items.each(set_item_status);
		this.source_toolbar_items.each(set_item_status);
	}
	
	function add_button_to_toolbar(toolbar, image, title, method)
	{
		var button = new UI.Toolbar.Button(image, title);
		
		// Note that no click listener will be added if method is *null*;
		// the default name is only substituted if it is undefined
		if (typeof(method) == 'undefined' && this.execute) {
			method = 'execute';
		}
		if (method) {
			if (typeof(method) == 'function')
				button.add_event_listener('click', method, this);
			else
				button.add_event_listener('click', this, method);
		}
		
		toolbar.push(button);
		return button;
	}
	
	/**
	 * Convenience method for adding a button to the toolbar. The default
	 * behavior if no method is specified is to add a click listener to the
	 * button that calls the "execute" method on the capability (if one exists).
	 *
	 * @param {string} Filename of the toolbar button's image
	 * @param {string} Tooltip title and alternate text to display
	 * @param {string} Name of method to call on click (default: 'execute')
	 * @type UI.Toolbar.Button
	 * @return the created toolbar button
	 */
	this._add_button = function _add_button(image, title, method)
	{
		return add_button_to_toolbar.call(this, this.toolbar_items, image,
			title, method);
	}
	
	/**
	 * Convenience method for adding a button to the source toolbar. The default
	 * behavior if no method is specified is to add a click listener to the
	 * button that calls the "execute" method on the capability (if one exists).
	 *
	 * @param {string} Filename of the toolbar button's image
	 * @param {string} Tooltip title and alternate text to display
	 * @param {string} Name of method to call on click (default: 'execute')
	 * @type UI.Toolbar.Button
	 * @return the created toolbar button
	 */
	this._add_source_button = function _add_source_button(image, title, method)
	{
		return add_button_to_toolbar.call(this, this.source_toolbar_items,
			image, title, method);
	}
	
	/**
	 * Adds a keyboard binding.
	 * @param {string} The description of the key combination to capture
	 * @param {string} Name of method to call on click (default: 'execute')
	 */
	this._add_keybinding = function _add_keybinding(keys, method)
	{
		this.keybindings.push({
			test: keys,
			action: method || 'execute'
		});
	}
	
	/**
	 * @ignore
	 */
	this.toString = function capability_to_string()
	{
		return "[UI.Capability name=\"" + this.name + "\"]";
	}
}