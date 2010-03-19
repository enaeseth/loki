/**
 * Creates a tabset: a tabbed container of panels.
 *
 * The "document" parameter should be the document on which the tabset's
 * elements will be created. Tabset also accepts the following options:
 *   - id:  the desired ID of the root tabset element [default: (no ID)]
 *
 * Code that is using a Tabset can be notified about changes to the selected
 * tab by passing a function to the "add_select_listener" method.
 */
Util.Tabset = function Tabset(document, options) {
	this.document = document;
	this._d = new Util.Document(this.document);
	
	options = options || {};
	
	this._tabs = {};
	this._selected_tab = null;
	this._select_listeners = [];
	
	this.root = this.tabset_elem = this._d.create_element('div', {
		className: 'tabset'
	});
	if (options.id)
		this.root.id = options.id;
	
	var tabs_chunk = this._d.create_element('div', {className: 'tabs_chunk'});
	this._tab_list = tabs_chunk.appendChild(this._d.create_element('ul'));
	
	this._panel_container = this._d.create_element('div',
		{className: 'tabpanels_chunk'});
	
	this.root.appendChild(tabs_chunk);
	this.root.appendChild(this._panel_container);
};

// Tabset methods:
Util.OOP.mixin(Util.Tabset, {
	/**
	 * Adds a new tab to the tabset.
	 *
	 * The "name" of the tab is the handle by which Tabset user code identifies
	 * tabs, and the "label" is the readable text used on the clickable tab
	 * element.
	 *
	 * Returns the tab object. Callers are free to add their own properties
	 * to this object; they will persist.
	 */
	add_tab: function add_tab_to_tabset(name, label) {
		if (name in this._tabs) {
			throw new Error('A tab with name "' + name + '" has already ' +
				'been added to this tabset.');
		}
		
		var tab = {
			name: name,
			label: label,
			selector: this._d.create_element('li', {
				id: name + '_tab',
				className: 'tab_chunk'
			}, [this._d.create_element('a', {href: '#'}, [label])]),
			panel: this._d.create_element('div', {
				id: name + '_tabpanel',
				className: 'tabpanel_chunk'
			})
		};
		
		Util.Event.observe(tab.selector.firstChild, 'click', function() {
			this.select_tab(name);
		}, this);
		
		this._tab_list.appendChild(tab.selector);
		this._panel_container.appendChild(tab.panel);
		this._tabs[name] = tab;
		
		// If this is the first tab to be created, select it.
		if (!this._selected_tab) {
			this.select_tab(name);
		}
		
		return tab;
	},
	
	/**
	 * Returns the tab object that has the given "name".
	 *
	 * If there is no such tab, an exception will be raised.
	 */
	get_tab: function get_tab(name) {
		if (!(name in this._tabs))
			 throw new Error('No such tab: "' + name + '".');
		return this._tabs[name];
	},
	
	/**
	 * Returns the currently selected tab object.
	 *
	 * If no tab is currently selected (this should only happen if no tabs have
	 * been added), returns null.
	 */
	get_selected_tab: function get_selected_tab() {
		return this._selected_tab;
	},
	
	/**
	 * Returns the name of the currently selected tab.
	 *
	 * If no tab is currently selected (this should only happen if no tabs have
	 * been added), returns undefined.
	 */
	get_name_of_selected_tab: function get_name_of_selected_tab() {
		return (this._selected_tab) ? this._selected_tab.name : undefined;
	},
	
	/**
	 * Returns the panel element associated with the tab with the given "name".
	 *
	 * If there is no such tab, an exception will be raised.
	 */
	get_tabpanel_elem: function get_tab_panel_element(name) {
		return this.get_tab(name).panel;
	},
	
	/**
	 * Selects the tab with the given "name".
	 *
	 * If there is no such tab, an exception will be raised.
	 *
	 * Calling this method will cause all of the tabset's select listeners
	 * to fire.
	 */
	select_tab: function select_tab(name) {
		if (!(name in this._tabs))
			 throw new Error('No such tab: "' + name + '".');
		
		var previous_tab = this._selected_tab ?
			this._selected_tab.name : undefined;
		
		Util.Object.enumerate(this._tabs, function (name, tab) {
			Util.Element.remove_class(tab.selector, 'selected');
			Util.Element.remove_class(tab.panel, 'selected');
		});
		
		this._selected_tab = this._tabs[name];
		
		Util.Element.add_class(this._selected_tab.selector, 'selected');
		Util.Element.add_class(this._selected_tab.panel, 'selected');
		
		// Inform the selection listeners
		Util.Array.for_each(this._select_listeners, function(listener) {
			listener(previous_tab, name);
		});
	},
	
	/**
	 * Adds a tab selection listener function.
	 *
	 * Whenever a new tab is selected (either programatically or in response to
	 * user input), each listener function will be called with two arguments:
	 * the name of the previously-selected tab (or "undefined" if there was no
	 * previous selection), and the name of the newly-selected tab.
	 *
	 * Listener functions do not get the opportunity to cancel the new
	 * selection.
	 */
	add_select_listener: function add_tab_selection_listener(listener) {
		this._select_listeners.push(listener);
	}
});
