/**
 * Constructs a new menu.
 * @class A popup menu.
 *
 * XXX: In the current implementation, these menus are not very accesible.
 *      Namely, they cannot be navigated using the keyboard.
 * 
 * @constructor
 * @param {UI.Loki} the Loki instance for which this menu is being displayed
 * @param {string} the class/classes to apply to the overall menu
 * @author Eric Naeseth
 */
UI.Menu = function Menu(loki, style_classes)
{
	this.loki = loki;
	
	this.supermenu = null;
	var active_child = null;
	
	if (!style_classes)
		var style_classes = '';
		
	var groups = [];
	var element = null;
	
	var context_helpers = null;
	
	/**
	 * Creates a new menu group to which items can be added.
	 * @param {string} group's title (optional)
	 * @type UI.Menu.Group
	 * @return the new menu group
	 */
	this.add_group = function add_group(title)
	{
		var group = new UI.Menu.Group(title || null);
		groups.push(group);
		return group;
	}
	
	/**
	 * Clears the menu.
	 * @type void
	 */
	this.clear = function clear()
	{
		groups = [];
	}
	
	/**
	 * Displays the menu on the given document at the given position.
	 * @param {HTMLDocument} the document on which to display the menu
	 * @param {integer} the x coordinate at which to display the menu
	 * @param {integer} the y coordinate at which to display the menu
	 * @type void
	 */
	this.show = function show(doc, x, y)
	{
		var parent = arguments[3] || null;
		var dh = new Util.Document(doc);
		
		var menu = dh.create_element('div', {
			className: style_classes,
			style: {
				position: 'absolute',
				left: x,
				top: y
			}
		});
		
		var first_group = true;
		
		groups.each(function (group) {
			if (group.item_count() == 0)
				return;
				
			if (first_group) {
				first_group = false;
			} else {
				menu.appendChild(dh.create_element, 'hr');
			}
			
			if (group.title) {
				menu.appendChild(dh.create_element('h3', {}, group.title));
			}
			
			var ul = dh.create_element('ul');
			group.get_items().each(function (item) {
				var li = dh.create_element('li');
				ul.appendChild(li);
				
				item.insert(li);
			});
			
			menu.appendChild(ul);
		});
		
		doc.body.appendChild(menu);
	}
	
	/**
	 * Hides the menu.
	 * @type void
	 */
	this.hide = function hide()
	{
		if (!this.element)
			return;
		
		if (this.element.parentNode)
			this.element.parentNode.removeChild(this.element);
		
		this.element = null;
	}
	
	
	
	/**
	 * Adds this menu as a contextual menu on the given document.
	 * @type void
	 */
	this.use_as_contextual = function use_as_contextual(doc, on_show, on_hide)
	{
		var menu = this;
		
		function display_context()
		{
			if (on_show) {
				if (!on_show(menu))
					return;
			}
			
			var event = arguments[0] || window.event;

			var x = event.pageX || event.clientX + doc.body.scrollLeft +
				doc.documentElement.scrollLeft;
			var y = event.pageY || event.clientY + doc.body.scrollTop +
				doc.documentElement.scrollTop;

			menu.show(doc, x, y);
			
			Util.Event.prevent_default(event);
		}

		function hide_context()
		{
			if (on_hide)
				on_hide(menu);
			menu.hide();
		}
		
		Util.Element.add_event_listener(doc, 'contextmenu', display_context);
		Util.Element.add_event_listener(doc, 'click', hide_context);
	}
}

/**
 * Constructs a new menu group.
 * @class An optionally-titled grouping of menu items.
 * @constructor
 * @param {string} the group's title (optional)
 * @author Eric Naeseth
 */
UI.Menu.Group = function MenuGroup(title)
{
	var items = [];
	this.title = title || null;
	
	function check_item_validity(item)
	{
		if (typeof(item.insert) != 'function') {
			throw new TypeError('The toolbar item must provide an insert ' +
				'method.');
		}
	}
	
	/**
	 * Adds an item to the menu. There are many menu item classes available,
	 * but the only requirement of the provided object is that it provide an
	 * "insert" method (see UI.Menu.Item for how this should work).
	 * @param {object} the menu item
	 * @type object
	 * @return the menu item that was added
	 * @throws TypeError if the menu item has no insert method
	 */
	this.add_item = function add_item(item)
	{
		check_item_validity(item);
		items.push(item);
		return item;
	}
	
	/**
	 * Inserts an item in the menu at the given position.
	 * @param {object} the menu item
	 * @type object
	 * @return the menu item that was added
	 * @throws TypeError if the menu item has no insert method
	 */
	this.insert_item = function insert_item(item, index)
	{
		check_item_validity(item);
		items.splice(index, 0, item);
		return item;
	}
	
	/**
	 * Removes an item from the menu.
	 * @param {object} the menu item
	 * @type boolean
	 * @return true if the item was removed, false if otherwise
	 */
	this.remove_item = function remove_item(item)
	{
		return items.remove(item);
	}
	
	/**
	 * @type integer
	 */
	this.item_count = function item_count()
	{
		return items.length;
	}
	
	/**
	 * @type array
	 */
	this.get_items = function get_items()
	{
		return items;
	}
}

UI.Menu.STATE_OFF = 0;
UI.Menu.STATE_ON = 1;
UI.Menu.STATE_MIXED = -1;

/**
 * Constructs a new menu item.
 * @class A menu item.
 * @constructor
 * @param {string}		title	the menu item's title
 * @param {function}	action	the function to be called on click
 */
UI.Menu.Item = function MenuItem(title, action)
{
	var options = arguments[2] || {};
	
	this.title = title;
	
	if (typeof(action) == 'object') {
		this.action = action[0] || action.method;
		this.target = action[1] || action.target || options.target || null;
	} else {
		this.action = action || Util.Function.empty;
		this.target = options.target || null;
	}
	
	this.enabled = (typeof(options.enabled) != 'undefined')
		? !!options.enabled
		: true;
	this.state = 	(typeof(options.enabled) != 'undefined')
			? options.state
			: UI.Menu.STATE_OFF;
	this.submenu = options.submenu || null;
	
	this.menu = null;
	this.group = null;
	
	/**
	 * Inserts the menu item into a container.
	 * @param {UI.Menu}			menu
	 * @param {UI.Menu.Group}	group
	 * @param {HTMLLIElement}	container	the list item
	 * @type void
	 */
	this.insert = function insert(menu, group, container)
	{
		this.menu = menu;
		this.group = group;
		
		switch (this.state) {
			case UI.Menu.STATE_ON:
				Util.Element.add_class(container, 'on');
				break;
			case UI.Menu.STATE_MIXED:
				Util.Element.add_class(container, 'mixed');
		}
		
		var link = Util.Document.create_element(container.ownerDocument,
			'a', {className: (this.submenu ? 'has_sub' : '')}, [this.title]);
		container.appendChild(link);
	}
}