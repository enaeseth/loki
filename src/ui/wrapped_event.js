// Class: Loki.UI.WrappedEvent
// A DOM (browser) event that is wrapped up in a Loki event object because that
// event receives special handling from Loki.
Loki.UI.WrappedEvent = Loki.Class.create(Loki.Event, {
	_browserHandling: false,
	
	// var: (Event) source
	// The wrapped event.
	source: null,
		
	// Constructor: WrappedEvent
	// Creates a new wrapped event.
	//
	// Parameters:
	//     (Event) source - the DOM event being wrapped
	//     (String) [type] - the type of the Loki event; if not specified, the
	//                       DOM event's type will be used
	initialize: function WrappedEvent(source, type) {
		WrappedEvent.superclass.call(this, type || source.type);
		this.source = source;
	},
	
	// Method: allowBrowserHandling
	// Permits the browser to run its default handling for the wrapped event.
	// (By default, the browser will be prevented from executing its default
	// behavior for the wrapped event.)
	//
	// Returns:
	//     (void) - Nothing
	allowBrowserHandling: function wrapped_event_allow_browser_handling() {
		this._browserHandling = true;
	},
	
	// Prevents or allows the browser's default handling.
	postflight: function wrapped_event_postflight() {
		if (!this._browserHandling)
			this.source.preventDefault();
	}
});
