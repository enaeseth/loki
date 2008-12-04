Loki.Cleanup.addFilters({
	remove_stylesheets: {
		description: "Remove all <style> tags and their contents.",
		selector: 'style',
		action: 'remove'
	},
	
	translate_align: {
		description: "Converts align attributes to inline CSS.",
		selector: '*[align]',
		_tags: /^(T[DHR]|TABLE|IMG)$/,
		action: function(el) {
			if (!this._tags.test(el.nodeName))
				return;
			el.style.textAlign = el.align.toLowerCase();
			el.removeAttribute('align');
		}
	},
	
	strip_inline_styles: {
		description: "Strips unwanted inline styles.",
		selector: '*[style]',
		_rule: /([\w-]+)\s*:\s*([^;]+)(?:;|$)/g,
		_default: /^((text|vertical)-align$|float$|direction$|display$|clear$|list-)/,
		action: function strip_unwanted_inline_styles(el, settings) {
			var raw = el.style.cssText;
			var accepted = [];
			var match;
			var name;
			
			var allowable = settings.allowable_inline_styles || [];
			if (!Loki.Object.isArray(allowable))
				allowable = [allowable];
			allowable.push(this._default);
			
			var i, allow_len = allowable.length, a;
			while (match = this._rule.exec(raw)) {
				name = match[1].toLowerCase();
				for (i = 0; i < allow_len; i++) {
					a = allowable[i];
					if ((a.test && a.test(name)) || a == name) {
						accepted.push(match[0]);
						break;
					}
				}
			}
			
			if (accepted.length > 0)
				el.style.cssText = accepted.join(' ');
			else
				el.removeAttribute('style');
		}
	},
	
	remove_empty_word_paragraphs: {
		description: "Remove empty Microsoft Word-generated paragraphs.",
		selector: 'p',
		_class_pattern: /(^|\b)Mso/,
		_pattern: new RegExp("^(\xA0| )+$", ""),
		test: function is_empty_word_para(node) {
			// Check node type and tag
			if (!node.tagName || node.tagName != 'P') {
				return false;
			}
			
			// Check for a Word class
			if (!(this._class_pattern.test(node.className)))
				return false;
			
			// Check for the paragraph to only contain non-breaking spaces
			for (var i = 0; i < node.childNodes.length; i++) {
				var child = node.childNodes[i];
				if (child.nodeType == Node.ELEMENT_NODE) {
					if (!is_empty_word_para.call(this, child)) // recurse
						return false;
				}
				
				if (child.nodeType == Node.TEXT_NODE) {
					if (!this._pattern.test(child.data)) {
						return false;
					}
				}
			}
			
			return true;
		},
		action: 'remove'
	},
	
	remove_office_classes: {
		description: "Remove all Microsoft Office classes.",
		selector: "*[class]",
		_office_pattern: /^(Mso|O)/,
		action: function strip_office_classes(node) {
			var classes = node.className.split(/\s+/);
			var length = classes.length;
			
			for (var i = 0; i < length; i++) {
				if (this._office_pattern.test(classes[i]))
					classes.splice(i, 1); // remove the class
			}
			
			if (classes.length != length)
				node.className = classes.join(' ');
		}
	},
	
	remove_word_sections: {
		description: "Eliminate Microsoft Word section DIV's.",
		selector: "div[class]",
		_class_pattern: /\bSection\d+\b/,
		test: function is_word_section(div) {
			return this._class_pattern.test(div.className);
		},
		action: 'remove_tag'
	},
	
	remove_needless_spans: {
		description: "Remove unnecessary SPAN elements.",
		_in_container: function is_within_container(node) {
			for (var n = node; n; n = n.parentNode) {
				if (n.nodeType != Node.ELEMENT_NODE)
					continue;
				if (n.getAttribute('loki:container'))
					return true;
			}

			return false;
		},
		selector: "span",
		test: function is_unnecessary_span(span) {
			return (!span.className &&
				span.getAttribute('style') &&
				!this._in_container(span));
		},
		action: 'remove_tag'
	},
	
	strip_tags: {
		description: 'Remove unwanted tags.',
		selector: '*',
		_chooser: new Loki.Chooser({}, {'default': ('A ABBR ACRONYM ADDRESS ' +
			'AREA B BDO BIG BLOCKQUOTE BR BUTTON CAPTION CITE CODE COL ' +
			'COLGROUP DD DEL DIV DFN DL DT EM FIELDSET FORM H1 H2 H3 H4 H5 H6 '+
			'HR I IMG INPUT INS KBD LABEL LI MAP NOSCRIPT OBJECT OL OPTGROUP ' +
			'OPTION P PARAM PRE Q SAMP SCRIPT SELECT SMALL SPAN STRONG SUB ' +
			'SUP TABLE TBODY TD TEXTAREA TFOOT ' +
			'TH THEAD TR TT U UL VAR'.split(' '))}),
		preflight: function(settings) {
			var tags = {};
			var sel = settings.allowable_tags || 'default';
			var tag_list = this._chooser.resolveSelector(sel);
			var i, len = tag_list.length;
			for (i = 0; i < len; i++) {
				tags[tag_list[i].toUpperCase()] = true;
			}
			
			return tags;
		},
		test: function is_allowable_tag(el, settings, tags) {
			return (el.nodeName in tags);
		},
		action: 'remove_tag'
	},
	
	remove_office_tags: {
		description: "Remove all tags that have Office namespace prefixes.",
		selector: '*',
		_scopes: /^(o|w|st1)$/i,
		_starts: /^(o|w|st1):/i,
		test: function(node) {
			return (this._starts.test(node.nodeName) ||
				this._scopes.test(node.scopeName));
		},
		action: 'remove_tag'
	},
	
	remove_table_dimensions: {
		description: "Remove width and height attributes from tables.",
		selector: 'table[width], table[height]',
		action: function(table) {
			table.removeAttribute('height');
			table.removeAttribute('width');
		}
	},
	
	remove_image_dimensions: {
		description: "Remove width and height attributes from images.",
		selector: 'img[width], img[height]',
		action: function(image) {
			image.removeAttribute('height');
			image.removeAttribute('width');
		}
	},
	
	normalize_image_uris: {
		description: "Normalize all image URI's.",
		selector: 'img[src]',
		action: function normalize_image_uri(img) {
			var norm = Util.URI.normalize(img.src);
			norm.scheme = null;
			img.src = Util.URI.build(norm);
		}
	},
	
	normalize_link_uris: {
		description: "Normalize all link URI's.",
		selector: 'a[href]',
		action: function normalize_image_uri(link) {
			if (!link.href)
				return;
			var uri = Loki.URI.parse(link.href);
			if (is_on_current_page(uri))
				return;
			var norm = Loki.URI.normalize(link.href);
			norm.scheme = null;
			link.href = Loki.URI.build(norm);
		}
	},
	
	remove_last_child_brs: {
		description: "Remove the unnecessary BR's that are elements' last " +
			"children.",
		run_on_live: false,
		selector: 'br',
		test: function is_last_child_br(node) {
			function get_last_relevant_child(n)
			{
				var c; // child
				for (c = n.lastChild; c; c = c.previousSibling) {
					if (c.nodeType == Node.ELEMENT_NODE) {
						return c;
					} else if (c.nodeType == Node.TEXT_NODE) {
						if (/\S/.test(c.nodeValue))
							return c;
					}
				}
			}
			
			return (Loki.Block.isBlock(node.parentNode) &&
				get_last_relevant_child(node.parentNode) == node);
		},
		action: 'remove'
	},
	
	strip_improper_nesting: {
		description: 'Strip improperly-nested tags.',
		run_on_live: false,
		selector: 'abbr, acronym, address, area, b, br, button, caption, ' +
			'code, del, dfn, em, form, h1, h2, h3, h4, h5, h6, hr, i, img, ' +
			'input, ins, kbd, label, map, noscript, option, p, param, pre, ' +
			'script, select, strong, tt, u, var',
		test: function is_nested(node) {
			var a;
			for (a = node.parentNode; a; a = a.parentNode) {
				if (a.tagName == node.tagName)
					return true;
			}
			
			return false;
		},
		action: 'remove_tag'
	}
});

Loki.Cleanup.filters.putSet('office', ['remove_empty_word_paragraphs',
	'remove_office_classes', 'remove_word_sections', 'remove_office_tags']);
Loki.Cleanup.filters.putSet('default', ['office', 'remove_stylesheets',
	'translate_align', 'strip_inline_styles', 'remove_needless_spans',
	'strip_tags', 'remove_table_dimensions', 'remove_image_dimensions',
	'normalize_image_uris', 'normalize_link_uris', 'remove_last_child_brs',
	'strip_improper_nesting']);
