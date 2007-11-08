/**
 * @class Manages the collection of Loki's capabilities.
 */
UI.Capabilities = {
	sets: {
		all: []
	},
	abilities: {},
	
	_bundled_capabilities_added: false,
	
	/**
	 * Retrieves the capabilities requested by the given selector.
	 * @param {string} selector string
	 * @type array
	 * @return array of capabilities
	 */
	get: function(selector)
	{
		var working = {};
		var self = this;
		
		this._register_bundled();
		
		var operations = {
			'+': function(name) {
				if (name in self.sets) {
					self.sets[name].each(function (name) {
						working[name] = self.abilities[name];
					});
				} else if (name in self.abilities) {
					working[name] = self.abilities[name];
				} else {
					throw new Error('Unknown capability / set "' + name + '".');
				}
			},
			
			'-': function(name) {
				if (name in self.sets) {
					self.sets[name].each(function (name) {
						delete working[name];
					});
				} else if (name in self.abilities) {
					delete working[name];
				} else {
					throw new Error('Unknown capability / set "' + name + '".');
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
		
		var ret = [];
		for (var name in working) {
			ret.push(working[name]);
		}
		
		return ret;
	},
	
	/**
	 * Registers a capability.
	 * @param {string} the selectable name under which the capability will be
	 *   available
	 * @param {UI.Capability} the capability being registered
	 * @type void
	 */
	add: function(name, capability)
	{
		if (name in this.abilities && this.abilities[name] != capability) {
			throw new Error('A capability with the name "' + name + '" is ' +
				'already registered.');
		} else if (name in this.sets) {
			throw new Error('A set is registered under the name "' + name +
				'".');
		}
		
		this.abilities[name] = capability;
		this.sets.all.push(name);
	},
	
	/**
	 * Adds a new capability set, or adds new members to an existing set.
	 * @param {string} the set's name
	 * @param {array} the set's members
	 * @type void
	 */
	put_set: function(name, members)
	{
		if (name in this.abilities) {
			throw new Error('A capability is registered under the name "' +
				name + '".');
		}
		
		if (!this.sets[name])
			this.sets[name] = members.slice(0); // make a copy
		else
			this.sets[name].append(members);
	},
	
	/**
	 * Registers the capabilities that are bundled with Loki. This happens in
	 * this file to easily allow external scripts to figure out the list of
	 * bundled capabilities.
	 * @type void
	 */
	_register_bundled: function()
	{
		// WARNING: This function contains "magical" lines; specially-formatted
		//          lines that dumb external scripts can detect to create lists
		//          of bundled capabilities and/or sets. Do not edit them.
		//          Do not insert whitespace lines between matching ones.
		
		if (this._bundled_capabilities_added)
			return;
		
		// ----- BEGIN BUNDLED CAPABILITIES -----
		this.add('bold', UI.Bold_Capability);
		this.add('italic', UI.Italic_Capability);
		this.add('underline', UI.Underline_Capability);
		// ----- END BUNDLED CAPABILITIES -----
		
		// ----- BEGIN BUNDLED SETS -----
		this.put_set('default', ['bold', 'italic']);
		// ----- END BUNDLED SETS -----
		
		this._bundled_capabilities_added = true;
	}
};