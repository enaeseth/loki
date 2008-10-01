// Class: Loki.Notice
// Represents a notice of an exceptional condition.
//
// There are four levels of notices:
//     error - A serious, possibly unrecoverable problem has been encountered.
//     warning - A problem with some operation where the operation was able to
//               complete, but perhaps not as well or as completely as it should
//               have.
//     notice - A small note.
//     debug - A debugging notice.
Loki.Notice = Loki.Class.create({
	// var: (String) level
	// The notice's severity level; level description are in the <Loki.Notice>
	// class description.
	level: null,
	
	// var: (String) message
	// The notice message.
	message: null,
	
	// var: (Number) intensity
	// The numeric value corresponding to the message's level.
	intensity: null,
	
	// Constructor: Notice
	// Creates a new notice object.
	//
	// Parameters:
	//     (String) level - the notice's severity level; possible levels are
	//                      given in the <Loki.Notice> class description
	//     (String) message - the message associated with the notice
	//     (Boolean) [localized=true] - if true, _message_ will be treated as a
	//               key to a localized string; if false, _message_ will be used
	//               verbatim
	//
	// Throws:
	//     ArgumentError - if the _level_ parameter does not specify a valid
	//                     level
	initialize: function Notice(level, message, localized) {
		if (typeof(localized) == "undefined" || localized === null)
			localized = true;
		
		this.intensity = Loki.Notice.levels[level];
		if (typeof(this.intensity) == "undefined") {
			throw Loki.error("ArgumentError", "notice:invalid level", level);
		}
		
		this.level = level;
		this.message = (localized)
			? Loki._(message)
			: message;
	},
	
	// Method: getMessageSummary
	// Gets a one-sentence summary of the notice's message.
	//
	// Returns:
	//     (String) - the summary
	getMessageSummary: function get_notice_message_summary() {
		var match = Loki.Notice._summary_pattern.exec(this.message);
		
		return (match)
			? match[1]
			: this.message;
	},
	
	// Method: getMessageHTML
	// Gets an HTML DOM view of the entire message.
	//
	// Parameters:
	//     (HTMLDocument) document - the document on which to construct the
	//                               DOM nodes
	//
	// Returns:
	//     (Node) - the message as HTML
	getMessageHTML: function get_notice_message_html(document) {
		return document.createTextNode(this.message);
	},
	
	// Method: toError
	// Converts the notice to an error.
	//
	// Returns:
	//     (Error) - an error representing this notice
	toError: function notice_to_error() {
		return new Error(this.message);
	},
	
	// Method: toString
	toString: function notice_to_string() {
		return $format("({level}) {message}", this);
	}
});

Loki.Notice.levels = {
	debug: 1,
	notice: 2,
	warning: 3,
	warn: 3,
	error: 4
};

Loki.Notice._summary_pattern = /^(.*?[\.\?\!])(\s|$)/;
