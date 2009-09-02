/**
 * Creates a new editing environment.
 * @constructor
 *
 * @class A framework for accessing, creating, removing, and modifying editable
 *        elements in the Loki document.
 */
UI.Editing_Environment = function EditingEnvironment(editor) {
	this.editor = editor;
	this._sets = {};
	
	var body = editor.body;
	var self = this;
	
	// Keep track of the current selection and selection range. This seems to
	// be required for us to be able to get the currently-selected range out
	// of WebKit.
	function update_selection() {
		try {
			self._selection = Util.Selection.get_selection(editor.window);
			self._selected_range = (self._selection) ?
				Util.Range.create_range(self._selection) :
				null;
		} catch (e) {
			if (e.name == 'Util.Unsupported_Error') {
				return;
			}
			throw e;
		}
	}
	
	Util.Event.observe(body, 'mouseup', update_selection);
	Util.Event.observe(editor.window, 'keyup', update_selection);
	Util.Event.observe(editor.window, 'focus', update_selection);
};

Util.OOP.mixin(UI.Editing_Environment, {
	get_selection: function env_get_selection() {
		return this._selection;
	},
	
	get_selected_range: function env_get_selected_range() {
		return this._selected_range;
	},
	
	find_nodes: function env_find_nodes(matcher, up, allow_fake) {
		var range = this.get_selected_range();
		if (!range)
			return [];
		
		if (typeof(matcher) == 'string' && !allow_fake) {
			matcher = function is_of_tag(node) {
				return (Util.Node.is_tag(node) &&
					!node.getAttribute('loki:fake'));
			};
		}
		
		return (range) ? Util.Range.find_nodes(range, matcher, up) : [];
	},
	
	exec_command: function env_exec_browser_command(command, value) {
		return this.editor.document.execCommand(command, false, value);
	},
	
	query_command_state: function env_query_browser_command_state(command) {
		return this.editor.document.queryCommandState(command);
	},
	
	query_command_value: function env_query_browser_command_value(command) {
		var value = this.editor.document.queryCommandValue(command);
		var env = this;
		
		function get_selection_ancestry() {
			env.editor.window.focus();
			var range = env.get_selected_range();
			var ancestor = Util.Range.get_common_ancestor(range);

			var ancestry = [];
			var node;
			for (node = ancestor; node; node = node.parentNode) {
				if (node.nodeType == Util.Node.ELEMENT_NODE)
					ancestry.push(node.nodeName.toLowerCase());
			}

			return ancestry;
		}
		
		if (command == 'FormatBlock') {
			// Internet Explorer returns Word-esque values for this command;
			// translate them into the values used by other browsers.
			var ie_value_translations = {
				'Normal': 'p',
				'Formatted': 'pre',
				'Heading 1': 'h1',
				'Heading 2': 'h2',
				'Heading 3': 'h3',
				'Heading 4': 'h4',
				'Heading 5': 'h5',
				'Heading 6': 'h6',
				'Preformatted': 'pre',
				'Address': 'address'
			};
			
			if (value === false) {
				// WebKit doesn't appear to implement querying FormatBlock,
				// so we'll do it ourselves.
				var ancestry = get_selection_ancestry();
				value = Util.Array.find(ancestry, function(value) {
					var key;
					for (key in ie_value_translations) {
						if (ie_value_translations[key] == value)
							 return true;
					}
				});
			} else if (value in ie_value_translations) {
				value = ie_value_translations[value];
			}
		}
		
		return value;
	},
	
	command_set: function env_get_command_set(name) {
		if (name in this._sets) {
			return this._sets[name];
		} else if (name in this) {
			// creating a command set with the given name would overwrite
			// something on the Editing_Environment object
			throw Error('"' + name + '" is not a valid name for an editing ' +
				'command set.');
		}
		
		var command_set = {
			editor: this.editor,
			env: this
		};
		
		this._sets[name] = this[name] = command_set;
		return command_set;
	},
	
	create_simple_command_set: function env_create_simple_set(name, command) {
		if (name in this._sets) {
			throw Error('There is already a command set named "' + name +
				'".');
		}
		
		var command_set = this.command_set(name);
		var undefined;
		
		command_set.active = function is_simple_command_active() {
			return this.editor.document.queryCommandState(command);
		};
		
		command_set.toggle = function toggle_simple_command() {
			return this.editor.document.exec(command, false, undefined);
		};
	},
	
	create_block_command_set: function env_create_block_set(name, tag) {
		if (name in this._sets) {
			throw Error('There is already a command set named "' + name +
				'".');
		}
		
		var command_set = this.command_set(name);
		var tag_value = '<' + tag + '>';
		
		command_set.active = function is_within_block() {
			return (this.env.query_command_value('FormatBlock') == tag);
		};
		
		command_set.toggle = function toggle_block() {
			var value = (this.active()) ? '<p>' : tag_value;
			this.env.exec_command('FormatBlock', value);
		};
	}
});
