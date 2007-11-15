/**
 * @class A toolbar for the display of functions of the Loki editor.
 * @author Eric Naeseth
 * @constructor
 * @param	{UI.Loki}	loki	the Loki instance that the toolbar will control
 */
UI.Toolbar = function(loki)
{
	this.loki = loki;
	this.document = loki.owner_document;
	
	// Document helper
	var dh = new Util.Document(this.document);
	
	var toolbar_class = loki.settings.toolbar_class || 'toolbar';
	
	// The unordered list holding the toolbar components.
	var list = dh.create_element('ul', {className: toolbar_class});
	// The list of toolbar items.
	var items = [];
	
	/**
	 * Adds an item to the end of the toolbar.
	 * @param	{UI.Toolbar.Item}	item	Item to add
	 * @type void
	 */
	this.add_item = function add_item(item)
	{
		if (item.toolbar) {
			if (item.toolbar === this) {
				// already added to me
				return;
			} else {
				throw new UI.Toolbar.Error('The toolbar item has already ' +
					'been added to another toolbar.');
			}
		}
		
		item.toolbar = this;
		var li = dh.create_element('li');
		item.insert(li);
		list.appendChild(li);
		
		items.push(item);
	}
	
	/**
	 * Gets the root toolbar element.
	 * @type HTMLULElement
	 */
	this.get_element = function get_element()
	{
		return list;
	}
}

/**
 * @class The exception type for toolbar-related exceptions
 * @author Eric Naeseth
 * @constructor
 */
UI.Toolbar.Error = function(message)
{
	Util.OOP.inherits(this, Error, message);
}

/**
 * @class The base class for all toolbar items.
 * @author Eric Naeseth
 * @constructor
 */
UI.Toolbar.Item = function()
{
	Util.OOP.mixin(this, UI.Event_Target);
	
	/**
	 * The toolbar to which this item is assigned.
	 * @type UI.Toolbar
	 */
	this.toolbar = null;
	
	/**
	 * Whether or not the item is enabled.
	 * @type boolean
	 * @private
	 */
	this._enabled = true;
	
	/**
	 * Called by the toolbar to have the item add itself to a container.
	 * @param	{HTMLDocument}	document on which the toolbar exists
	 * @param	{Util.Document}	document helper for the toolbar's document
	 * @param	{HTMLLIElement}	list item to add the item to
	 */
	this.insert = function(doc, dh, container)
	{
		if (this.content) {
			container.appendChild(this.content);
		} else {
			throw new UI.Toolbar.Error('Either UI.Toolbar.Item.insert must be' +
				' overridden or the Item must have a content property.');
		}
	}
	
	/**
	 * Returns true if the item is enabled, false otherwise.
	 * @type boolean
	 */
	function is_enabled()
	{
		return this._enabled;
	}
	
	/**
	 * Sets whether or not the item is enabled.
	 * @param {boolean}	New value
	 */
	function set_enabled(value)
	{
		if (value == this._enabled)
			return;
		
		this._enabled = value;
		if (this._enabled && this._enable)
			this._enable();
		else if (!this._enabled && this._disable)
			this._disable();
	}
}

/**
 * @class A toolbar separator.
 * @author Eric Naeseth
 * @constructor
 * @extends UI.Toolbar.Item
 */
UI.Toolbar.Separator = function()
{
	Util.OOP.inherits(this, UI.Toolbar.Item);
	
	// TODO: write this
	throw new Error('Not yet implemented!');
}

/**
 * @class A toolbar button.
 * @author Eric Naeseth
 * @constructor
 * @extends UI.Toolbar.Item
 * @param {string}	Name of the toolbar button's image
 * @param {string}	Tooltip title and alternate text to display
 * @param {function}	Initial click listener (default: none)
 */
UI.Toolbar.Button = function(image, title, on_click, enabled)
{
	Util.OOP.inherits(this, UI.Toolbar.Item);
	
	this.image = image;
	this.title = title;
	
	if (on_click) {
		this.add_event_listener('click', on_click);
	}
	
	var wrapper = null;
	var image = null;
	
	this.insert = function(doc, dh, container)
	{
		image = dh.create_element('img', {
			src: this.toolbar.loki.settings.base_uri + 'images/nav/' +
				this.image,
			title: this.title,
			alt: this.title,
			unselectable: 'on'
		});
		
		wrapper = dh.create_element('a', {className: 'button'},
			[image]);
			
		Util.Event.add_event_listener(wrapper, 'click', function (e) {
			var event = e || window.event;
			if (this.enabled)
				this.dispatch_event(new UI.Event('click'));
			return Util.Event.prevent_default(event);
		}, true);
		
		container.appendChild(wrapper);
	}
	
	this._enable = function()
	{
		Util.Element.remove_class(wrapper, 'disabled');
	}
	
	this._disable = function()
	{
		Util.Element.add_class(wrapper, 'disabled');
	}
}

/**
 * @class A toolbar dropdown menu.
 * @author Eric Naeseth
 * @constructor
 * @extends UI.Toolbar.Item
 */
UI.Toolbar.Menu = function()
{
	Util.OOP.inherits(this, UI.Toolbar.Item);
	
	// TODO: write this
	throw new Error('Not yet implemented!');
}