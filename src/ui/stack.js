// Class: Loki.UI.Stack
// A simple container that arranges its elements vertically.
Loki.UI.Stack = Loki.Class.create(Loki.UI.Container, {
	// Constructor: Stack
	// Creates a new stack.
	//
	// Parameters:
	//     (String) [root_selector="div.stack"] - a CSS selector that describes
	//              the tag name and attributes of the stack's root element
	//     (Array) [widgets=null] - widgets to add initially
	initialize: function Stack(root_selector, widgets) {
		Stack.superclass.call(this);
		this._root_sel = root_selector || 'div.stack';
		
		if (widgets) {
			base2.forEach(widgets, function(widget) {
				if (widget.widget)
					this._addMember(widget);
				else
					this.add(widget);
			}, this);
		}
	},
	
	_createRoot: function _create_stack_root(document) {
		return Loki.Misc.CSS.elementFromSelector(document, this._root_sel);
	},
	
	_getMemberSelector: function _get_stack_member_selector() {
		return 'div.stackitem';
	}
});
