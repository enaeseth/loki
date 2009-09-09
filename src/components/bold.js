Loki.add_component('bold strong', 'default power', function bold() {
	var bold = new UI.Component('bold', 'Bold text');
	
	bold.add_command_set('bold', 'simple', 'Bold');
	
	function toggle_bold(editor) {
		editor.env.bold.toggle();
	}
	
	bold.create_button('strong.png', 'Strong (Ctrl+B)', toggle_bold);
	bold.create_keybinding('Ctrl B', toggle_bold);
	
	bold.create_masseuse('strong', 'b', {
		massage: function strong_to_b(node) {
			var replacement = node.ownerDocument.createElement('B');
			while (node.firstChild) {
				replacement.appendChild(node.firstChild);
			}
			node.parentNode.replaceChild(replacement, node);
		},
		
		unmassage: function b_to_strong(node) {
			var replacement = node.ownerDocument.createElement('STRONG');
			while (node.firstChild) {
				replacement.appendChild(node.firstChild);
			}
			node.parentNode.replaceChild(replacement, node);
		}
	});
	
	return bold;
});
