/**
 * Declares instance variables.
 *
 * @constructor
 *
 * @class Represents a keybinding. For extending only.
 */
UI.Keybinding = function()
{
	this.action; // function

	this.init = function(loki)
	{
		this._loki = loki;
		return this;
	};

	/**
	 * Returns whether the given keycode matches that 
	 * of the given event. 
	 */
	this.matches_keycode = function(e, keycode)
	{
		if (e.type == 'keydown') {
			return (e.keyCode == keycode);
		} else if (e.type == 'keypress') {
			if (e.charCode == keycode)
				return true;
			if (e.charCode >= 65 || e.charCode <= 90)
				return (e.charCode == keycode + 32);
			return false;
		} else {
			return false;
		}
	};
};

UI.Keybinding.compile_test = function compile_keybinding_test(test_string) {
	var tests = test_string.split(/\s*\|\|\s*/);

	var test = Util.Array.map(tests, function(key_string) {
		var test_parts = key_string.split(/[\s]+/);
		return '(' + Util.Array.map(test_parts, function(key) {
			var test = (key in UI.Keybinding.special)
				? UI.Keybinding.special[key]
				: key.toUpperCase().charCodeAt(0);

			if ('number' == typeof(test)) {
				test = 'Util.Event.matches_keycode(e, ' + test + ')';
			}

			return test;
		}).join(') && (') + ')';
	}).join(' || ');

	// IE8 seems to require that we assign the function to a variable inside
	// the eval(), as opposed to just doing something like:
	//   return eval('(function ...)');
	var tester;
	eval('tester = function _test_key_event(e) { return ' + test + '; };');
	if (typeof(tester) != 'function') {
		throw new Error('Failed to compile keybinding test function.');
	}
	return tester;
};

/**
 * @ignore
 */
UI.Keybinding.special = {
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
