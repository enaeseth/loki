Loki.add_component('heading headings headline headlines', 'default power',
function heading() {
	var heading = new UI.Component('heading', 'Headings');
	
	// The following creates a basic block-level command set that will toggle
	// the active block between an <h3> and a <p>. We extend that set to add
	// more fine-grained commands.
	heading.add_command_set('heading', 'block', 'h3');
	heading.add_command_set('heading', {
		get_level: function get_heading_level() {
			var block = this.env.query_command_value('FormatBlock');
			if (/^h\d$/.test(block)) {
				return Number(block.charAt(1));
			} else {
				// not within a heading
				return null;
			}
		},
		
		set_level: function set_heading_level(level) {
			if (/^h\d$/.test(level))
				level = level.charAt(1);
			
			var num_level = Number(level);
			if (isNaN(num_level) || num_level < 0 || num_level > 6) {
				throw new Error('"' + level + '" is not a valid heading ' +
					'level.');
			}
			
			this.env.exec_command('FormatBlock', '<h' + num_level + '>');
			this.editor.focus();
		},
		
		remove: function remove_heading() {
			this.env.exec_command('FormatBlock', '<p>');
			this.editor.focus();
		}
	});
	
	function toggle_heading(editor) {
		editor.env.heading.toggle();
	}
	
	heading.create_button('head.png', 'Heading', toggle_heading);
	heading.create_menugroup(function get_heading_menu_items(editor) {
		var env = editor.env;
		var level = env.heading.get_level();
		var options = [];
		
		function create_level_setter(desired_level) {
			return function _heading_menu_set_level() {
				env.heading.set_level(desired_level);
			}
		}
		
		if (level == null) {
			// not within any heading
			return options;
		} else if (level == 3) {
			options.push(UI.Menuitem.create('Change to minor heading (h4)',
				create_level_setter(4)));
		} else {
			options.push(UI.Menuitem.create('Change to major heading (h3)',
				create_level_setter(3)));
		}
		
		options.push(UI.Menuitem.create('Remove heading',
			function _heading_menu_remove() { env.heading.remove(); }));
		return options;
	});
	
	return heading;
});
