Loki.add_component('underline', [], function underline() {
	var underline = new UI.Component('underline', 'Underlined text');
	
	underline.add_command_set('underline', 'simple', 'Underline');
	
	function toggle_underline(editor) {
		editor.env.underline.toggle();
	}
	
	underline.create_button('underline.png', 'Underline (Ctrl+U)',
		toggle_underline);
	underline.create_keybinding('Ctrl U', toggle_underline);
	
	return underline;
});
