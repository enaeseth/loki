/**
 * @class Special key handling for Loki.
 * @author Eric Naeseth
 */
UI.Special_Key_Handler = {
	/**
	 * Handles a key event.
	 * @param {UI.Key_Event}	event
	 * @return {void}
	 */
	handle_event: function handle_special_key_event(event)
	{
		var key_name = UI.Key_Event._handling_map[event.code];
		var handler = this._default_handlers[key_name];
		if (handler) {
			this[handler](event);
		}
	},
	
	/** @ignore */
	handle_enter: function handle_enter(event)
	{
		
	},
	
	/** @ignore */
	handle_delete: function handle_delete(event)
	{
		event.allow_browser_handling();
	},
	
	/** @ignore */
	_default_handlers: {
		ENTER: 'handle_enter',
		DELETE: 'handle_delete',
		BACKSPACE: 'handle_delete'
	}
};