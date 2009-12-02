UI.Component = function Component(handle, name, parts) {
	this.handle = handle;
	this.name = name;
	
	if (!parts)
		var parts = {};
	
	this.buttons = [];
	this.menugroups = [];
	this.keybindings = [];
	this.masseuses = [];
	this.double_click_listeners = [];
	this.event_handlers = {
		init: [],
		load: []
	};
	
	this._command_set_adders = [];
	
	function import_part(part) {
		var src = parts;
		var dest = this;
		
		var keys = part.split('.'), key;
		while (keys.length > 0) {
			key = keys.shift();
			if (key in src) {
				src = src[key];
				dest = dest[key]
			} else {
				return;
			}
		}
		
		Util.Array.append(dest, src);
	}
	
	var part_names = ['buttons', 'menugroups', 'keybindings', 'masseuses',
		'double_click_listeners', 'event_handlers.load'];
	
	Util.Array.for_each(part_names, import_part);
};

Util.OOP.mixin(UI.Component, {
	fire_event: function component_fire_event(event_name) {
		var args = Array.prototype.slice.call(arguments, 1);
		
		if (!(event_name in this.event_handlers)) {
			throw new Error('Unknown event name "' + event_name + '".');
		}
		
		var handlers = this.event_handlers[event_name];
		var component = this;
		Util.Array.for_each(handlers, function fire_event_to_handler(handler) {
			handler.apply(component, args);
		});
	},
	
	add_button: function component_add_button(button_class) {
		this.buttons.push(button_class);
		return this;
	},
	
	create_button: function component_create_button(image, title, listener) {
		function GeneratedButton() {
			Util.OOP.inherits(this, UI.Button);

			this.image = image;
			this.title = title;
			this.click_listener = function call_button_listener() {
				listener.call(this, this._loki);
			};
		}
		
		this.add_button(GeneratedButton);
		return GeneratedButton;
	},
	
	add_menugroup: function component_add_menugroup(group_class) {
		this.menugroups.push(group_class);
		return this;
	},
	
	add_keybinding: function component_add_keybinding(binding_class) {
		this.keybindings.push(binding_class);
		return this;
	},
	
	create_keybinding: function component_create_keybinding(test, action) {
		if (typeof(test) == 'string')
			test = UI.Keybinding.compile_test(test);
		
		function GeneratedKeybinding() {
			Util.OOP.inherits(this, UI.Keybinding);
			
			this.test = test;
			this.action = function call_keybound_action() {
				action.call(this, this._loki);
			};
		}
		
		this.add_keybinding(GeneratedKeybinding);
		return GeneratedKeybinding;
	},
	
	add_masseuse: function component_add_masseuse(masseuse_class) {
		this.masseuses.push(masseuse_class);
		return this;
	},
	
	create_masseuse: function component_make_masseuse(in_sel, out_sel, impl) {
		function GeneratedMasseuse() {}
		GeneratedMasseuse.prototype = new UI.Masseuse();
		
		Util.OOP.mixin(GeneratedMasseuse, {
			massage_node_descendants: function(node) {
				var matches = Util.Selector.query_all(node, in_sel);
				var start = matches.length - 1;
				for (i = start; i >= 0; i--) {
					this.massage(matches[i]);
				}
			},
			
			unmassage_node_descendants: function(node) {
				var matches = Util.Selector.query_all(node, out_sel);
				var start = matches.length - 1;
				for (i = start; i >= 0; i--) {
					this.massage(matches[i]);
				}
			}
		});
		
		if (!('massage' in impl && 'unmassage' in impl)) {
			if (!('get_real_elem' in impl && 'get_fake_elem' in impl)) {
				throw new Error('The masseuse implementation must provide ' +
					'either massage/unmassage or get_fake/real_elem methods.');
			}
			
			GeneratedMasseuse.prototype.massage = function(node) {
				var replacement = this.get_fake_elem(node);
				node.parentNode.replaceChild(replacement, node);
			};
			
			GeneratedMasseuse.prototype.unmassage = function(node) {
				var replacement = this.get_real_elem(node);
				node.parentNode.replaceChild(replacement, node);
			};
		}
		
		Util.OOP.mixin(GeneratedMasseuse, impl);
		return GeneratedMasseuse;
	},
	
	add_double_click: function component_add_double_click_listener(listener) {
		this.double_click_listeners.push(listener);
	},
	
	create_double_click: function component_create_double_click(action) {
		function GeneratedDoubleClickListener() {
			Util.OOP.inherits(this, UI.Double_Click);
			this.double_click = function call_double_click_action() {
				action.call(this, this._loki);
			};
		}
		
		this.add_double_click(GeneratedDoubleClickListener);
	},
	
	add_event_handler: function component_add_event_handler(event, action) {
		if (!(event in this.event_handlers)) {
			throw new Error('Unknown component event "' + event + '".');
		}
		
		this.event_handlers[event].push(action);
	},
	
	add_command_set: function component_add_command_set(name, definition) {
		var method;
		var adder;
		var method_args;
		var self;
		
		if (typeof(definition) == 'string') {
			method = 'create_' + definition + '_command_set';
			if (!(method in UI.Editing_Environment.prototype)) {
				throw Error('Unknown command set type "' + definition + '".');
			}
			
			method_args = [name];
			Util.Array.append(method_args,
				Array.prototype.slice.call(arguments, 2));
			adder = function add_special_command_set(env) {
				env[method].apply(env, method_args);
			};
		} else {
			adder = function add_normal_command_set(env) {
				Util.OOP.extend(env.command_set(name), definition);
			};
		}
		
		if (this._command_set_adders.length == 0) {
			self = this;
			function add_component_command_sets(editor) {
				Util.Array.for_each(self._command_set_adders, function(adder) {
					adder(editor.env);
				});
			}
			
			this.event_handlers.load.unshift(add_component_command_sets);
		}
		
		this._command_set_adders.push(adder);
	}
});
