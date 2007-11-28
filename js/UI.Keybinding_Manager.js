/**
 * @class Handles the triggering of functions for specific key combinations.
 * @constructor
 * @author Eric Naeseth
 */
UI.Keybinding_Manager = function()
{
	var bindings = [];
	
	/**
	 * Adds a keybinding.
	 * @param {string or function} Either a string describing the keys or a
	 *        function that when passed a keyboard event object returns true
	 *        if the keybound function should be called, false if otherwise.
	 * @param {function} The function to be bound to keys
	 * @param {object} An optional object to be used as "this" when the test
	 *                 and action are called.
	 * @type void
	 */
	this.bind = function(key_test, action, context)
	{
		if (typeof(key_test) == 'string') {
			// If we've received a descriptor string, build a JavaScript
			// function that, given a keyboard event "e", tests for the
			// presence of the keys in e.
			
			var test = key_test.split(/\s*\|\|\s*/).map(function(key_string) {
				return '(' + key_string.split(/\s+/).map(function(key) {
					var test = (key in UI.Keybinding_Manager.Special)
						? UI.Keybinding_Manager.Special[key]
						: key.toUpperCase().charCodeAt(0);
					
					if ('number' == typeof(test)) {
						test = 'Util.Event.matches_keycode(e, ' + test + ')';
					}
					
					return test;
				}).join(') && (') + ')';
			}).join(' || ');
			
			key_test = new Function('e', test);
		}
		
		bindings.push({
			test: key_test,
			action: action,
			context: (context || null)
		});
	}
	
	/**
	 * Evaluates the given event and runs any matching bound functions.
	 * @param {Event} the event to evaluate
	 * @type void
	 */
	this.evaluate = function(keyboard_event)
	{
		return bindings.reduce(function(return_value, binding) {
			try {
				if (binding.test.call(binding.context, keyboard_event)) {
					if (!binding.action.call(binding.context, keyboard_event)) {
						Util.Event.prevent_default(keyboard_event);
						return_value = false;
					}
				}
			} catch (e) {
				if (console && console.warning) {
					console.warning('Exception in keybinding:', e);
				}
			}
			
			return return_value;
		}, true);
	}
}

/**
 * @ignore
 */
UI.Keybinding_Manager.Special = {
	Alt: 'e.altKey',
	Ctrl: '((!Util.Browser.Mac && e.ctrlKey) || ' +
		'(Util.Browser.Mac && e.metaKey))',
	Backspace: 8,
	Delete: 46,
	End: 35,
	Enter: 13,
	Escape: 27,
	Home: 36,
	PageUp: 33,
	PageDown: 34,
	Tab: 9
};