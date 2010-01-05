Loki.add_component('br linebreak linebreaks', 'default power', function br() {
	var br = new UI.Component('br', 'Line breaks');
	
	br.add_command_set('br', {
		insert: function insert_br() {
			var range = this.env.get_selected_range();
			var doc = this.editor.document;
			var line_break = doc.createElement('BR');
			var dest;
			
			if (Util.Browser.IE) {
				var sel = Util.Selection.get_selection(this.editor.window);
				Util.Selection.paste_node(sel, line_break);
				
			} else {
				Util.Range.delete_contents(range);
				Util.Range.insert_node(range, line_break);
			}
			
			dest = line_break.nextSibling;
			// WebKit requires *something* to be in a text node for it to be
			// selected, so we use the zero-width space (\u200b)
			if (!dest || dest.nodeType != Util.Node.TEXT_NODE) {
				dest = doc.createTextNode((Util.Browser.WebKit) ? '\u200b' :
					'');
				line_break.parentNode.appendChild(dest);
			} else if (dest.nodeType == Util.Node.TEXT_NODE) {
				if (Util.Browser.WebKit && dest.nodeValue.length == 0)
					dest.nodeValue = '\u200b';
			}
			
			if (!Util.Browser.IE) {
				Util.Range.select_node_contents(range, dest);
			} else {
				Util.Range.set_start(range, dest, 0);
			}
			range.collapse(true);
			
			Util.Selection.select_range(this.env.get_selection(), range);
			this.editor.focus();
		}
	});
	
	function insert_br(editor) {
		editor.env.br.insert();
	}
	
	br.create_button('break.png', 'Line break (Shift+Enter)', insert_br);
	br.create_keybinding('Shift Enter', insert_br);
	return br;
});
