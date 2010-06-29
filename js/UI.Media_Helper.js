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
		var selected = this.get_selected(true);
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
	 *
	 * If the `placeholder` argument is true, return the media's placeholder
	 * element instead of the preserved actual media element.
	 */
	get_selected: function get_selected_media(placeholder) {
		var sel = Util.Selection.get_selection(this.loki.window);
		var rng = Util.Range.create_range(sel);
		
		var elements;
		var placeholder_element;
		var original;
		
		function is_media_placeholder(node) {
			if (!Util.Node.is_tag(node, 'IMG'))
				return false;
			
			return Util.Element.has_class(node,
				UI.Media_Masseuse.placeholder_class);
		}
		
		elements = Util.Range.find_nodes(rng, is_media_placeholder, true);
		
		if (!elements || !elements.length) {
			return null;
		} else if (elements.length > 1) {
			throw new UI.Multiple_Items_Error('Multiple media elements are ' +
				'currently selected.');
		}
		
		placeholder_element = elements[0];
		return (placeholder) ?
			placeholder_element :
			this.masseuse.get_original_element(placeholder_element) || null;
	},
	
	/**
	 * Opens a media selection dialog.
	 */
	open_dialog: function open_media_dialog(element) {
		var sources = this.loki.settings.media_sources || {};
		var default_source = this.loki.settings.default_media_source;
		
		if (!default_source) {
			var names = Util.Object.names(sources);
			if (names.length)
				default_source = names[0];
		}
		
		var dialog = new UI.Media_Dialog(this.loki, {
			default_source: default_source,
			sources: sources
		});
		dialog.open(element);
		
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
	},
	
	/**
	 * Extracts a set of URL's from a media element.
	 *
	 * The `element` argument can either be a DOM element node or a string
	 * containing HTML.
	 *
	 * Returns an array containing all unique possibly-relevant URL's that
	 * were found, or, if the optional `map` parameter is true, returns an
	 * object where the keys are those URL's.
	 */
	extract_urls: function extract_urls_from_media_element(element, map) {
		var urls = {};
		
		function clean(url) {
			// XXX: total hax; real entity unfolding is needed in HTML_Parser
			return url.replace('&amp;', '&');
		}
		
		if (typeof(element) == 'string') {
			var parser = new Util.HTML_Parser();
			
			parser.add_listener('open', function(tag, attributes) {
				if ('src' in attributes)
					urls[clean(attributes.src)] = true;
				if ('href' in attributes)
					urls[clean(attributes.href)] = true;
				if ('data' in attributes)
					urls[clean(attributes.data)] = true;
				
				if (tag.toLowerCase() == 'param' && attributes.name == 'movie')
					urls[clean(attributes.value)] = true;
			});
			
			parser.parse(element);
		} else {
			Util.Node.walk(element, Util.Node.ELEMENT_NODE, function(node) {
				if (node.src)
					urls[node.src] = true;
				if (node.href)
					urls[node.href] = true;
				if (node.getAttribute('data'))
					urls[node.getAttribute('data')] = true;
				
				if (node.nodeName == 'PARAM' && node.value) {
					if (node.name.toLowerCase() == 'movie')
						urls[node.value] = true;
				}
			});
		}
		
		return (map) ? urls : Util.Object.names(urls);
	}
});
