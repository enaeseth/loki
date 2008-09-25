// Class: Loki.UI.Widget
// The base class for all Loki UI components.
// Mixes in <Loki.EventTarget>.
Loki.UI.Widget = Loki.Class.create({
	// Constructor: Widget
	// Creates a new trivial widget.
	initialize: function Widget() {
		
	},
	
	// Method: create
	// Creates the HTML node(s) that constitute the widget.
	//
	// Parameters:
	//     (Document) document - the document on which the widget should be
	//                           created
	//
	// Returns:
	//     (Node) - the widget's body. The node returned may be a document
	//              fragment.
	create: function create_widget_body(document) {
		
	}
});

Loki.Class.mixin(Loki.UI.Widget, Loki.EventTarget);
