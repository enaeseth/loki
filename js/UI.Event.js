/**
 * @class Base class for a Loki UI event.
 * @constructor
 * @author Eric Naeseth
 * @param {string}	the event's type
 */
UI.Event = function(type)
{
	this.type = type;
	this.target = null;
	this.timestamp = new Date();
}

/**
 * @class A mixin providing event handler registration and event dispatch
 *        services. It's basically an implementation of the DOM's EventTarget,
 *        but without propagation, using Loki's naming convention, and with
 *        support for "contexts" (see add_event_listener).
 * @author Eric Naeseth
 */
UI.Event_Target = {
	_es_event_listeners: {},
	
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
	add_event_listener: function(type, listener, context)
	{
		if (!this._es_event_listeners) {
			throw new Error('The event listener dictionary is gone!');
		}
		
		if (!this._es_event_listeners[type]) {
			this._es_event_listeners[type] = {};
		}
		
		this._es_event_listeners[type][listener] = context || null;
	},
	
	/**
	 * Removes an event listener from the target.
	 * @param	{string}	The event type for which the user is deregistering
	 * @param	{object or function}	The event listener
	 * @param	{object or string}	The context with which the listener was
	 *								registered
	 * @type void
	 */
	remove_event_listener: function(type, listener, context)
	{
		if (!this._es_event_listeners) {
			throw new Error('The event listener dictionary is gone!');
		}
		
		if (!this._es_event_listeners[type]) {
			return;
		}
		
		if (this._es_event_listeners[type] == (context || null))
			delete this._es_event_listeners[type][listener];
	},
	
	/**
	 * Dispatches an event to any and all registered listeners.
	 * @param {UI.Event}	the event to dispatch
	 * @type void
	 */
	dispatch_event: function(event)
	{
		if (!this._es_event_listeners) {
			throw new Error('The event listener dictionary is gone!');
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
			
			for (var listener in listeners) {
				try {
					var context = listeners[listener];
					
					if (typeof(listener) == 'function') {
						listener.call(context, event);
					} else {
						listener[context || 'handle_event'](event);
					}
				} catch (e) {
					exceptions.push(e);
				}
			}
		} finally {
			event.target = old_target; // reset the event's target
		}
		
		if (exceptions.length > 0)
			throw new UI.Event_Dispatch_Error(exceptions);
	}
}

/**
 * @class Exception raised one or more event handlers fail.
 * @constructor
 * @param	{array}
 */
UI.Event_Dispatch_Error = function(exceptions)
{
	Util.OOP.inherits(this, Error,
		'One or more errors occurred in event handlers.');
	this.name = 'UI.Event.Dispatch_Error';
	this.exceptions = exceptions;
}