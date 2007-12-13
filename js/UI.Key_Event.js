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
	UI.Key_Event._add_codes_to_object(this);
	
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
	this.code = source.keyCode;
	
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
		this.state |= UI.Key_Event._DEFAULT_PREVENTED;
	}
	
	this.allow_browser_handling = function allow_browser_handling()
	{
		this.state |= UI.Key_Event._BROWSER_HANDLING_ALLOWED;
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
	
	DELETE: 46,
	BACKSPACE: 8
};

/**
 * @ignore
 */
UI.Key_Event._add_codes_to_object = function add_key_codes_to_obj(destination)
{
	Util.OOP.mixin(destination, UI.Key_Event.Codes);
}
UI.Key_Event._add_codes_to_object(UI.Key_Event);

/**
 * @ignore
 */
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
