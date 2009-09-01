/**
 * Declares instance variables.
 *
 * @constructor
 *
 * @class Represents a menuitem. Can be extended or used as it is.
 */
UI.Menuitem = function()
{
	var label, listener, disabled;

	/**
	 * Inits the menuitem. Params:
	 *    label		string (should not contain HTML)
	 *    listener	function
	 *    disabled	(optional) boolean
	 */
	this.init = function(params)
	{
		if (!params || !params.label || !params.listener) {
			throw new Error('Insufficient information to construct a menu item.');
		}

		label = params.label;
		listener = params.listener;
		disabled = !!params.disabled;

		return this;
	};

	/**
	 * Returns an appendable chunk to render the menuitem.
	 * @return {HTMLElement} chunk
	 */
	this.get_chunk = function(doc)
	{
		var container;
		
		if (disabled) {
			container = doc.createElement('SPAN');
			Util.Element.add_class(container, 'disabled');
		} else {
			container = doc.createElement('A');
			container.href = 'javascript:void(0);';
			Util.Element.add_class(container, 'menuitem');
			Util.Event.add_event_listener(container, 'click', listener);
		}
		
		container.innerHTML = label.replace(' ', '&nbsp;');
		return container;
	};
	
	/**
	 * Gets the menu item's label.
	 * @return {String}
	 */
	this.get_label = function()
	{
		return label;
	}
	
	/**
	 * Gets the menu item's click listener.
	 * @return {Function}
	 */
	this.get_listener = function()
	{
		return listener;
	}
	
	/**
	 * Returns true if the menu item is disabled, false if otherwise.
	 * @return {Boolean}
	 */
	this.is_disabled = function() {
		return disabled;
	}
};
