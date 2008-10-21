// Class: Loki.HTMLGenerator
// Generates HTML.
Loki.HTMLGenerator = Loki.Class.create({
	// Constructor: HTMLGenerator
	// Creates a new HTML generator.
	//
	// Parameters:
	//     (Object) options - HTML generation options
	//
	// Options:
	//     (Boolean) xhtml - generate XHTML output (default: true)
	//     (Boolean) escapeNonASCII - escapes all non-ASCII characters
	//                                (default: true)
	//     (String) indentText - the text used as indentation (default: "\t")
	initialize: function HTMLGenerator(options) {
		options = HTMLGenerator._options.process(options);
		this.xhtml = options.xhtml;
		this.escapeNonASCII = options.escapeNonASCII
		this.indentText = options.indentText;
	},
	
	generate: function generate_html(nodes) {
		var gen = this;
		var pattern = (gen.escape_non_ascii)
			? /[\x00-\x1F\x80-\uFFFF]/g
			: /[\x00-\x1F]/g;

		function clean_text(text) {
			function html_escape(txt) {
				var c = txt.charCodeAt(0);
				if (c == 9 || c == 10 || c == 13)
					return txt;
				var entity = Loki.HTMLGenerator.namedEntities[c];
				return (typeof(entity) == "string")
					? '&' + entity + ';'
					: '&#' + c + ';'
			}

			return text.replace(pattern, html_escape);
		}

		function is_whitespace_irrelevant(node) {
			var parent = node.parentNode;
			var parent_is_block = Loki.Block.isBlock(parent);
			var results = [false, false];

			if (parent_is_block) {
				if (node == node.parentNode.firstChild)
					results[0] == true;
				if (node == node.parentNode.lastChild)
					results[1] == true;

				if (results[0] && results[1])
					return results;
			}

			if (node.previousSibling && Loki.Block.isBlock(node.previousSibling))
				results[0] = true;
			if (node.nextSibling && Loki.Block.isBlock(node.nextSibling))
				results[1] = true;

			return results;
		}

		function make_text(buffer, text_node) {
			if (text_node.nodeType != Node.TEXT_NODE)
				throw new TypeError();

			var text = text_node.nodeValue, orig_text = text, irw;

			if (!buffer.flagged("preformatted")) {
				if (text_node == text_node.parentNode.firstChild)
					text = text.replace(/^[\t\r\n]+/g, '');
				if (text_node == text_node.parentNode.lastChild)
					text = text.replace(/[\t\r\n]+$/g, '');
				text = text.replace(/(\S)[\r\n]+(\S)/g, "$1 $2");
				text = text.replace(/(\s)[\r\n]+|[\r\n]+(\s)/g, "$1$2");
				text = text.replace(/[ ][ ]+/g, ' ');

				irw = is_whitespace_irrelevant(text_node);
				if (irw[0])
					text = text.replace(/^[\s\n]+/, '');
				if (irw[1])
					text = text.replace(/[\s\n]+$/, '');
			}

			text = clean_text(text);
			if (text.length > 0)
				buffer.write(text);
		}

		function make_comment(buffer, comment_node) {
			if (comment_node.nodeType != Node.COMMENT_NODE)
				throw new TypeError();

			buffer.write('<!--' + clean_text(comment_node.nodeValue) + '-->');
		}

		function make_processing_instruction(buffer, pi_node) {
			if (pi_node.nodeType != Node.PROCESSING_INSTRUCTION_NODE)
				throw new TypeError();

			buffer.write('<?' + pi_node.target + ' ' + pi_node.data + '?>');
		}

		function make_open_tag(buffer, element, xml_self_close) {
			if (element.nodeType != Node.ELEMENT_NODE)
				throw new TypeError();

			buffer.write('<', element.nodeName.toLowerCase());

			Loki.Object.enumerate($extend(element).getAttributes(true),
				function append_attr(name, value) {
					if (name.charAt(0) == "_")
						return;
					buffer.write(' ', name, '="', clean_text(value), '"');
				}
			);

			buffer.write((xml_self_close) ? ' />' : '>');
		}

		function make_close_tag(buffer, element) {
			if (element.nodeType != Node.ELEMENT_NODE)
				throw new TypeError();

			buffer.write('</' + element.nodeName.toLowerCase() + '>');
		}

		function make_empty_element(buffer, element) {
			if (element.nodeType != Node.ELEMENT_NODE)
				throw new TypeError();

			make_open_tag(buffer, element, gen.xhtml);
			if (element.nodeName == "PARAM")
				buffer.endLine();
		}

		function make_inline_element(buffer, element) {
			if (element.nodeType != Node.ELEMENT_NODE)
				throw new TypeError();

			make_open_tag(buffer, element);
			make_nodes(buffer, element.childNodes);
			make_close_tag(buffer, element);
		}

		function make_block_element(buffer, element) {
			if (element.nodeType != Node.ELEMENT_NODE)
				throw new TypeError();

			if (!element.hasChildNodes() || buffer.flagged("preformatted")) {
				make_inline_element(buffer, element);
				return;
			}

			if (buffer.flagged('after_indented_block')) {
				buffer.endLine();
			}
			
			element = $extend(element);
			function is_block(node) {
				return (node.nodeType == Node.ELEMENT_NODE &&
					Loki.Block.isBlock(node));
			}
			var block_children = element.findChildren(is_block);
			block_children = block_children.length > 0;
			var child_buffer;

			make_open_tag(buffer, element);

			if (block_children) {
				//buffer.endLine(true);
				child_buffer = buffer.spawn();
				make_nodes(child_buffer, element.childNodes);
				child_buffer.close();
				buffer.endLine(true);
			} else {
				make_nodes(buffer, element.childNodes);
			}

			make_close_tag(buffer, element);
			buffer.endLine();
			if (block_children)
				buffer.setFlag('after_indented_block', 'write');
		}

		function make_pre_element(buffer, element) {
			if (element.nodeType != Node.ELEMENT_NODE)
				throw new TypeError();

			buffer.setFlag('preformatted');
			make_inline_element(buffer, element);
			buffer.new_line(true);
			buffer.clearFlag('preformatted');
		}

		function make_element(buffer, element) {
			if (element.nodeType != Node.ELEMENT_NODE) {
				throw new TypeError("Tried to make a non-element as an element: " +
					element);
			}

			$extend(element);
			if (element.isTag("PRE"))
				return make_pre_element(buffer, element);
			else if (!element.hasChildNodes() && element.isEmptyTag())
				return make_empty_element(buffer, element);
			else if (Loki.Block.isBlock(element))
				return make_block_element(buffer, element);
			else
				return make_inline_element(buffer, element);
		}

		function make_node(buffer, node) {
			if (!Loki.Object.isNumber(node.nodeType))
				throw new TypeError();

			switch (node.nodeType) {
				case Node.TEXT_NODE:
					return make_text(buffer, node);
				case Node.COMMENT_NODE:
					return make_comment(buffer, node);
				case Node.PROCESSING_INSTRUCTION_NODE:
					return make_processing_instruction(buffer, node);
				case Node.ELEMENT_NODE:
					return make_element(buffer, node);
				case Node.DOCUMENT_NODE:
					return make_element(buffer, node.documentElement);
				default:
					return '';
			}
		}

		function make_nodes(buffer, nodes) {
			if (typeof(nodes) != 'object' || typeof(nodes.length) != 'number')
				throw new TypeError();

			for (var i = 0; i < nodes.length; i++) {
				make_node(buffer, nodes[i]);
			}
		}

		var buffer = new Loki.HTMLGenerator.Buffer(null, this.indentText);
		if (typeof(nodes.length) != 'number')
			nodes = [nodes];
		make_nodes(buffer, nodes);
		return buffer.close().read();
	}
});

Loki.HTMLGenerator.Buffer = Loki.Class.create({
	initialize: function Buffer(parent, indent_text) {
		this.parent = parent || null;
		this.depth = (parent) ? parent.depth + 1 : 0;
		this.lines = [];
		this.currentLine = [];
		this.indentText = indent_text || (parent && parent.indentText) || "\t";
		this.closed = false;
		this.activeChild = null;
		this.flags = {
			'manual': {},
			'write': {},
			'flush': {}
		};

		if (parent)
			parent.activeChild = this;
	},
	
	flags: null,
	
	_verifyOpen: function _verify_buffer_is_open() {
		if (this.closed) {
			throw new Error("Buffer is closed!");
		} else if (this.activeChild) {
			throw new Error("A child buffer is active!");
		}
	},
	
	_genIndent: function _buffer_generate_indentation() {
		var indent = new Array(this.depth);
		for (var i = 0; i < this.depth; i++)
			indent[i] = this.indentText;
		return indent.join('');
	},
	
	spawn: function spawn_child_buffer() {
		this.flush();
		return new Loki.HTMLGenerator.Buffer(this);
	},
	
	setFlag: function set_buffer_flag(name, cancellation, value) {
		if (cancellation)
			cancellation = cancellation.toLowerCase();
		else
			cancellation = 'manual';
		
		if (typeof(name) != 'string') {
			throw new Error('Illegal buffer flag name "' + name + '".');
		} else if (!cancellation in this.flags) {
			throw new Error('Unknown flag cancellation "' + cancellation +
				'".');
		}
		
		this.clearFlag(name);
		this.flags[cancellation][name] = value || true;
		return this;
	},
	
	getFlag: function get_buffer_flag(name) {
		for (var c in this.flags) {
			var value = this.flags[c][name];
			if (typeof(value) != 'undefined')
				return value;
		}
		
		return undefined;
	},
	
	clearFlag: function clear_buffer_flag(name) {
		for (var c in this.flags) {
			delete this.flags[c][name];
		}
	},
	
	flagged: function is_buffer_flagged(name) {
		return typeof(this.getFlag(name)) != 'undefined';
	},
	
	write: function write_to_buffer(text) {
		var i, arg;
		
		this._verifyOpen();
		
		for (var flag_name in this.flags.write)
			delete this.flags.write[flag_name];
		
		for (i = 0; i < arguments.length; i++) {
			arg = String(arguments[i]);
			if (arg.length > 0)
				this.currentLine.push(arg);
		}
		
		return this;
	},
	
	flush: function flush_buffer(always_flush) {
		var line;
		
		this._verifyOpen();
		
		for (var flag_name in this.flags.flush)
			delete this.flags.flush[flag_name];
		
		if (this.currentLine.length == 0 && !always_flush) {
			return this;
		}
		
		line = this._genIndent() + this.currentLine.join('');
		this.lines.push(line);
		this.currentLine = [];
		return this;
	},
	
	endLine: function buffer_end_line(only_if_content) {
		return this.flush(!only_if_content);
	},
	
	close: function close_buffer() {
		this.flush(); // calls _verifyOpen
		this.closed = true;
		if (this.parent) {
			if (this.parent.closed) // should never happen, but be safe
				throw new Error("Parent buffer is closed!");
			base2.forEach(this.lines, function append_line(line) {
				this.parent.lines.push(line);
			}, this);
			this.parent.activeChild = null;
		}
		return this;
	},
	
	read: function read_buffer() {
		if (!this.closed) {
			throw new Error("Cannot read buffer contents: buffer still open.");
		}
		return this.lines.join("\n");
	}
});

Loki.HTMLGenerator.namedEntities = {
	'38': 'amp', '60': 'lt', '62': 'gt', '127': '#127',
	'160': 'nbsp', '161': 'iexcl', '162': 'cent', '163': 'pound', '164':
	'curren', '165': 'yen', '166': 'brvbar', '167': 'sect', '168': 'uml', '169':
	'copy', '170': 'ordf', '171': 'laquo', '172': 'not', '173': 'shy', '174':
	'reg', '175': 'macr', '176': 'deg', '177': 'plusmn', '178': 'sup2', '179':
	'sup3', '180': 'acute', '181': 'micro', '182': 'para', '183': 'middot',
	'184': 'cedil', '185': 'sup1', '186': 'ordm', '187': 'raquo', '188':
	'frac14', '189': 'frac12', '190': 'frac34', '191': 'iquest', '192':
	'Agrave', '193': 'Aacute', '194': 'Acirc', '195': 'Atilde', '196': 'Auml',
	'197': 'Aring', '198': 'AElig', '199': 'Ccedil', '200': 'Egrave', '201':
	'Eacute', '202': 'Ecirc', '203': 'Euml', '204': 'Igrave', '205': 'Iacute',
	'206': 'Icirc', '207': 'Iuml', '208': 'ETH', '209': 'Ntilde', '210':
	'Ograve', '211': 'Oacute', '212': 'Ocirc', '213': 'Otilde', '214': 'Ouml',
	'215': 'times', '216': 'Oslash', '217': 'Ugrave', '218': 'Uacute', '219':
	'Ucirc', '220': 'Uuml', '221': 'Yacute', '222': 'THORN', '223': 'szlig',
	'224': 'agrave', '225': 'aacute', '226': 'acirc', '227': 'atilde', '228':
	'auml', '229': 'aring', '230': 'aelig', '231': 'ccedil', '232': 'egrave',
	'233': 'eacute', '234': 'ecirc', '235': 'euml', '236': 'igrave', '237':
	'iacute', '238': 'icirc', '239': 'iuml', '240': 'eth', '241': 'ntilde',
	'242': 'ograve', '243': 'oacute', '244': 'ocirc', '245': 'otilde', '246':
	'ouml', '247': 'divide', '248': 'oslash', '249': 'ugrave', '250': 'uacute',
	'251': 'ucirc', '252': 'uuml', '253': 'yacute', '254': 'thorn', '255':
	'yuml', '8364': 'euro'
};

Loki.HTMLGenerator._options = (function() {
	var opts = new Loki.Configuration();
	opts.define("xhtml", true).alias("xhtml", "XHTML");
	opts.define("escapeNonASCII", true);
	opts.define("indentText", "\t");
	return opts;
})();