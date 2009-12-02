Loki.add_component('pre', 'power', function preformatted() {
	var pre = new UI.Component('pre', 'Preformatted text');
	
	pre.add_command_set('pre', 'block', 'pre');
	
	function toggle_pre(editor) {
		editor.env.pre.toggle();
	}
	
	pre.create_button('pre.png', 'Preformatted', toggle_pre);
	
	return pre;
});
