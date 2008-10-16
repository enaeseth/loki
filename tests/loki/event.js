pr.add("Creating an event", function() {
	var ev = new Loki.Event("blah");
	this.assertEqual("blah", ev.type);
	this.assertSame(null, ev.target);
	this.assert(ev.timestamp instanceof Date, "Event should have a Date" +
		"timestamp.");
});

var event_fixture = new Crucible.Fixture("Using an event target");
event_fixture.initialize = function() {
	this.klass = function SampleEventTarget() {};
	Loki.Class.mixin(this.klass, Loki.EventTarget);
};

event_fixture.setUp = function() {
	this.target = new this.klass();
};

event_fixture.tearDown = function() {
	delete this.target;
};

event_fixture.add("Firing an event", function() {
	var received = false;
	var event = null;
	var self = this;
	function event_fired(received_event) {
		self.assertSame(event, received_event);
		received = true;
	}
	
	event = new Loki.Event("test");
	this.target.addEventListener(event.type, event_fired);
	this.target.fireEvent(event);
	
	this.assert(received, "Event handler should have been called");
});

event_fixture.add("Firing an event with only a name", function() {
	var received = false;
	var type = "test";
	var self = this;
	function event_fired(received_event) {
		self.assertSame(type, received_event.type);
		received = true;
	}
	
	this.target.addEventListener(type, event_fired);
	this.target.fireEvent(type);
	
	this.assert(received, "Event handler should have been called");
});

event_fixture.add("Removing an event listener", function() {
	var received = [false, false];
	var type = "test";
	function event_handler_1(received_event) {
		received[0] = true;
	}
	function event_handler_2(received_event) {
		received[1] = true;
	}
	
	this.target.addEventListener(type, event_handler_1);
	this.target.addEventListener(type, event_handler_2);
	this.target.removeEventListener(type, event_handler_1);
	this.target.fireEvent(type);
	
	this.assertFalse(received[0], "Event handler 1 should NOT have been called");
	this.assert(received[1], "Event handler 2 should have been called");
});

event_fixture.add("Firing an event to a handler with a context", function() {
	var received = false;
	var type = "test";
	var context = {foo: 42};
	var self = this;
	function event_fired(received_event) {
		self.assertSame(type, received_event.type);
		self.assertSame(context, this);
		received = true;
	}
	
	this.target.addEventListener(type, event_fired, context);
	this.target.fireEvent(type);
	
	this.assert(received, "Event handler should have been called");	
});

event_fixture.add("Using an object as an event handler", function() {
	var called = {
		handleEvent: false,
		custom: false
	};
	
	var handler = {
		handleEvent: function() { called.handleEvent = true; },
		custom: function() { called.custom = true; }
	};
	
	var type = "doom";
	
	this.target.addEventListener(type, handler);
	this.target.addEventListener(type, handler, "custom");
	this.target.fireEvent(type);
	
	this.assert(called.handleEvent, "Default-named handler method should have" +
		" been called");
	this.assert(called.custom, "Custom-named handler method should have " +
		"been called");
});

event_fixture.add("Event handlers get called in order", function() {
	var seq = 1;
	var order = [0, 0];
	var type = "tinker";
	
	function handler_a() { order[0] = seq++; }
	function handler_b() { order[1] = seq++; }
	
	this.target.addEventListener(type, handler_a);
	this.target.addEventListener(type, handler_b);
	this.target.fireEvent(type);
	
	this.assertEqual(1, order[0], "handler A should've been called first");
	this.assertEqual(2, order[1], "handler B should've been called second");
});

event_fixture.add("Stopping event propagation", function() {
	var seq = 1;
	var order = [0, 0];
	var type = "tinker";
	
	function handler_a(e) { order[0] = seq++; e.stopPropagation(); }
	function handler_b() { order[1] = seq++; }
	
	this.target.addEventListener(type, handler_a);
	this.target.addEventListener(type, handler_b);
	this.target.fireEvent(type);
	
	this.assertEqual(1, order[0], "handler A should've been called");
	this.assertEqual(0, order[1], "handler B should not have been called");
});

event_fixture.add("Firing an event with a default handler", function() {
	var seq = 1;
	var order = [0, 0];
	var type = "tinker";
	
	function handler_a() { order[0] = seq++; }
	function handler_b() { order[1] = seq++; }
	
	this.target.addEventListener(type, handler_a);
	this.target.fireEventWithDefault(type, handler_b);
	
	this.assertEqual(1, order[0], "explicit handler should've been called first");
	this.assertEqual(2, order[1], "default handler should've been called second");
});

event_fixture.add("Preventing a default event action", function() {
	var seq = 1;
	var order = [0, 0];
	var type = "tinker";
	
	function handler_a(e) { order[0] = seq++; e.preventDefault(); }
	function handler_b() { order[1] = seq++; }
	
	this.target.addEventListener(type, handler_a);
	this.target.fireEventWithDefault(type, handler_b);
	
	this.assertEqual(1, order[0], "explicit handler should've been called");
	this.assertEqual(0, order[1], "default handler should not have been called");
});

pr.add(event_fixture);
