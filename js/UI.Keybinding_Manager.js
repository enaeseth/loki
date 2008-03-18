/**
 * @class Handles the triggering of functions for specific key combinations.
 * @constructor
 * @param {EventTarget} event_source	if provided, evaluates all keypress
 *										events on this element
 * @author Eric Naeseth
 */
UI.Keybinding_Manager = function(event_source)
{
	var bindings = [];
	
	if (event_source) {
		Util.Event.observe(event_source, 'keypress', function auto_eval(ev) {
			this.evaluate(ev);
		});
	}
	
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
			
			key_test = eval('function(e) { return ' + test + '; }');
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
		function invoke_binding(binding)
		{
			var action = (Util.is_string(binding.action))
				? binding.context[binding.action]
				: binding.action;
			var result = action.call(binding.context, keyboard_event);
			
			if (result == undefined || result === false) {
				Util.Event.prevent_default(keyboard_event);
				return false;
			}
			
			return true;
		}
		
		return bindings.reduce(function(return_value, binding) {
			try {
				if (binding.test.call(binding.context, keyboard_event)) {
					if (!invoke_binding(binding))
						return_value = false;
				}
			} catch (e) {
				if (typeof(console) != 'undefined') {
					if (typeof(console.warn) == 'function') // Firebug
						console.warn('Exception in keybinding:', e);
					else if (typeof(console.log) == 'function')
						console.log('Exception in keybinding: ' + e);
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
	// An explanation of the special handling of the Ctrl key:
	//   Macs have two modifier keys used for launching shortcuts: Control
	//   and Command. Control is only used in a UNIX/Terminal context or when
	//   many shortcuts are needed. So, on Mac systems we'd rather use Command
	//   for our keyboard shortcuts. However, Gecko-based browsers (specifically
	//   Camino and Firefox) don't allow us to trap or even _detect_ Cmd+*
	//   key combinations and will instead use their built-in behavior. However,
	//   Safari and Opera do let us. So, use Command on non-Gecko browsers
	//   on Macs and Control otherwise.
	// - Eric Naeseth
	Ctrl: '(((!Util.Browser.Mac || Util.Browser.Gecko) && e.ctrlKey) || ' +
		'(Util.Browser.Mac && e.metaKey))',
	Backspace: 8,
	Delete: 46,
	End: 35,
	Enter: 13,
	Escape: 27,
	Home: 36,
	PageUp: 33,
	PageDown: 34,
	Shift: 'e.shiftKey',
	Tab: 9
};