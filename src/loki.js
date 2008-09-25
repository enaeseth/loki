#import "utilities.js"

/* 
 * Package: Loki
 *
 * The root package for all code for the Loki editor.
 */
var Loki = window.Loki = {
	// var: (String) version
	// The Loki version number.
	version: LOKI_VERSION,
	
	// var: (Loki.Locale) currentLocale
	// The active Loki locale.
	currentLocale: null,
	
	// Function: _
	// Gets and formats a string for display under the current locale.
	//
	// Parameters:
	//     (String) name - the name of the locale-specific string
	//     (any) ... - any indexed format arguments
	//     (Object) [kwargs] - any named format arguments
	//
	// Returns:
	//     (String) the formatted string
	//
	// Throws:
	//     Error - if no locale string named _name_ is defined in the current
	//             locale or recursively in any of its parent locales
	//     TypeError - if _name_ is not a string
	_: function loki_gettext(name) {
		var requested_name;
		
		if (typeof(name) != 'string') {
			throw new TypeError("Must provide the name of a locale string.");
		} else if (!Loki.currentLocale) {
			Loki.currentLocale = Loki.Locale.get(navigator.language || "en-US");
		}
		
		requested_name = name;
		arguments[0] = Loki.currentLocale.getString(name);
		if (!arguments[0]) {
			throw new Error(
				'The locale string "' + requested_name + '" is undefined. (' +
				'The current locale is "' + Loki.currentLocale.code + '").'
			);
		}
		return $format.apply(null, arguments);
	},
	
	// Function: error
	// Convenience method for constructing an error object with a localized
	// error message and a name.
	//
	// Parameters:
	//     (String) name - the desired name for the error
	//     (String) message - the desired error message
	//     (any) [...] - desc
	//
	// Returns:
	//     (Error) an error whose _name_ property has been set to the desired
	//             name
	error: function loki_create_error(name, message) {
		var error_class = window[name] || Error;
		message = $vformat(Loki.currentLocale.getString(message),
			base2.slice(arguments, 2));
		var error = new error_class(message);
		error.name = name;
		return error;
	}
};

#import "object.js"
#import "class.js"
#import "dom.js"
#import "browser.js"
#import "parser.js"
#import "locale.js"
#import "chooser.js"
#import "event.js"
#import "url.js"
#import "ui.js"
#import "editor.js"
