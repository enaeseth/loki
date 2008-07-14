/**
 * Constructs a new chooser.
 * @class Allows items and sets of those items to be easily chosen using
 * a simple string selector.
 * @constructor
 * @author Eric Naeseth
 */
Util.Chooser = function Chooser()
{
	this.sets = {
		all: []
	};
	
	this.items = {};
	
	var bundled_added = false;
	
	/**
	 * Retrieves the items requested by the given selector.
	 * @param {string} selector string
	 * @type array
	 * @return array of items
	 */
	this.get = function get_from_chooser(selector)
	{
		var working = {};
		var self = this;
		
		if (!bundled_added && Util.is_function(this._add_bundled)) {
			bundled_added = true;
			this._add_bundled();
		}
		
		var operations = {
			'+': function(name) {
				if (name in self.sets) {
					self.sets[name].each(function (name) {
						working[name] = self.items[name];
					});
				} else if (name in self.items) {
					working[name] = self.items[name];
				} else {
					throw new Error('Unknown item or set "' + name + '".');
				}
			},
			
			'-': function(name) {
				if (name in self.sets) {
					self.sets[name].each(function (name) {
						delete working[name];
					});
				} else if (name in self.items) {
					delete working[name];
				} else {
					throw new Error('Unknown item or set "' + name + '".');
				}
			}
		};
		
		var operation = operations['+'];
		var part_pattern = /([+-])?\s*(\w+)/;
		
		(selector || 'default').match(/([+-])?\s*(\w+)/g).each(function(part) {
			var breakdown = part.match(part_pattern);
			if (!breakdown) {
				throw new Error('Invalid selector component "' + part + '".');
			}
			
			if (breakdown[1]) {
				operation = operations[breakdown[1]];
				if (!operation) {
					throw new Error('Invalid operator "' + breakdown[1] + '".');
				}
			}
			
			operation(breakdown[2]);
		});
		
		return working;
	}
	
	/**
	 * Registers an item.
	 * @param {string} the selectable name under which the item will be
	 *   available
	 * @param {mixed} the item being registered
	 * @return the registered item
	 * @type mixed
	 */
	this.add = function add_item_to_chooser(name, item)
	{
		if (name in this.items) {
			if (this.items[name] == item)
				return item;
			throw new Error('An item with the name "' + name + '" is ' +
				'already registered.');
		} else if (name in this.sets) {
			throw new Error('A set is registered under the name "' + name +
				'".');
		}
		
		this.items[name] = item;
		this.sets.all.push(name);
		
		return item;
	}
	
	/**
	 * Adds a new set, or adds new members to an existing set.
	 * @param {string} the set's name
	 * @param {array} the set's members
	 * @type void
	 */
	this.put_set = function put_set_into_chooser(name, members)
	{
		if (name in this.items) {
			throw new Error('An item is registered under the name "' +
				name + '"; cannot create a set with the same name.');
		}
		
		if (!this.sets[name])
			this.sets[name] = members.slice(0); // make a copy
		else
			this.sets[name].append(members);
	}
}