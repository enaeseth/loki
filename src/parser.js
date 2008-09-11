// Class: Loki.Parser
// A simple string parser.
Loki.Parser = Loki.Class.create({
	// Constructor: Parser
	// Creates a new parser.
	//
	// Parameters:
	//     (String) string - the string to parse
	initialize: function Parser(string) {
		if (!string) {
			throw new Error("Must provide a string to parse.");
		} else if (typeof(string) != 'string') {
			throw new TypeError("Cannot parse non-strings.");
		}
		
		this.string = string;
		this.length = string.length;
		this.pos = 0;
		
		this.match = null;
	},
	
	// Method: terminated
	// Checks to see if the parser has reached the end of the input.
	//
	// Returns:
	//     (Boolean) true if the parser has reached the end of the input, false
	//               if otherwise
	terminated: function parser_has_terminated() {
		return this.pos >= this.length;
	},
	
	// Method: scan
	scan: function parser_scan(sel) {
		var scanned;
		
		if (typeof(sel) == "undefined")
			sel = 1;
		
		if (typeof(sel) == "number") {
			scanned = this.string.substr(this.pos, sel);
			this.pos += sel;
			if (this.pos > this.length)
				this.pos = this.length;
			return scanned;
		} else if (typeof(sel) == "string") {
			if (this.string.indexOf(sel, this.pos) == this.pos) {
				this.pos += sel.length;
				return sel;
			}
			return null;
		} else if (Loki.Object.isRegExp(sel)) {
			throw new Error("not yet implemented");
		} else {
			throw new TypeError();
		}
	},
	
	// Method: unscan
	unscan: function parser_unscan(sel) {
		if (typeof(sel) == "undefined")
			sel = 1;
		
		if (typeof(sel) == "number") {
			if (this.pos - sel < 0) {
				throw new RangeError("Cannot unscan " + sel + " characters; " +
					"would go beyond beginning of input.");
			}
			
			this.pos -= sel;
			return sel;
		}
	},
	
	// Method: scanUntil
	scanUntil: function parser_scan_until(stopper) {
		var start = this.pos;
		this.pos = this.string.indexOf(stopper, start);
		if (this.pos < 0)
			this.pos = this.length;
		return this.string.substring(start, this.pos);
	},
	
	// Method: scanUntilChars
	scanUntilChars: function parser_scan_until_chars(list) {
		var pos = this.pos;
		var start = pos;
		while (pos < this.length && list.indexOf(this.string.charAt(pos)) < 0) {
			pos++;
		}
		this.pos = pos;
		return this.string.substring(start, pos);
	},
	
	// Method: skipWhitespace
	skipWhitespace: function parser_skip_whitespace() {
		var pos = this.pos;
		var data = this.string;
		while (pos < this.length && " \n\r\t".indexOf(data.charAt(pos)) >= 0) {
			pos++;
		}
		this.pos = pos;
	}
});
