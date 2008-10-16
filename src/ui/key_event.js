#import "wrapped_event.js"

// Class: Loki.UI.KeyEvent
// Represents the user pressing a key that has some special function (like
// Return).
Loki.UI.KeyEvent = Loki.Class.create(Loki.UI.WrappedEvent, {
	// Constructor: KeyEvent
	// Creates a new key event from a DOM keyboard event.
	//
	// Throws:
	//     TypeError - if _source_ is not a DOM keyboard event, or if it doesn't
	//                 have a registered interpretation as a KeyEvent
	initialize: function KeyEvent(source) {
		if (!source) {
			throw new TypeError("No event given to wrap in a KeyEvent object.");
		} else if (typeof(source.keyCode) != "number") {
			throw new TypeError("Cannot wrap a non-keyboard event in a UI " +
				"KeyEvent object.");
		}
		
		var type = Loki.UI.KeyEvent._interpretations[source.keyCode];
		if (!type) {
			throw new TypeError("Key code " + source.keyCode + " does not " +
				"have a registered interpretation as a KeyEvent object. If " +
				"you wish to wrap these events in a KeyEvent, please call " +
				"Loki.UI.KeyEvent.addInterpretation.");
		}
		
		KeyEvent.superclass.call(this, source, type);
	}
});

Loki.UI.KeyEvent.addInterpretation = function add_interpretation(code, type) {
	var codes = (code.length) ? code : [code];
	var interpretations = Loki.UI.KeyEvent._interpretations;
	
	base2.forEach(codes, function(code) {
		interpretations[code] = type;
	}, this);
};

Loki.UI.KeyEvent._interpretations = [];
