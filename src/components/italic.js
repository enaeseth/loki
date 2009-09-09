Loki.add_component('italic em', 'default power', function italic() {
	var italic = new UI.Component('italic', 'Italicized text');
	
	italic.add_command_set('italic', 'simple', 'Italic');
	
	function toggle_italic(editor) {
		editor.env.italic.toggle();
	}
	
	italic.create_button('em.png', 'Emphasis (Ctrl+I)', toggle_italic);
	italic.create_keybinding('Ctrl I', toggle_italic);
	
	italic.create_masseuse('em', 'i', {
		massage: function em_to_i(node) {
			var replacement = node.ownerDocument.createElement('I');
			while (node.firstChild) {
				replacement.appendChild(node.firstChild);
			}
			node.parentNode.replaceChild(replacement, node);
		},
		
		unmassage: function i_to_em(node) {
			var replacement = node.ownerDocument.createElement('EM');
			while (node.firstChild) {
				replacement.appendChild(node.firstChild);
			}
			node.parentNode.replaceChild(replacement, node);
		}
	});
	
	return italic;
});
