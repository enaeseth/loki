// Class: Loki.Event
// Base class for a Loki UI event. These events are fired by Loki components,
// not the browser.
Loki.Event = Loki.Class.create({
	// var: (String) type
	// The event type.
	type: null,
	
	// var: (Object) target
	// The event's target; the object from which the event was dispatched.
	target: null,
	
	// var: (Date) timestamp
	// The time at which the event was dispatched.
	timestamp: null,
	
	// Constructor: Event
	// Creates a new event.
	//
	// Parameters:
	//     (String) type - the event's type
	initialize: function Event(type) {
		this.type = type;
		this.timestamp = new Date();
		this._stopped = false;
		this._defaultPrevented = false;
	},
	
	// Method: stopPropagation
	// Signals to the event dispatcher that no further handlers should be called
	// for this event.
	//
	// Returns:
	//     (void) - Nothing
	stopPropagation: function stop_event_propagation() {
		this._stopped = this._defaultPrevented = true;
	},
	
	// Method: preventDefault
	// Signals to the event dispatcher that the Loki default action for this
	// event (if any) should not be run.
	//
	// Returns:
	//     (void) - Nothing
	preventDefault: function prevent_event_default_action() {
		this._defaultPrevented = true;
	}
});

// Class: Loki.EventTarget
// A mixin providing event handler registration and event dispatch services. The
// API is very similar to the DOM events API, but there is no notion of the
// capturing and bubbling phases.
Loki.EventTarget = {
	// Method: addEventListener
	// Registers an event listener on the target.
	//
	// Parameters:
	//     (String) type - the type of event to listen for
	//     (Function|Object) listener - the event listener
	//     (Object|String) [context] - If _listener_ is a function, _context_
	//     can be an object that will act as the "this context" for the listener
	//     when it is called. If _listener_ is an object, _context_ is the name
	//     of the method on that object that will be called when the event is
	//     fired (the default is "handleEvent").
	//
	// Returns:
	//     (void) - Nothing.
	addEventListener: function add_event_listener(type, listener, context) {
		if (!this._loki_event_listeners) {
			this._loki_event_listeners = {};
		}
		
		if (!this._loki_event_listeners[type]) {
			this._loki_event_listeners[type] = [];
		}
		
		switch (typeof(listener)) {
			case 'function':
				if (context && typeof(context) != 'object') {
					throw new TypeError("Cannot add an event listener: " +
						"if the listener is a function, the context must be " +
						"an object.");
				}
				break;
			case 'object':
				if (context && typeof(context) != 'string') {
					throw new TypeError("Cannot add an event listener: " +
						"if the listener is an object, the context must be " +
						"a method name (i.e., a string).");
				}
				break;
			default:
				throw new TypeError("Cannot add event listener: the listener " +
					"must be a function or an object.");
		}
		
		this._loki_event_listeners[type].push({
			listener: listener,
			context: context || null
		});
	},
	
	// Method: removeEventListener
	// Deregisters an event listener on the target.
	//
	// Parameters:
	//     (String) type - the type of event that is being listened for
	//     (Function|Object) listener - the event listener to remove
	//     (Object|String) [context] - the context (if any) with which the
	//     event listener was registered
	//
	// Returns:
	//     (void) - Nothing.
	removeEventListener: function del_event_listener(type, listener, context) {
		if (!this._loki_event_listeners || !this._loki_event_listeners[type])
			return;
		
		if (!context)
			context = null;
		
		var listeners = this._loki_event_listeners[type];
		for (var i = 0; i < listeners.length; i++) {
			var r = listeners[i];
			if (r.listener == listener && r.context === context) {
				listeners.splice(i, 1);
				i--;
			}
		}
	},
	
	// Method: fireEvent
	// Dispatches an event to registered listeners. Also available as
	// _dispatchEvent_.
	//
	// Parameters:
	//     (Loki.Event|String) event - the event to dispatch; if a string is
	//                                 given, a new event will be created with
	//                                 the string as the event's name
	//     (any) [...] - any extra parameters to be passed to event handlers
	//
	// Returns:
	//     (void) - Nothing
	fireEvent: function fire_event(event) {
		if (arguments.length <= 1) {
			this.fireEventWithDefault(event, null, null);
		} else {
			var args = base2.slice(arguments);
			args.splice(1, 0, null, null);
			this.fireEventWithDefault.apply(this, args);
		}
	},
	
	// Method: fireEventWithDefault
	// Dispatches an event to registered listeners, and also executes a default
	// listener unless one of the explicit listeners calls the _preventDefault_
	// method on the event. Also available as _dispatchEventWithDefault_.
	//
	// Parameters:
	//     (Loki.Event|String) event - the event to dispatch; if a string is
	//                                 given, a new event will be created with
	//                                 the string as the event's name
	//     (Function|Object) default_listener - the default event listener
	//     (Object|String) context - context for the default listener; if the
	//                               listener is a function, the context should
	//                               be its "this" context; if the listener is
	//                               an object, it should be the name of the
	//                               method to call on it
	//     (any) [...] - any extra parameters to be passed to event handlers
	//
	// Returns:
	//     (void) - Nothing
	fireEventWithDefault: function fire_event_with_default_listener(event,
		default_listener, context)
	{
		if (!this._loki_event_listeners) {
			this._loki_event_listeners = {};
			return;
		}
		
		if (typeof(event) == 'string') {
			event = new Loki.Event(event);
		} else if (typeof(event) != 'object' || event === null) {
			throw new TypeError('Cannot dispatch event: no event object to ' +
				'dispatch.');
		} else if (!event.type) {
			throw new Error('The given event has no type; cannot dispatch.');
		}
		
		if (!this._loki_event_listeners[event.type] && !default_listener) {
			return;
		}
		
		var handler_args = base2.slice(arguments, 3);
		handler_args.push(event);
		
		var old_target = event.target;
		event.target = this;
		
		if (typeof(event.preflight) == "function")
			event.preflight();
		
		try {
			var listeners = this._loki_event_listeners[event.type];
			var length = (listeners) ? listeners.length : 0;
			
			var l_fn, r;
			for (var i = 0; i < length; i++) {
				r = listeners[i];
				
				if (typeof(r.listener) == 'function') {
					r.listener.apply(r.context, handler_args);
				} else {
					l_fn = r.listener[r.context || 'handleEvent'];
					l_fn.apply(r.listener, handler_args);
				}
				
				if (event._stopped)
					break;
			}
			
			if (default_listener && !event._defaultPrevented) {
				if (typeof(default_listener) == "function") {
					default_listener.apply(context, handler_args);
				} else {
					l_fn = default_listener[context || 'handleEvent'];
					l_fn.apply(default_listener, handler_args);
				}
			}
		} finally {
			if (typeof(event.postflight) == "function") {
				try {
					event.postflight();
				} catch (e) {
					// ignore
				}
			}
			event.target = old_target; // reset the event's target
		}
	}
};

// Aliases
Loki.EventTarget.dispatchEvent = Loki.EventTarget.fireEvent;
Loki.EventTarget.dispatchEventWithDefault =
	Loki.EventTarget.fireEventWithDefault;
