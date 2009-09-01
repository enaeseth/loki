/**
 * Declares instance variables.
 *
 * @constructor
 *
 * @class A SAX-style tolerant HTML parser that doesn't rely on the browser.
 * @author Eric Naeseth
 */
Util.HTML_Parser = function SAX_HTML_Parser()
{
	var data = null;
	var parsing = false;
	var halted = false;
	var position = 0;
	var listeners = {
		open: [],
		close: [],
		text: [],
		cdata: [],
		comment: []
	};
	
	var self_closing_tags = Util.HTML_Parser.self_closing_tags.toSet();
	
	// -- Public Methods --
	
	this.add_listener = function add_html_parse_listener(type, func)
	{
		listeners[type.toLowerCase()].push(func);
	}
	
	// consistency
	this.add_event_listener = this.add_listener;
	
	this.parse = function parse_html(text)
	{
		data = text;
		position = 0;
		var state = starting_state;
		var len = data.length;
		
		parsing = true;
		halted = false;
		do {
			state = state();
		} while (state && position < len && !halted);
		parsing = halted = false;
	}
	
	this.halt = function halt_html_parser()
	{
		if (!parsing)
			return false;
		return (halted = true);
	}
	
	// -- Parsing Functions --
	
	function unscan_character()
	{
		position--;
	}
	
	function unscan_characters(number)
	{
		position -= number;
	}
	
	function ignore_character()
	{
		position++;
	}
	
	function ignore_characters(number)
	{
		position += number;
	}
	
	function scan_character()
	{
		return (position < data.length)
			? data.charAt(position++)
			: null;
	}
	
	function expect(s)
	{
		var len = s.length;
		if (position + len < data.length && data.indexOf(s, position) == position) {
			position += len;
			return true;
		}
		
		return false;
	}
	
	function scan_until_string(s)
	{
		var start = position;
		position = data.indexOf(s, start);
		if (position < 0)
			position = data.length;
		return data.substring(start, position);
	}
	
	function scan_until_characters(list)
	{
		var start = position;
		while (position < data.length && list.indexOf(data.charAt(position)) < 0) {
			position++;
		}
		return data.substring(start, position);
	}
	
	function ignore_whitespace()
	{
		while (position < data.length && " \n\r\t".indexOf(data.charAt(position)) >= 0) {
			position++;
		}
	}
	
	function character_data(data)
	{
		var cdata_listeners = (listeners.cdata.length > 0)
			? listeners.cdata
			: listeners.text;
		
		cdata_listeners.each(function(l) {
			l(data);
		});
	}
	
	function text_data(data)
	{
		listeners.text.each(function(l) {
			l(data);
		});
	}
	
	function comment(contents)
	{
		listeners.comment.each(function(l) {
			l(data);
		});
	}
	
	function tag_opened(name, attributes)
	{
		listeners.open.each(function(l) {
			l(name, attributes);
		});
	}
	
	function tag_closed(name)
	{
		listeners.close.each(function(l) {
			l(name);
		});
	}
	
	// -- State Functions --
	
	function starting_state()
	{
		var cdata = scan_until_string('<');
		if (cdata) {
			text_data(cdata);
		}
		
		ignore_character();
		return tag_state;
	}
	
	function tag_state()
	{
		switch (scan_character()) {
			case '/':
				return closing_tag_state;
			case '?':
				return processing_instruction_state;
			case '!':
				return escape_state;
			default:
				unscan_character();
				return opening_tag_state;
		}
	}
	
	function opening_tag_state()
	{
		function parse_attributes()
		{
			var attrs = {};
			
			do {
				ignore_whitespace();
				var name = scan_until_characters("=/> \n\r\t");
				if (!name)
					break;
				var value = null;
				ignore_whitespace();
				var next_char = scan_character();
				if (next_char == '=') {
					// value provided; figure out what (if any) quoting style
					// is in use
					
					ignore_whitespace();
					var quote = scan_character();
					if ('\'"'.indexOf(quote) >= 0) {
						// it's quoted; find the matching quote
						value = scan_until_string(quote);
						ignore_character(); // skip over the closer
					} else {
						// unquoted; find the end
						unscan_character();
						value = scan_until_characters("/> \n\r\t");
					}
				} else {
					// value implied (e.g. in <option selected>)
					unscan_character();
					value = name;
				}
				
				attrs[name] = value;
			} while (true);
			
			return attrs;
		}
		
		var tag = scan_until_characters("/> \n\r\t");
		if (tag) {
			var attributes = parse_attributes(); // last step ignores whitespace
			tag_opened(tag, attributes);
			
			var next_char = scan_character();
			if (next_char == '/') {
				// self-closing tag (XML-style)
				tag_closed(tag);
				ignore_whitespace();
				next_char = scan_character(); // advance to the "<"
			} else if (tag.toUpperCase() in self_closing_tags) {
				// self-closing tag (known HTML tag)
				tag_closed(tag);
			}
			
			if (next_char != '>') {
				// oh my, what on earth?
				throw new Util.HTML_Parser.Error('Opening tag not terminated ' +
					'by ">".');
			}
		}
		
		return starting_state;
	}
	
	function closing_tag_state()
	{
		var tag = scan_until_characters('/>');
		if (tag) {
			var next_char = scan_character();
			if (next_char == '/') {
				next_char = scan_character();
				if (next_char != '>') {
					// oh my, what on earth?
					throw new Util.HTML_Parser.Error('Closing tag not ' +
						'terminated by ">".');
				}
			}
			
			tag_closed(tag);
		}
		
		return starting_state;
	}
	
	function escape_state()
	{
		var data;
		
		if (expect('--')) {
			// comment
			data = scan_until_string('-->');
			if (data)
				comment(data);
			ignore_characters(2);
		} else if (expect('[CDATA[')) {
			// CDATA section
			data = scan_until_string(']]>');
			if (data)
				character_data(data);
			ignore_characters(2);
		} else {
			scan_until_string('>');
		}
		
		ignore_character();
		return starting_state;
	}
	
	function processing_instruction_state()
	{
		scan_until_string('?>');
		ignore_characters(2);
		
		return starting_state;
	}
}

/**
 * Constructs a new HTML parse error.
 * @class An HTML parse error.
 * @constructor
 * @extends Error
 */
Util.HTML_Parser.Error = function HTML_Parse_Error(message)
{
	Util.OOP.inherits(this, Error, message);
	this.name = 'HTML_Parse_Error';
}

Util.HTML_Parser.self_closing_tags = ['BR', 'AREA', 'LINK', 'IMG', 'PARAM',
	'HR', 'INPUT', 'COL', 'BASE', 'META'];
