/**
 * Constructs a new DOM builder.
 *
 * @param {Document}          doc     the document for which a fragment will
 *                                    be built
 *
 * @class Wraps a SAX HTML parser and builds a DocumentFragment from its
 * contents.
 * @constructor
 * @author Eric Naeseth
 */
Util.DOM_Builder = function DOMBuilder(doc)
{
	this.doc = doc;
}

/**
 * Runs the underlying parser, building a DOM DocumentFragment.
 * @param {string}  text   the HTML/XML document text
 * @return {DocumentFragment}  the parsed document
 * @throws {Util.HTML_Parser.Error} on parse errors
 */
Util.DOM_Builder.prototype.build_from = function build_dom_from_text(text)
{
	var doc = this.doc;
	var frag = doc.createDocumentFragment();
	var node = frag;
	
	var parser = new Util.HTML_Parser();
	
	parser.add_listener('open', function tag_opened(name, attributes) {
		console.debug('open:', name);
		var el = Util.Document.create_element(doc, name, attributes);
		node.appendChild(el);
		node = el;
	});
	
	parser.add_listener('close', function tag_closed(name) {
		name = name.toLowerCase();
		if (node == frag) {
			throw new Util.HTML_Parser.Error('Closing tag for "' + name + '"' +
				' when no opening tag was in scope.');
		} else if (node.tagName.toLowerCase() != name) {
			throw new Util.HTML_Parser.Error('Got closing tag for "' + name + 
				'"; was expecting "' + node.tagName.toLowerCase() + '".');
		}
		node = node.parentNode;
	});
	
	parser.add_listener('text', function text(t) {
		node.appendChild(doc.createTextNode(t));
	});
	
	parser.add_listener('cdata', function cdata(d) {
		node.appendChild(doc.createCDATASection(d));
	});
	
	parser.add_listener('comment', function comment(c) {
		node.appendChild(doc.createComment(c));
	});
	
	parser.parse(text);
	return frag;
}
