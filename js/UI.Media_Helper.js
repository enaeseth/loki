/**
 * Provides utilities for dealing with embedded media.
 */
UI.Media_Helper = function Media_Helper(loki) {
	this.loki = loki;
	this.masseuse = (new UI.Media_Masseuse).init(loki);
};

// Media helper methods:
Util.OOP.mixin(UI.Media_Helper, {
	/**
	 * Inserts the given media element into the Loki editing document.
	 */
	insert: function insert_media(element, massage) {
		if (typeof(massage) == 'undefined')
			massage = true;
		
		var temp;
		
		if (typeof(element) == 'string') {
			temp = this.loki.document.createElement('DIV');
			temp.innerHTML = element;
			
			if (massage)
				this.masseuse.massage(temp.firstChild);
			
			element = temp.removeChild(temp.firstChild);
			temp = null;
		} else if (element.ownerDocument != this.loki.document) {
			element = Util.Document.import_node(this.loki.document, element,
				true);
			if (massage) {
				temp = this.loki.document.createElement('DIV');
				temp.appendChild(element);
				this.masseuse.massage(element);
				element = temp.removeChild(temp.firstChild);
			}
		}
		
		this.loki.focus();
		var selected = this.get_selected();
		if (selected) {
			selected.parentNode.replaceChild(element, selected);
		} else {
			var sel = Util.Selection.get_selection(this.loki.window);
			var range = Util.Range.create_range(sel);
			
			Util.Range.delete_contents(range);
			Util.Range.insert_node(range, element);
		}
		
		return element;
	},
	
	/**
	 * Returns the media element that is selected, or `null` if no media
	 * element is selected.
	 */
	get_selected: function get_selected_media() {
		return null;
	},
	
	/**
	 * Opens a media selection dialog.
	 */
	open_dialog: function open_media_dialog() {
		var dialog = new UI.Media_Dialog(this.loki, {
			default_source: 'reason',
			sources: {
				reason: {
					label: 'Carleton',
					url: 'media.json?_=' + Math.floor(new Date().getTime() / 1000),
					// url: '//eric.test.carleton.edu/test/media/media.php?site=122870'
				},
				
				youtube: {
					label: 'YouTube'
				}
			}
		});
		dialog.open();
		
		return dialog;
	},
	
	/**
	 * Resizes a media element to fit the given container dimensions.
	 */
	resize: function resize_media(media, width, height) {
		var cur_width = media.width;
		var cur_height = media.height;
		var ratio;
		
		var nested = Util.Node.find_children(media, 'OBJECT');
		Util.Array.for_each(nested, function(object) {
			resize_media(object, width, height);
		});
		
		if (cur_width <= width && cur_height <= height)
			return;
		
		// For rectangular (probably visual) elements, we want to resize them
		// in two dimensions, but for very skinny elements (e.g., an audio
		// player), we only want to resize in one dimension.
		if (cur_width / cur_height >= 8) {
			// resize width only
			if (cur_width > width)
				media.width = width;
		} else if (cur_height / cur_width >= 8) {
			// resize height only
			if (cur_height > height)
				media.height = height;
		} else {
			// resize proportionally
			
			if (cur_width > cur_height) {
				ratio = width / cur_width;
				if (ratio >= 1.0)
					return;
				
				media.width = width;
				media.height = cur_height * ratio;
			} else {
				ratio = height / cur_height;
				if (ratio >= 1.0)
					return;
				
				media.height = height;
				media.width = cur_width * ratio;
			}
		}
	},
	
	/**
	 * Checks to make sure that the given media embedding HTML is valid.
	 *
	 * This implementation will verify that the given HTML contains an object,
	 * video, audio, or img tag. Returns true if it does, false if otherwise.
	 */
	validate: function validate_embed_html(html) {
		var parser = new Util.HTML_Parser();
		var object_balance = 0;
		var initial = {tag: null, count: 0};
		
		var valid_tags = {object: true, video: true, audio: true, img: true};
		
		// do a simple check first to weed out obviously bad HTML
		// we want to avoid crashing when tags are incomplete
		
		function count_occurrences(c) {
			var count = 0;
			var pos = 0;
			
			while ((pos = html.indexOf(c, pos)) !== -1) {
				count++;
				pos++;
			}
			
			return count;
		}
		
		if (count_occurrences('<') != count_occurrences('>'))
			return false;
		
		// do the actual check
		
		parser.add_listener('open', function(tag, attributes) {
			tag = tag.toLowerCase();
			
			if (!initial.tag) {
				if (!(tag in valid_tags)) {
					parser.halt();
					return;
				}
				initial.tag = tag;
				initial.count = 1;
			} else if (initial.count == 0) {
				// stop if there are multiple elements at the root level
				parser.halt();
				initial.tag = null;
				return;
			} else if (tag == initial.tag) {
				initial.count++;
			}
			
			if (tag == 'object')
				object_balance++;
		});
		
		parser.add_listener('close', function(tag) {
			if (tag == initial.tag)
				initial.count--;
			
			if (tag == 'object')
				object_balance--;
		});
		
		try {
			parser.parse(html);
		} catch (e) {
			return false;
		}
		
		return !!(initial.tag && initial.count == 0 && object_balance == 0);
	}
});
