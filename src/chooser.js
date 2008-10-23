// Class: Loki.Chooser
// Facilitates convenient "choosing" of named items using a simple selector
// string. The items can be grouped into sets, which can be referred to in
// the selector as if they were individual items. The chooser automatically
// maintains a special set named "all" which contains all items that have been
// added to the chooser. 
Loki.Chooser = Loki.Class.create({
	// Constructor: Chooser
	// Creates a new chooser.
	//
	// Parameters:
	//     (Object) items - the initial set of items to choose from
	//     (Object) sets - the sets of items to choose from: the keys of this
	//                     object should be names of sets and the value should
	//                     be an array consisting of the names of its members
	initialize: function Chooser(items, sets) {
		this.items = items || {};
		this.sets = sets || {};
		this.sets.all = Loki.Object.keys(this.items);
		this.aliases = {};
	},
	
	// Method: get
	// Selects items from the chooser. Unless the _lenient_ parameter is set to
	// true, an exception will be raised if a requested item is not found. If
	// you just need the names of the items that a selector string selects, use
	// <Loki.Chooser.resolveSelector>.
	//
	// Parameters:
	//     (String) selector - the selector string; see below for the format
	//     (Boolean) [lenient=false] - if true, no exceptions will be raised if
	//                                 any requested items are not found
	//
	// Returns:
	//     (Object) - The requested items: the keys are the natural names of the
	//              chosen items (i.e., even if an item is chosen by one of its
	//              aliases, the key will be the item's real name), and the
	//              values are the items themselves
	//
	// Selector format:
	//     Items are retrieved from a chooser by using a selector string, which
	//     is formed as a simple arithmetic expression. Sets and items are added
	//     to and subtracted from one another. Some examples:
	//
	//     "foo + bar + baz" - selects foo, bar, and baz
	//     "foo bar baz" - selects foo, bar, and baz (the default operator is +)
	//     "all-foo-bar" - selects everything in "all" (which is a set)
	//                     except for foo and bar (whitespace is optional around
	//                     operators)
	//     "all-foo bar" - same as above (if an operator is omitted, the
	//                       previous one is used again)
	//
	// Throws:
	//     NameError - if a requested set or item could not be found, and the
	//                 _lenient_ parameter was not set to a true value
	//     SyntaxError - if the selector string is invalid
	get: function get_from_chooser(selector, lenient) {
		var include_unknown_names = !lenient;
		var names = this.resolveSelector(selector, include_unknown_names);
		var i;
		var items = {};
		
		base2.forEach(names, function(name) {
			var item = this.items[name];
			if (typeof(item) == "undefined") {
				// this would only happen if we included unknown names, which
				// only happens if lenient == false
				throw Loki.error("NameError", "chooser:unknown name",
					name);
			}
			items[name] = item;
		}, this);
		
		return items;
	},
	
	// Method: resolveSelector
	// Resolves a selector string into the individual items that it selects.
	// The format of selector strings is described at <Loki.Chooser.get>.
	//
	// Parameters:
	//     (String) selector - the selector string
	//     (Boolean) [include_unknown=false] - if true, unknown items will be
	//               included in the returned array; if false, they will not be
	//
	// Returns:
	//     (String[]) - the array of desired items
	//
	// Throws:
	//     SyntaxError - if the selector string is invalid
	resolveSelector: function resolve_selector(selector, include_unknown) {
		// Find a canonical name; i.e., resolve any aliases to their real names.
		var items = {};
		var self = this;
		
		function dealias(name) {
			var dealised;
			while ((dealised = self.aliases[name])) {
				name = dealised;
			}
			return name;
		}
		
		var operations = {
			'+': function add(name) {
				name = dealias(name);
				var set = self.sets[name];
				if (set) {
					base2.forEach(set, add);
				} else if (include_unknown || name in self.items) {
					items[name] = true;
				}
			},
			
			'-': function subtract(name) {
				name = dealias(name);
				var set = self.sets[name];
				if (set) {
					base2.forEach(set, subtract);
				} else {
					delete items[name];
				}
			}
		};
		
		var operation = operations['+'];
		var part_pattern = /([+\-])?\s*(\w+)/;
		
		var parts = (selector || 'default').match(/([+\-])?\s*(\w+)/g);
		base2.forEach(parts, function process_selector_part(part) {
			var breakdown = part.match(part_pattern);
			if (!breakdown) {
				throw Loki.error('SyntaxError',
					'chooser:invalid selector component', part);
			}
			
			if (breakdown[1]) {
				operation = operations[breakdown[1]];
				if (!operation) {
					throw Loki.error('SyntaxError', 'chooser:invalid operator',
						breakdown[1]);
				}
			}
			
			operation(breakdown[2]);
		}, this);
		
		return Loki.Object.keys(items);
	},
	
	// Method: add
	// Adds an item to the chooser. (To create or add items to a set, see
	// <Loki.Chooser.putSet>.)
	//
	// Parameters:
	//     (String) name - the name of the item
	//     (any) item - the item being added under the name
	//
	// Returns:
	//     (Loki.Chooser) - this chooser
	//
	// Throws:
	//     ConflictError - if an item or set is already registered under the
	//                     given name
	add: function add_to_chooser(name, item) {
		if (name in this.items) {
			if (this.items[name] === item) {
				return this;
			}
			throw Loki.error('ConflictError', 'chooser:item exists', name);
		} else if (name in this.aliases) {
			throw Loki.error('ConflictError',
				'chooser:item would conflict with alias', name);
		} else if (name in this.sets) {
			throw Loki.error('ConflictError',
				'chooser:item would conflict with set', name);
		}
		
		this.items[name] = item;
		this.sets.all.push(name);
		
		return this;
	},
	
	// Method: alias
	// Makes an item or a set available under another name.
	//
	// Parameters:
	//     (String) actual - the name of the item being aliased
	//     (String) alias - the new name under which the item will be available
	// 
	// Throws:
	//     ConflictError - if an item or set has the same name as the alias
	//
	// Returns:
	//     (Loki.Chooser) - this chooser
	alias: function chooser_create_alias(actual, alias) {
		if (alias in this.items) {
			throw Loki.error('ConflictError',
				'chooser:alias would conflict with item', alias);
		} else if (alias in this.sets) {
			throw Loki.error('ConflictError',
				'chooser:alias would conflict with set', alias);
		}
		
		this.aliases[alias] = actual;
		return this;
	},
	
	// Method: putSet
	// Adds a new set, or adds items to an existing set.
	//
	// Parameters:
	//     (String) name - the name of the set
	//     (String[]) members - the names of the members to add to the set
	//
	// Returns:
	//     (Loki.Chooser) - this chooser
	//
	// Throws:
	//     ConflictError - if an item or an alias already exists with that name
	putSet: function chooser_put_set(name, members) {
		if (name in this.items) {
			throw Loki.error('ConflictError',
				'chooser:set would conflict with item', name);
		} else if (name in this.aliases) {
			throw Loki.error('ConflictError',
				'chooser:set would conflict with alias', name);
		}
		
		var set = this.sets[name];
		if (!set) {
			set = this.sets[name] = [];
		}
		
		base2.forEach(members, function add_member(member) {
			set.push(member);
		});
		
		return this;
	}
});
