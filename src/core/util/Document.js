/**
 * Wraps a DOM Document object to provide convenient functions.
 *
 * @class Container for functions relating to nodes.
 */
Util.Document = function(doc)
{
	for (var n in Util.Document) {
		if (n.charAt(0) == '_')
			continue;

		var a = Util.Document[n];
		if (typeof(a) != 'function')
			continue;

		this[n] = a.dynamic_curry(doc);
	}
};

/**
 * Creates an element in the document, optionally setting some attributes on it
 * and adding children.
 * @param	doc			document on which to create the element
 * @param	name		name of the tag to create
 * @param	attrs		any attributes to set on the new element
 * @param	children	any child nodes to add
 */
Util.Document.create_element = function(doc, name, attrs, children)
{
	// Internet Explorer cannot really set the name attribute on
	// an element. It can, however, be set on an element at the time
	// it is created using a proprietary IE syntax, for example:
	//     document.createElement('<INPUT name="foo">')
	// See http://tinyurl.com/8qsj2 for more information.
	function create_normal()
	{
		return doc.createElement(name.toUpperCase());
	}
	
	function create_ie()
	{
		try {
			return doc.createElement('<' + name.toUpperCase() +
				' name="' + attrs.name + '">');
		} catch (e) {
			return create_normal();
		}
	}
	
	var e = (attrs && attrs.name && Util.Browser.IE)
		? create_ie()
		: create_normal();
	
	function collapse(i, dom_text)
	{
		switch (typeof(i)) {
			case 'function':
				return collapse(i(), dom_text);
			case 'string':
				return (dom_text) ? doc.createTextNode(i) : i;
			default:
				return i;
		}
	}
	
	function dim(dimension)
	{
		return (typeof(dimension) == 'number') ? dimension + 'px' : dimension;
	}
	
	var style = {};
	
	for (var name in attrs || {}) {
		var dest_name = name;
		
		switch (name) {
			case 'className':
			case 'class':
				// In IE, e.setAttribute('class', x) does not work properly:
				// it will indeed set an attribute named "class" to x, but
				// the CSS for that class won't actually take effect. As a
				// workaround, we just set className directly, which works in
				// all browsers.
				
				// See http://tinyurl.com/yvsqbx for more information.
				
				var klass = attrs[name];
				
				// Allow an array of classes to be passed in.
				if (typeof(klass) != 'string' && klass.join)
					klass = klass.join(' ');
					
				e.className = klass;
				continue; // note that this continues the for loop!
			case 'htmlFor':
				dest_name = 'for';
				break;
			case 'style':
				if (typeof(style) == 'object') {
					style = attrs.style;
					continue; // note that this continues the for loop!
				}
		}
		
		var a = attrs[name];
		if (typeof(a) == 'boolean') {
			if (a)
				e.setAttribute(dest_name, dest_name);
			else
				continue;
		} else {
			e.setAttribute(dest_name, collapse(a, false));
		}
	}
	
	for (var name in style) {
		// Special cases
		switch (name) {
			case 'box':
				var box = style[name];
				e.style.left = dim(box[0]);
				e.style.top = dim(box[1]);
				e.style.width = dim(box[2]);
				e.style.height = dim(box[3] || box[2]);
				break;
			case 'left':
			case 'top':
			case 'right':
			case 'bottom':
			case 'width':
			case 'height':
				e.style[name] = dim(style[name]);
				break;
			default:
				e.style[name] = style[name];
		}
	}
	
	Util.Array.for_each(children || [], function(c) {
		e.appendChild(collapse(c, true));
	});
	
	return e;
}

/**
 * Make the document editable. Mozilla doesn't support
 * contentEditable. Both IE and Mozilla support
 * designMode. However, in IE if designMode is set on an iframe's
 * contentDocument, the iframe's ownerDocument will be denied
 * permission to access it (even if otherwise it *would* have
 * permission). So for IE we use contentEditable, and for Mozilla
 * designMode.
 * @param {HTMLDocument}	doc
 * @type void
 */
Util.Document.make_editable = function make_editable(doc)
{
	if (Util.Browser.IE) {
		doc.body.contentEditable = true;
		try {
			// If the document isn't editable, this will throw an
			// error. If the document is editable, this is perfectly
			// harmless.
			doc.queryCommandState('Bold');
		} catch (e) {
			throw new Util.Unsupported_Error('rich-text editing');
		}
	} else {
		// Gecko (et al?)
		doc.designMode = 'on';
		try {
			// Turn on design mode. Make sure this is only set after the
			// frame's src is set or its document is closed.
			doc.execCommand('undo', false, null);
			doc.execCommand('useCSS', false, true);
		} catch (e) {
			throw new Util.Unsupported_Error('rich-text editing');
		}
	}
}

/**
 * Creates a new range on the document.
 * @param {Document}  doc   document on which the range will be created
 * @return {Range} the new range
 */
Util.Document.create_range = function create_range_on_document(doc)
{
	if (doc.createRange) {
		return doc.createRange();
	} else if (doc.body.createTextRange) {
		return doc.body.createTextRange();
	} else {
		throw new Util.Unsupported_Error('creating a range on a document');
	}
}

/**
 * Gets the HEAD element of a document.
 * @param	doc		document from which to obtain the HEAD
 */
Util.Document.get_head = function get_document_head(doc)
{
	try {
		return doc.getElementsByTagName('HEAD')[0];
	} catch (e) {
		return null;
	}
}

/**
 * Imitates W3CDOM Document.importNode, which IE doesn't
 * implement. See spec for more details.
 *
 * @param	new_document	the document to import the node to
 * @param	node			the node to import
 * @param	deep			boolean indicating whether to import child
 *							nodes
 */
Util.Document.import_node = function import_node(new_document, node, deep)
{
	if (new_document.importNode) {
		return new_document.importNode(node, deep);
	} else {
		var handlers = {
			// element nodes
			1: function import_element() {
				var new_node = new_document.createElement(node.nodeName);
				
				if (node.attributes && node.attributes.length > 0) {
					for (var i = 0, len = node.attributes.length; i < len; i++) {
						var a = node.attributes[i];
						if (a.specified)
							new_node.setAttribute(a.name, a.value);
					}
				}
				
				if (deep) {
					for (var i = 0, len = node.childNodes.length; i < len; i++) {
						new_node.appendChild(Util.Document.import_node(new_document, node.childNodes[i], true));
					}
				}
				
				return new_node;
			},
			
			// attribute nodes
			2: function import_attribute() {
				var new_node = new_document.createAttribute(node.name);
				new_node.value = node.value;
				return new_node;
			},
			
			// text nodes
			3: function import_text() {
				return new_document.createTextNode(node.nodeValue);
			}
		};
		
		if (typeof(handlers[node.nodeType]) == 'undefined')
			throw new Error("Workaround cannot handle the given node's type.");
		
		return handlers[node.nodeType]();
	}
};

/**
 * Append the style sheet at the given location to the head of the
 * given document
 *
 * @param	location	the location of the stylesheet to add
 * @static
 */
Util.Document.append_style_sheet = function append_style_sheet(doc, location)
{
	var head = Util.Document.get_head(doc);
	return head.appendChild(Util.Document.create_element(doc, 'LINK',
		{href: location, rel: 'stylesheet', type: 'text/css'}));
};

/**
 * Gets position/dimensions information of a document.
 * @return {object} an object describing the document's dimensions
 */
Util.Document.get_dimensions = function get_document_dimensions(doc)
{
	return {
		client: {
			width: doc.documentElement.clientWidth || doc.body.clientWidth,
			height: doc.documentElement.clientHeight || doc.body.clientHeight
		},
		
		offset: {
			width: doc.documentElement.offsetWidth || doc.body.offsetWidth,
			height: doc.documentElement.offsetHeight || doc.body.offsetHeight
		},
		
		scroll: {
			width: doc.documentElement.scrollWidth || doc.body.scrollWidth,
			height: doc.documentElement.scrollHeight || doc.body.scrollHeight,
			left: doc.documentElement.scrollLeft || doc.body.scrollLeft,
			top: doc.documentElement.scrollTop || doc.body.scrollTop
		}
	};
}

/**
 * Returns an array (not a DOM NodeList!) of elements that match the given
 * namespace URI and local name.
 *
 * XXX Doesn't work
 */
Util.Document.get_elements_by_tag_name_ns = function(doc, ns_uri, tagname)
{
	var elems = new Array();
	try // W3C
	{
		var all = doc.getElementsByTagNameNS(ns_uri, tagname);
		messagebox('doc' ,doc);
		messagebox('all', all);
		for ( var i = 0; i < all.length; i++ )
			elems.push(all[i]);
	}
	catch(e)
	{
		try // IE
		{
			var all = doc.getElementsByTagName(tagname);
			for ( var i = 0; i < all.length; i++ )
			{
				if ( all[i].tagUrn == ns_uri )
					elems.push(all[i]);
			}
		}
		catch(f)
		{
			throw('Neither the W3C nor the IE way of getting the element by namespace worked. When the W3C way was tried, an error with the following message was thrown: ' + e.message + '. When the IE way was tried, an error with the following message was thrown: ' + f.message + '.');
		}
	}
	return elems;
};
