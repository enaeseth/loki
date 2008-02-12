/**
 * @class Base class for a Loki UI event.
 * @constructor
 * @author Eric Naeseth
 * @param {string}	type	the event's type
 */
UI.Event = function Event(type)
{
	/**
	 * The event's type.
	 * @type string
	 */
	this.type = type;
	
	/**
	 * The event's target; the object on which the event was dispatched.
	 * @type object
	 */
	this.target = null;
	
	/**
	 * The timestamp of when the event was dispatched.
	 * @type Date
	 */
	this.timestamp = new Date();
	
	/**
	 * Signals to the event dispatcher that no further handlers should be called
	 * for this event.
	 * @return {void}
	 */
	this.stop_propagation = function stop_event_propagation()
	{
		this._propagation_stopped = true;
	}
	
	/**
	 * Internal flag that is set when propagation is stopped.
	 * @type boolean
	 */
	this._propagation_stopped = false;
}

/**
 * @class A mixin providing event handler registration and event dispatch
 *        services. It's basically an implementation of the DOM's EventTarget,
 *        but without propagation, using Loki's naming convention, and with
 *        support for "contexts" (see add_event_listener).
 * @author Eric Naeseth
 */
UI.Event_Target = {
	/**
	 * Registers an event listener on the target.
	 * @param	{string}	The event type for which the user is registering
	 * @param	{object or function}	The event listener
	 * @param	{object}	If the listener is a function, the "this" context in 
	 *						which the listener will be called; if an object,
	 *						the name of the handler function (defaults to
	 *						handle_event)
	 * @type void
	 */
	add_event_listener: function add_event_listener(type, listener, context)
	{
		if (!this._es_event_listeners) {
			this._es_event_listeners = {};
		}
		
		if (!this._es_event_listeners[type]) {
			this._es_event_listeners[type] = [];
		}
		
		this._es_event_listeners[type].push({
			listener: listener,
			context: context || null
		});
	},
	
	/**
	 * Removes an event listener from the target.
	 * @param	{string}	The event type for which the user is deregistering
	 * @param	{object or function}	The event listener
	 * @param	{object or string}	The context with which the listener was
	 *								registered
	 * @type void
	 */
	remove_event_listener: function remove_event_listener(type, listener,
		context)
	{
		if (!this._es_event_listeners) {
			throw new Error('The event listener dictionary is gone!');
		}
		
		if (!this._es_event_listeners[type]) {
			return;
		}
		
		var listeners = this._es_event_listeners[type];
		
		for (var i = 0; i < listeners.length; i++) {
			var r = listeners[i];
			if (r.listener == listener && r.context == (context || null))
				listeners.splice(i, 1);
			i--;
		}
	},
	
	/**
	 * Dispatches an event to any and all registered listeners.
	 * @param {UI.Event}	the event to dispatch
	 * @type void
	 */
	dispatch_event: function dispatch_event(event)
	{
		if (!this._es_event_listeners) {
			this._es_event_listeners = {};
			return;
		}
		
		if (!event.type) {
			throw new Error('The given event has no type; cannot dispatch.');
		}
		
		if (!this._es_event_listeners[event.type]) {
			return;
		}
		
		var exceptions = [];
		var old_target = event.target;
		event.target = this;
		try {
			var listeners = this._es_event_listeners[event.type];
			
			for (var i = 0; i < listeners.length; i++) {
				var r = listeners[i];
				
				try {
					if (typeof(r.listener) == 'function') {
						r.listener.call(r.context, event);
					} else {
						r.listener[r.context || 'handle_event'](event);
					}
				} catch (e) {
					exceptions.push(e);
				}
				
				if (event._propagation_stopped)
					break;
			}
		} finally {
			event.target = old_target; // reset the event's target
		}
		
		if (exceptions.length > 0)
			throw new UI.Event_Dispatch_Error(exceptions);
	}
}

/**
 * @class Exception raised when one or more UI event handlers fail.
 * @constructor
 * @param	{array}
 */
UI.Event_Dispatch_Error = function EventDispatchError(exceptions)
{
	Util.OOP.inherits(this, Error,
		'One or more errors occurred in event handlers.');
	this.name = 'UI.Event.Dispatch_Error';
	this.exceptions = exceptions;
}