/**
 * Does nothing.
 * @constructor
 *
 * @class <p>Contains methods related to producing clean, valid,
 * elegant HTML from the mess produced by the designMode = 'on'
 * components. </p>
 *
 * <p>JSDoc doesn't work well with this file. See the code for more
 * details about how it works.</p>
 */
UI.Clean = new Object;

/**
 * Cleans the children of the given root.
 *
 * @param {Element} root             reference to the node whose children should
 *                                   be cleaned
 * @param {object}	settings         Loki settings
 * @param {boolean} [live]           set to true if this clean is being run
 *                                   on content that is actively being edited
 * @param {object}  [block_settings] settings to pass along to
 *                                   Util.Block.enforce_rules
 */
UI.Clean.clean = function(root, settings, live, block_settings)
{
	/**
	 * Removes the given node from the tree.
	 */
	function remove_node(node)
	{
		// if the node's parent is null, it's already been removed
		if ( node.parentNode == null )
			return;

		node.parentNode.removeChild(node);
	}

	/**
	 * Remove the tag from the given node. (See description in
	 * fxn body how this is done.) E.g.,
	 * node.innerHTML = '<p><strong>Well</strong>&emdash;three thousand <em>ducats</em>!</p>'
	 *   -->
	 * node.innerHTML = '<strong>Well</strong>&emdash;three thousand <em>ducats</em>!'
	 */
	function remove_tag(node) 
	{
		Util.Node.replace_with_children(node);
	}

	/**
	 * Change the tag of the given node to being one with the given tagname. E.g.,
	 * node.innerHTML = '<p><b>Well</b>&emdash;three thousand <em>ducats</em>!</p>'
	 *   -->
	 * node.innerHTML = '<p><strong>Well</strong>&emdash;three thousand <em>ducats</em>!</p>'
	 */
	function change_tag(node, new_tagname)
	{
		// if the node's parent is null, it's already been removed or changed
		// (possibly not necessary here)
		if ( node.parentNode == null )
			return;

		// Create new node
		var new_node = node.ownerDocument.createElement(new_tagname);

		// Take all the children of node and move them, 
		// one at a time, to the new node.
		// Then, node being empty, remove node.
		while ( node.hasChildNodes() )
		{
			new_node.appendChild(node.firstChild);
		}
		node.parentNode.replaceChild(new_node, node);

		// TODO: take all attributes from old node -> new node
	}

	/**
	 * Remove the given attributes from the given node.
	 */ 
	function remove_attributes(node, attrs)
	{
		try
		{
		for ( var i = 0; i < attrs.length; i++ )
		{
			if ( node.getAttribute(attrs[i]) != null )
				node.removeAttribute(attrs[i]);
		}
		}
		catch(e) { mb('error in remove_attributes: ', e.message); }
	}

	/**
	 * Checks whether the given node has the given attributes.
	 * Returns false or an array of attrs (names) that are had.
	 */
	function has_attributes(node, all_attrs)
	{
		var had_attrs = [];
		if ( node.nodeType == Util.Node.ELEMENT_NODE )
		{
			for ( var i = 0; i < all_attrs.length; i++ )
			{
				// Sometimes in IE node.getAttribute throws an "Invalid argument"
				// error here. I have _no_ idea why, but we want to catch it
				// here so that the rest of the tests run.  XXX figure out why?
				try
				{
					if ( node.getAttribute(all_attrs[i]) != null )
						had_attrs.push(all_attrs[i]);
				}
				catch(e) { /*mb('error in has_attributes: [node, e.message]: ', [node, e.message]);*/ }
			}
		}
		
		return ( had_attrs.length > 0 )
			? had_attrs
			: false;
	}
	
	/**
	 * Checks whether the given node is an element node.
	 */
	function is_element(node)
	{
		return (node.nodeType == Util.Node.ELEMENT_NODE);
	}

	/**
	 * Checks whether the given node has one of the given tagnames.
	 */
	function has_tagname(node, tagnames)
	{
		if ( node.nodeType == Util.Node.ELEMENT_NODE )
		{
			for ( var i = 0; i < tagnames.length; i++ )
			{
				if ( node.tagName == tagnames[i] )
				{
					return true;
				}
			}
		}
		// otherwise
		return false;
	}

	/**
	 * Checks whether the given node does not have one of the 
	 * given tagnames.
	 */
	function doesnt_have_tagname(node, tagnames)
	{
		if ( node.nodeType == Util.Node.ELEMENT_NODE )
		{
			for ( var i = 0; i < tagnames.length; i++ )
			{
				if ( node.tagName == tagnames[i] )
				{
					return false;
				}
			}
			// otherwise, it's a tag that doesn't have the tagname
			return true
		}
		// otherwise, it's not a tag
		return false;
	}

	/**
	 * Checks whether the given node has any classes
	 * matching the given strings.
	 */
	function has_class(node, strs)
	{
		var matches = [];
		
		if (node.nodeType == Util.Node.ELEMENT_NODE) {
			for (var i = 0; i < strs.length; i++) {
				if (Util.Element.has_class(node, strs[i]))
					matches.push(strs[i]);
			}
		}
		
		return (matches.length > 0) ? matches : false;
	}

	/**
	 * Removes all attributes matching the given strings.
	 */
	function remove_class(node, strs)
	{
		for (var i = 0; i < strs.length; i++) {
			Util.Element.remove_class(node, strs[i]);
		}
	}

	/**
	 * Checks whether the tag has a given (e.g., MS Office) prefix.
	 */
	function has_prefix(node, prefixes)
	{
		if ( node.nodeType == Util.Node.ELEMENT_NODE )
		{
			for ( var i = 0; i < prefixes.length; i++ )
			{
				if ( node.tagName.indexOf(prefixes[i] + ':') == 0 ||
					 node.scopeName == prefixes[i] )
					return true;
			}
		}
		// otherwise
		return false;
	};
	
	var allowable_tags;
	if (settings.allowable_tags) {
		allowable_tags = settings.allowable_tags.map(function(tag) {
			return tag.toUpperCase();
		}).toSet();
	} else {
		allowable_tags = UI.Clean.default_allowable_tags.toSet();
	}
	
	var acceptable_css;
	if (settings.allowable_inline_styles) {
		if ('string' == typeof(settings.allowable_inline_styles)) {
			acceptable_css = ({
				'all': true,
				'any': true,
				'*': true,
				'none': false
			})[settings.allowable_inline_styles.toLowerCase()] || null;
			
			if (acceptable_css === null) {
				acceptable_css = acceptable_css.split(/\s+/);
			}
		}
	} else {
		acceptable_css = UI.Clean.default_allowable_inline_styles;
	}
	
	if (typeof(acceptable_css.join) == 'function') { // it's an array!	
		acceptable_css = get_css_pattern(acceptable_css);
	}
	
	function get_css_pattern(names) {
		names = names.map(Util.regexp_escape).map(function(name) {
			return name.toLowerCase();
		});
		return new RegExp('^(' + names.join('|') + ')');
	}
		
	function is_allowable_tag(node)
	{
		return (node.nodeType != Util.Node.ELEMENT_NODE ||
			node.tagName in allowable_tags);
	}
	
	function is_block(node)
	{
		var wdw = Util.Node.get_window(node);
		if (wdw) {
			try {
				return Util.Element.is_block_level(wdw, node);
			} catch (e) {
				// try using tag name below
			}
		}
		
		return Util.Node.is_block_level_element(node);
	}
	
	function is_within_container(node) {
		for (var n = node; n; n = n.parentNode) {
			if (is_element(n) && n.getAttribute('loki:container'))
				return true;
		}
		
		return false;
	}
	
	function is_on_current_page(uri) {
		if (!uri.host && (!uri.path || (/$\.\/?/.exec(uri.path))))
			return true;
		
		// Mozilla makes us go the extra mile.
		var base = Util.URI.parse(window.location);
		if (base.authority == uri.authority && base.path == uri.path)
			return true;
		
		return false;
	}
	
	function is_same_domain(uri) {
		return (uri.host == Util.URI.extract_domain(window.location));
	}

	var tests =
	[
		// description : a text description of the test and action
		// test : function that is passed node in question, and returns
		//        false if the node doesn`t match, and whatever it wants 
		//        to be passed to the action otherwise.
		// action : function that is passed node and return of action, and 

		{
			description : 'Remove all comment nodes.',
			test : function(node) {
				if (node.nodeType != Util.Node.COMMENT_NODE)
					return false;
				return !("!" in allowable_tags);
			},
			action : remove_node
		},
		{
			description : 'Remove all style nodes.',
			test : function(node) { return has_tagname(node, ['STYLE']); },
			action : remove_node
		},
		{
			description : 'Remove bad attributes. (v:shape from Ppt)',
			test : function (node) { return has_attributes(node, ['v:shape']); },
			action : remove_attributes
		},
		{
			description: 'Translate align attributes.',
			test: function(node) { return has_attributes(node, ['align']); },
			action: function translate_alignment(el) {
				// Exception: tables and images still use the align attribute.
				if (has_tagname(el, ['TD', 'TH', 'TR', 'TABLE', 'IMG']))
					return;
				
				el.style.textAlign = el.align.toLowerCase();
				el.removeAttribute('align');
			}
		},
		{
			description: 'Strip unwanted inline styles',
			test: function(node) {
				return acceptable_css !== true && has_attributes(node, ['style']); 
			},
			action: function strip_unwanted_inline_styles(el) {
				if (acceptable_css === false) {
					el.removeAttribute('style');
					return;
				}
				
				var rule = /([\w-]+)\s*:\s*([^;]+)(?:;|$)/g;
				var raw = el.style.cssText;
				var accepted = [];
				var match;
				var name;
				
				while (match = rule.exec(raw)) {
					name = match[1].toLowerCase();
					if (acceptable_css.test(name)) {
						accepted.push(match[0]);
					}
				}
				
				if (accepted.length > 0)
					el.style.cssText = accepted.join(' ');
				else
					el.removeAttribute('style');
			}
		},
		{
			description: 'Remove empty Word paragraphs',
			test: function is_empty_word_paragraph(node) {
				// Check node type and tag
				if (!node.tagName || node.tagName != 'P') {
					return false;
				}
				
				// Check for a Word class
				if (!(/(^|\b)Mso/.test(node.className)))
					return false;
				
				// Check for the paragraph to only contain non-breaking spaces
				var pattern = new RegExp("^(\xA0| )+$", "");
				for (var i = 0; i < node.childNodes.length; i++) {
					var child = node.childNodes[i];
					if (child.nodeType == Util.Node.ELEMENT_NODE) {
						if (!is_empty_word_paragraph(child)) // recurse
							return false;
					}
					
					if (child.nodeType == Util.Node.TEXT_NODE) {
						if (!pattern.test(child.data)) {
							return false;
						}
					}
				}
				
				return true;
			},
			action: remove_node
		},
		{
			description : 'Remove all classes that include Mso (from Word) or O (from Powerpoint) in them.',
			test : is_element,
			action : function strip_ms_office_classes(node)
			{
				var office_pattern = /^(Mso|O)/;
				var classes = Util.Element.get_class_array(node);
				var length = classes.length;
				
				for (var i = 0; i < length; i++) {
					if (office_pattern.test(classes[i]))
						classes.splice(i, 1); // remove the class
				}
				
				if (classes.length != length)
					Util.Element.set_class_array(node, classes);
			}
		},
		{
			description: 'Remove Microsoft Word section DIV\'s',
			test: function is_ms_word_section_div(node) {
				if (!has_tagname(node, ['DIV']))
					return false;
			
				var pattern = /^Section\d+$/;
				var classes = Util.Element.get_class_array(node);
				
				for (var i = 0; i < classes.length; i++) {
					if (!pattern.test(classes[i]))
						return false;
				}
				
				return true;
			},
			action: remove_tag
		},
		{
			description : 'Remove unnecessary span elements',
			test : function is_bad_span(node) {
				 return (has_tagname(node, ['SPAN'])
					&& !has_attributes(node, ['class', 'style'])
					&& !is_within_container(node));
			},
			action : remove_tag
		},
		{
			description : 'Remove all miscellaneous non-good tags (strip_tags).',
			test : function(node) { return !is_allowable_tag(node); },
			action : remove_tag
		},
		// STRONG -> B, EM -> I should be in a Masseuse; then exclude B and I here
		// CENTER -> P(align="center")
		// H1, H2 -> H3; H5, H6 -> H4(? or -> P)
		// Axe form elements?
		{
			description : "Remove U unless there's an appropriate option set.",
			test : function(node) { return !settings.options.underline && has_tagname(node, ['U']); },
			action : remove_tag
		},
		{
			description : 'Remove all tags that have Office namespace prefixes.',
			test : function(node) { return has_prefix(node, ['o', 'O', 'w', 'W', 'st1', 'ST1']); },
			action : remove_tag
		},
		{
			description : 'Remove width and height attrs on tables.',
			test : function(node) {
				return has_tagname(node, ['TABLE']); 
			},
			action : function(node) { 
				remove_attributes(node, ['height', 'width']); 
			}
		},
		{
			description: 'Remove width and height attributes from images if so desired.',
			test: function(node) {
				return (!!settings.disallow_image_sizes &&
					has_tagname(node, ['IMG']));
			},
			action: function(node) {
				remove_attributes(node, ['height', 'width']);
			}
		},
		{
			description: "Normalize all image URI's",
			test: Util.Node.curry_is_tag('IMG'),
			action: function normalize_image_uri(img) {
				if (Util.URI.is_urn(img)) {
					// Don't normalize URN's (like data:).
					return;
				}
				var uri = Util.URI.parse(img.src);
				var norm = Util.URI.normalize(img.src);
				if (is_same_domain(uri))
					norm.scheme = null;
				else
					norm.scheme = uri.scheme; // undo any changes
				img.src = Util.URI.build(norm);
			}
		},
		{
			description: "Normalize all link URI's",
			test: Util.Node.curry_is_tag('A'),
			action: function normalize_link_uri(link) {
				if (!link.href)
					return;
				var uri = Util.URI.parse(link.href);
				if (Util.URI.is_urn(uri)) {
					// Do nothing to URN's (like mailto: addresses).
					return;
				}
				if (is_on_current_page(uri))
					return;
				var norm = Util.URI.normalize(uri);
				if (is_same_domain(uri))
					norm.scheme = null;
				else
					norm.scheme = uri.scheme; // undo any changes
				link.href = Util.URI.build(norm);
			}
		},
		{
			description: 'Remove unnecessary BR\'s that are elements\' last ' +
				'children',
			run_on_live: false,
			test: function is_last_child_br(node) {
				function get_last_relevant_child(n)
				{
					var c; // child
					for (c = n.lastChild; c; c = c.previousSibling) {
						if (c.nodeType == Util.Node.ELEMENT_NODE) {
							return c;
						} else if (c.nodeType == Util.Node.TEXT_NODE) {
							if (/\S/.test(c.nodeValue))
								return c;
						}
					}
				}
				
				return has_tagname(node, ['BR']) && is_block(node.parentNode) &&
					get_last_relevant_child(node.parentNode) == node;
				
			},
			action: remove_node
		},
		{
			description: 'Remove improperly nested elements',
			run_on_live: false,
			test: function improperly_nested(node)
			{
				function is_nested()
				{
					var a;
					for (a = node.parentNode; a; a = a.parentNode) {
						if (a.tagName == node.tagName)
							return true;
					}
					
					return false;
				}
				
				return node.tagName in UI.Clean.self_nesting_disallowed &&
					is_nested();
			},
			action: remove_tag
		}
		// TODO: deal with this?
		// In content pasted from Word, there may be 
		// ...<thead><tr><td>1</td></tr></thead>...
		// instead of
		// ...<thead><tr><th>1</th></tr></thead>...
	];

	function _clean_recursive(root)
	{
		var children = root.childNodes;
		// we go backwards because remove_tag uses insertBefore,
		// so if we go forwards some nodes will be skipped
		//for ( var i = 0; i < children.length; i++ )
		for ( var i = children.length - 1; i >= 0; i-- )
		{
			var child = children[i];
			_clean_recursive(child); // we need depth-first, or remove_tag
			                         // will cause some nodes to be skipped
			_run_tests(child);
		}
	}

	function _run_tests(node)
	{
		for ( var i = 0; i < tests.length; i++ )
		{
			if (live && false === tests[i].run_on_live)
				continue;
			
			var result = tests[i].test(node);
			if ( result !== false )
			{
				// We do this because we don't want any errors to
				// result in lost content!
				try {
					tests[i].action(node, result);
				} catch (e) {
					if (typeof(console) == 'object') {
						if (console.warn)
							console.warn(e);
						else if (console.log)
							console.log(e);
					}
				}
			}
		}
	}

	// We do this because we don't want any errors to result in lost content!
	try
	{
		_clean_recursive(root);
		Util.Block.enforce_rules(root, block_settings);
	}
	catch(e)
	{
		if (typeof(console) == 'object') {
			if (console.warn)
				console.warn(e);
			else if (console.log)
				console.log(e);
		}
	}
};

UI.Clean.clean_URI = function clean_URI(uri)
{
	var local = Util.URI.extract_domain(uri) ==
		Util.URI.extract_domain(window.location);
		
	return (local)
		? Util.URI.strip_https_and_http(uri)
		: uri;
}

UI.Clean.clean_HTML = function clean_HTML(html, settings)
{
    // empty elements (as defined by HTML 4.01)
    var empty_elems = '(br|area|link|img|param|hr|input|col|base|meta)';

	var tests =
	[
		// description : a text description of the test and action
        // test: only do the replacement if this is true 
        //       (optional--if omitted, the replacement will always be performed)
		// pattern : either a regexp or a string to match
		// replacement : a string to replace pattern with

		{
			description : 'Forces all empty elements (with attributes) to include trailing slash',
            //                     [ ]      : whitespace between element name and attrs
            //                     [^>]*    : any chars until one char before the final >
            //                     [^>/]    : the char just before the the final >. 
            //                                This excludes elements that already include trailing slashes.
            test : function() { return settings.use_xhtml },
			pattern : new RegExp('<' + empty_elems + '([ ][^>]*[^>/])>', 'gi'),
			replacement : '<$1$2 />'
		},
		{
			description : 'Forces all empty elements (without any attributes) to include trailing slash',
            test : function() { return settings.use_xhtml },
			pattern : new RegExp('<' + empty_elems + '>', 'gi'),
			replacement : '<$1 />'
		}
    ];


    for (var i in tests) {
        if (!tests[i].test || tests[i].test())
            html = html.replace(tests[i].pattern, tests[i].replacement);
	}

    return html;
};

UI.Clean.default_allowable_tags = 
	['A', 'ABBR', 'ACRONYM', 'ADDRESS', 'AREA', 'B', 'BDO', 'BIG', 'BLOCKQUOTE',
	'BR', 'BUTTON', 'CAPTION', 'CITE', 'CODE', 'COL', 'COLGROUP', 'DD', 'DEL',
	'DIV', 'DFN', 'DL', 'DT', 'EM', 'FIELDSET', 'FORM', 'H1', 'H2', 'H3', 'H4',
	'H5', 'H6', 'HR', 'I', 'IMG', 'INPUT', 'INS', 'KBD', 'LABEL', 'LI', 'MAP',
	'NOSCRIPT', 'OBJECT', 'OL', 'OPTGROUP', 'OPTION', 'P', 'PARAM', 'PRE', 'Q',
	'SAMP', 'SCRIPT', 'SELECT', 'SMALL', 'SPAN', 'STRONG', 'SUB', 'SUP', 'TABLE',
	'TBODY', 'TD', 'TEXTAREA', 'TFOOT', 'TH', 'THEAD', 'TR', 'TT', 'U', 'UL',
	'VAR'];
	
UI.Clean.default_allowable_inline_styles =
	['text-align', 'vertical-align', 'float', 'direction', 'display', 'clear',
	'list-style'];

UI.Clean.self_nesting_disallowed =
	['ABBR', 'ACRONYM', 'ADDRESS', 'AREA', 'B', 'BR', 'BUTTON', 'CAPTION',
	'CODE', 'DEL', 'DFN', 'EM', 'FORM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
	'HR', 'I', 'IMG', 'INPUT', 'INS', 'KBD', 'LABEL', 'MAP', 'NOSCRIPT',
	'OPTION', 'P', 'PARAM', 'PRE', 'SCRIPT', 'SELECT', 'STRONG', 'TT', 'U',
	'VAR'].toSet();
