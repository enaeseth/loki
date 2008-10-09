/**
 * @class Handles the triggering of functions for specific key combinations.
 * @constructor
 * @param {EventTarget} event_source	if provided, evaluates all keypress
 *										events on this element
 * @author Eric Naeseth
 */
// Class: Loki.UI.KeybindingManager
// Facilitates the simple implementation of keyboard shortcuts. Calls a given
// function when its associated key combination is pressed.
Loki.UI.KeybindingManager = Loki.Class.create({
	// Constructor: KeybindingManager
	// Creates a new keybinding manager.
	//
	// Parameters:
	//     (EventTarget) source - if provided, all keypress events on this
	//                            element will be evaluated
	initialize: function KeybindingManager(source) {
		this.bindings = [];
		
		if (source) {
			var kbm = this;
			$extend(source).addEventListener("keypress", function auto_eval(e) {
				return kbm.evaluate(e);
			}, false);
		}
	},
	
	// Method: add
	// Adds a keybinding.
	//
	// Parameters:
	//     (String|Function) test - Either a string describing the key combo,
	//                              or a boolean test function that accepts a
	//                              DOM keyboard event.
	//     (Function) action - the function to bind to the key combo
	//     (Object) [context] - an optional "this" context for the action
	add: function add_keybinding(test, action, context) {
		if (typeof(test) == 'string') {
			// If we've received a descriptor string, build a JavaScript
			// function that, given a keyboard event "e", tests for the
			// presence of the keys in e.
			
			function matches_keycode(e, key_code) {
				if (e.type == 'keyup' || e.type == 'keydown') {
					return (e.keyCode == key_code);
				} else if (e.type == 'keypress') {
					var code = (e.charCode)
						? e.charCode
						: e.keyCode; // Internet Explorer

					if (key_code == code)
						return true;
					return (key_code >= 65 && key_code <= 90 &&
						key_code + 32 == code);
				} else {
					throw new TypeError('The given event is not an applicable' +
						' keyboard event.');
				}
			}
			
			function make_test(key_string) {
				var body = base2.map(key_string.split(/\s+/), function(key) {
					var test = (key in Loki.UI.KeybindingManager.Special)
						? Loki.UI.KeybindingManager.Special[key]
						: key.toUpperCase().charCodeAt(0);
					
					if ('number' == typeof(test)) {
						test = 'matches_keycode(e, ' + test + ')';
					}
					
					return test;
				});
				
				return "(" + body.join(") && (") + ")";
			}
			var tests = base2.map(test.split(/\s*\|\|\s*/), make_test);
			tests = tests.join(' || ');
			test = eval('(function(e) { return ' + tests + '; })');
		}
		
		this.bindings.push({
			test: test,
			action: action,
			context: (context || null)
		});
	},
	
	// Method: evaluate
	// Evaluates the event and runs any matching bound functions.
	//
	// Parameters:
	//     (Event) event - the keyboard event to evaluate
	evaluate: function evaluate_keybinding(event) {
		function invoke_binding(binding) {
			var action = (typeof(binding.action) == "string")
				? binding.context[binding.action]
				: binding.action;
			
			var result = action.call(binding.context, event);
			if (result === false || typeof(result) == "undefined") {
				event.preventDefault();
				return false;
			}
			
			return true;
		}
		
		var value = true;
		base2.forEach(this.bindings, function process_binding(binding) {
			if (binding.test.call(binding.context, event)) {
				if (!invoke_binding(binding))
					value = false;
			}
		});
		return value;
	}
});

Loki.UI.KeybindingManager.Special = {
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
	Ctrl: '(((!Loki.Browser.Mac || Loki.Browser.Gecko) && e.ctrlKey) || ' +
		'(Loki.Browser.Mac && e.metaKey))',
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
