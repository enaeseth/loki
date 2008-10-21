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
	
	// var: (String) baseURL
	// The base URL of the Loki installation.
	baseURL: null,
	
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
			throw Loki.error("locale:string undefined in locale",
				requested_name, Loki.currentLocale.code);
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
		var requested_msg = message;
		message = Loki.currentLocale.getString(message);
		if (!message) {
			throw Loki.error("locale:string undefined in locale", requested_msg,
				Loki.currentLocale.code);
		}
		message = $vformat(message, base2.slice(arguments, 2));
		var error = new error_class(message);
		error.name = name;
		return error;
	},
	
	// Method: isDOMAvailable
	// Returns true if the DOM content is ready for Loki's owner document.
	//
	// Returns:
	//     (Boolean) - is the DOM content ready?
	isDOMAvailable: function loki_is_dom_available() {
		return Loki._ready;
	},
	
	// Method: runWhenReady
	// Adds a function to be run when the DOM content is loaded for Loki's
	// owner document. If the content is already loaded, the function is run
	// immediately.
	//
	// Parameters:
	//     (Function) fn - the function to execute
	//     (Object) [context=null] - the "this" context in which _fn_ will be
	//                               called
	runWhenReady: function loki_run_when_dom_available(fn, context) {
		var runner;
		
		if (!context) {
			runner = fn;
		} else {
			runner = function() {
				return fn.apply(context, arguments);
			};
		}
		
		if (Loki.isDOMAvailable()) {
			runner();
		} else {
			Loki._waitingForReady.push(runner);
		}
	},
	
	_waitingForReady: [],
	_ready: false
};

Loki.runWhenReady(function determine_loki_base_url() {
	var scripts = document.getElementsByTagName('SCRIPT');
	var pattern = /\loki\.js(\?[^#]*)?(#\S+)?$/;
	var url;
	
	for (var i = 0; i < scripts.length; i++) {
		if (pattern.test(scripts[i].src)) {
			// Found Loki!
			url = scripts[i].src.replace(pattern, '');
			// If we're running out of a source directory, loki.js will be
			// in a build/ subdirectory.
			Loki.baseURL = url.replace(/build\/$/, '');
		}
	}
});

(function loki_listen_for_dom_load() {
	function loki_run_ready_waiters() {
		Loki._ready = true;
		
		for (var i = 0; i < Loki._waitingForReady.length; i++) {
			Loki._waitingForReady[i]();
		}
		
		delete Loki._waitingForReady;
	}
	
	$extend(document).addEventListener("DOMContentLoaded",
		loki_run_ready_waiters, true);
})();

#import "object.js"
#import "class.js"
#import "dom.js"
#import "browser.js"
#import "parser.js"
#import "locale.js"
#import "notice.js"
#import "event.js"
#import "configuration.js"
#import "request.js"
#import "chooser.js"
#import "url.js"
#import "selection.js"
#import "html_generator.js"
#import "plugin.js"
#import "ui.js"
#import "editor.js"
