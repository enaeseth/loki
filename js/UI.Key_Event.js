/**
 * Constructs a new keyboard event.
 * @class An event raised by Loki when the user presses a "special" key, e.g.
 * one that could insert/remove an element or some text or change the editing
 * context.
 * @constructor
 * @param {UI.Loki}	loki	the Loki instance in which the event was generated
 * @param {Event}	source	the browser event that triggered this event
 */
UI.Key_Event = function KeyEvent(loki, source)
{
	Util.OOP.inherits(this, UI.Event, source.type);
	Util.OOP.mixin(this, UI.Key_Event.Codes);
	
	/**
	 * The Loki instance in which the keyboard event was generated.
	 * @type UI.Loki
	 */
	this.loki = loki;
	
	/**
	 * The browser event that triggered this event.
	 * @type Event
	 */
	this.source = source;
	
	/**
	 * The code of the key that was pressed.
	 * @type number
	 * @see UI.Key_Event.Codes
	 */
	this.code = UI.Key_Event._translate_key_code(source.keyCode);
	
	/**
	 * Whether or not the shift key was depressed when the event occurred.
	 * @type boolean
	 */
	this.shift = source.shiftKey;
	
	/**
	 * @ignore
	 */
	this._state = 0;
	
	this.prevent_default = function prevent_default()
	{
		this._state |= UI.Key_Event._DEFAULT_PREVENTED;
	}
	
	this.allow_browser_handling = function allow_browser_handling()
	{
		this._state |= UI.Key_Event._BROWSER_HANDLING_ALLOWED;
	}
}

/**
 * Observes the appropriate DOM keyboard events dispatched on the given element
 * so that Loki key events can be dispatched on the given target.
 * @param {Element}	element		the HTML element whose events should be observed	
 * @param {object}	target		the target for the generated events
 * @param {function} [default_handler] a default event handler to call if no
 *								other event handlers call prevent_default()
 * @param {function} [on_end]	a function to call after all other handling has
 *								been completed
 * @type {void}
 */
UI.Key_Event.translate = function translate_browser_events_to_loki_key_events(
	element, target, default_handler, on_end)
{
	// Even though UI.Loki is the only current user of this function, I've moved
	// this code out here due to its complexity.
	
	// Known browser issues and how they are dealt with:
	//    [1] It seems that in Gecko browsers (at least Firefox 2.0.0.11/Mac),
	//        and Opera (at least Opera 9.24/Mac), the default browser behavior
	//        of these keys can only be prevented on keypress, not keydown, so
	//        we trap keypress for this browser.
	//    [2] Unfortunately, IE will not generate keypress events for arrow
	//        keys, and while current releases of Safari (3.0.4/Mac at least)
	//        generate keypress events for all of our special keys (and even
	//        invented unique codes for them), recent nightly WebKit builds
	//        no longer do and only generate keyup/down. So, for all other
	//        browsers we use keydown.
	//    [3] It seems that we would run into trouble because Safari/Mac only
	//        generates keypress events when the operating system notices that a
	//        key is being held down and generates a repeat, but apparently
	//        since we blocked the initial keydown, Safari is smart enough to
	//        not generate events for the repeats. It is unknown if this works
	//        on Safari/Windows, since it generates both a keydown and a
	//        keypress event on each repetition.
	
	function key_depressed(event)
	{
		var return_value = true;
		
		if (!UI.Key_Event._handles_code(event.keyCode))
			return return_value;
		
		var key_event = new UI.Key_Event(self, event);
		target.dispatch_event(key_event);
		
		if (default_handler) {
			if (!(key_event._state & UI.Key_Event._DEFAULT_PREVENTED)) {
				default_handler(key_event);
			}
		}
		
		if (!(key_event._state & UI.Key_Event._BROWSER_HANDLING_ALLOWED)) {
			Util.Event.prevent_default(event);
			return_value = false;
		}
		
		if (on_end)
			on_end(event);
		
		return return_value;
	}
	
	if (Util.Browser.Gecko) {
		Util.Event.observe(element, 'keypress', key_depressed); // [1]
	} else {
		Util.Event.observe(element, 'keydown', key_depressed); // [2]
	}
}

/** @ignore */
UI.Key_Event._DEFAULT_PREVENTED = 1;
/** @ignore */
UI.Key_Event._BROWSER_HANDLING_ALLOWED = 2;

/**
 * Useful key code constants. These are placed both on UI.Key_Event itself and
 * all of its instances.
 */
UI.Key_Event.Codes = {
	// Arrow keys
	LEFT: 37,
	UP: 38,
	RIGHT: 39,
	DOWN: 40,
	
	// Navigation keys
	HOME: 36,
	END: 35,
	PAGE_UP: 33,
	PAGE_DOWN: 34,
	
	ENTER: 13,
	TAB: 9,
	
	DELETE: 46,
	BACKSPACE: 8
};

Util.OOP.mixin(UI.Key_Event, UI.Key_Event.Codes);

/**
 * Translates the creative faux-ASCII key codes that Safari provides
 * on keypress events to the Gecko/IE values that we use internally.
 */
UI.Key_Event._translate_key_code = function translate_key_code(code)
{
	if (!Util.Browser.WebKit)
		return code;
	
	switch (code) {
		case 63232:
			return UI.Key_Event.UP;
		case 63233:
			return UI.Key_Event.DOWN;
		case 63234:
			return UI.Key_Event.LEFT;
		case 63235:
			return UI.Key_Event.RIGHT;
		case 63272:
			return UI.Key_Event.DELETE;
		case 63273:
			return UI.Key_Event.HOME;
		case 63275:
			return UI.Key_Event.END;
		case 63276:
			return UI.Key_Event.PAGE_UP;
		case 63277:
			return UI.Key_Event.PAGE_DOWN;
		default:
			return code;
	}
}

/** @ignore */
UI.Key_Event._handles_code = function key_event_handles_code(code)
{
	if (!this._handling_map) {
		this._handling_map = {};
		for (var name in UI.Key_Event.Codes) {
			this._handling_map[UI.Key_Event.Codes[name]] = name;
		}
	}
	
	return (this._handling_map[code] && true)|| false;
}
