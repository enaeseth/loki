// Class: Loki.UI.Toolbar
// A toolbar. Extends <Loki.UI.Widget>.
Loki.UI.Toolbar = Loki.Class.create(Loki.UI.Widget, {
	initialize: function Toolbar(class_name) {
		Toolbar.superclass.call(this);
		
		this.items = [];
		this.document = null;
		this.container = null;
		this.className = class_name || "toolbar";
	},
	
	create: function create_toolbar(document) {
		if (this.container)
			return this.container;
		
		this.document = document;
		this.container = document.createElement("UL");
		this.container.className = this.className;
		
		base2.forEach(this.items, this._appendItem, this);
		
		return this.container;
	},
	
	// Method: addItem
	// Adds an item to the toolbar.
	//
	// Parameters:
	//     (Loki.UI.ToolbarItem) item - the toolbar item to add
	addItem: function toolbar_add_item(item) {
		if (item.toolbar) {
			if (item.toolbar === this) {
				// already added to me
				return;
			} else {
				throw Loki.error("ArgumentError",
					"toolbar:item already added");
			}
		}
		
		item.toolbar = this;
		if (this.container)
			this._appendItem(item);
	},
	
	_appendItem: function _toolbar_append_item(item) {
		var li = this.document.createElement("LI");
		li.appendChild(item.create(this.document));
		this.container.appendChild(li);
	}
});

// Class: Loki.UI.ToolbarItem
// Base class for all items that can appear in a toolbar.
// Extends <Loki.UI.Widget>.
Loki.UI.ToolbarItem = Loki.Class.create(Loki.UI.Widget, {
	// var: (Loki.UI.Toolbar) toolbar
	// The toolbar to which this item is attached, or null if there is no
	// such toolbar.
	toolbar: null,
	
	_enabled: true,
	
	// Constructor: ToolbarItem
	// Creates a new toolbar item.
	initialize: function ToolbarItem() {
		ToolbarItem.superclass.call(this);
	},
	
	// Method: isEnabled
	// Returns true if the toolbar item is enabled, false if otherwise.
	//
	// Returns:
	//     (Boolean) - true if the toolbar item is enabled, false if otherwise
	isEnabled: function item_is_enabled() {
		return this._enabled;
	},
	
	// Method: setEnabled
	// Sets the enabled/disabled status of the toolbar item.
	//
	// Parameters:
	//     (Boolean) value - if true, the item will be enabled; if false, it
	//                       will be disabled
	setEnabled: function item_set_enabled(value) {
		if (value == this._enabled)
			return;
		
		this._enabled = value;
		if (value) {
			this.dispatchEvent("enable");
			if (typeof(this._enable) == "function")
				this._enable();
		} else {
			this.dispatchEvent("enable");
			if (typeof(this._disable) == "function")
				this._disable();
		}
	}
});

// Class: Loki.UI.ToolbarButton
// A toolbar button. Extends <Loki.UI.ToolbarItem>.
Loki.UI.ToolbarButton = Loki.Class.create(Loki.UI.ToolbarItem, {
	image: null,
	title: null,
	
	autofocus: true,
	changesContext: true,
	
	_active: false,
	
	// Constructor: ToolbarButton
	// Creates a new toolbar button.
	//
	// Parameters:
	//     (String) image - the image to display in the button
	//     (String) title - the tooltip and alternate text to display
	initialize: function ToolbarButton(image, title) {
		ToolbarButton.superclass.call(this);
		
		this.image = image;
		this.title = title;
	}
	
	
});
