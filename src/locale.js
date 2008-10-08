// Class: Loki.Locale
// Represents a specific geographical, political, or cultural region.
Loki.Locale = Loki.Class.create({
	// Constructor: Locale
	// Creates a new locale unless one already exists for the language-country
	// pair.
	//
	// Parameters:
	//     (String) language - the ISO-639 language code for the locale
	//     (String) [country] - the ISO-3166 country code for the locale, if any
	initialize: function Locale(language, country) {
		if (typeof(language) != 'string') {
			throw new TypeError("A locale's language must be a string.");
		} else if (country && typeof(country) != 'string') {
			throw new TypeError("If given, a locale's country must be a " +
				"string.");
		}
		
		var code = language.toLowerCase();
		if (country)
			code += "-" + country.toUpperCase();
		
		// Check if we've already created this locale; if so, return the
		// existing object.
		var existing = Loki.locales[code];
		if (typeof(existing) != "undefined")
			return existing;
		Loki.locales[code] = this;
		
		this.code = code;
		this.language = language.toLowerCase();
		this.country = (country) ? country.toUpperCase() : null;
		
		// If we're creating a locale for a country-language pair, ensure that
		// a locale exists for just the language.
		if (country && typeof(Loki.locales[language]) == "undefined") {
			this.parent = new Loki.Locale(language);
		} else {
			this.parent = Loki.Locale.getNative();
			if (this.parent == this || this.parent.language == language)
				this.parent = null;
		}
		
		this.strings = {};
	},
	
	// Method: getString
	getString: function locale_get_string(name) {
		var string = this.strings[name];
		if (typeof(string) == "undefined" && this.parent) {
			return this.parent.getString(name);
		}
		
		return string;
	},
	
	// Method: formatNumber
	// Formats a number according to the locale's conventions. The default
	// implementation does nothing but convert _num_ to a string.
	//
	// Parameters:
	//     (Number) num - the number to be formatted
	//
	// Returns:
	//     (String) the formatted number
	formatNumber: function locale_format_number(num) {
		if (this.parent)
			return this.parent.formatNumber(num);
		return String(num);
	},
	
	// Method: formatDate
	// Formats a date according to the locale's conventions. The default
	// implementation simply returns the date in YYYY-mm-dd format.
	//
	// Parameters:
	//     (Date) date - the date to be formatted
	//     (String) [format="medium"] - the format to use: short, medium, long, or
	//                                full
	//
	// Returns:
	//     (String) the formatted date
	formatDate: function locale_format_date(date, format) {
		if (this.parent)
			return this.parent.formatDate(date, format);
		return $format("{0|04d}-{1|02d}-{2|02d}",
			date.getFullYear(), date.getMonth(), date.getDate());
	},
	
	// Method: formatTime
	// Formats a time according to the locale's conventions. The default
	// implementation returns the date in 24-hour format.
	//
	// Parameters:
	//     (Date) time - the time to be formatted
	//     (String) [format="short"] - the format to use: short or long
	//
	// Returns:
	//     (String) the formatted time
	formatTime: function locale_format_time(time, format) {
		if (this.parent)
			return this.parent.formatTime(time, format);
		var formatted = $format("{0:02d}:{1:02d}", time.getHours(),
			time.getMinutes());
		if (format == "long")
			formatted += $format(":{0:02d}", time.getSeconds());
		return formatted;
	},
	
	// Method: pluralize
	// Converts a string to a plural form if necessary. The default
	// implementation does nothing and simply returns _string_.
	//
	// Parameters:
	//     (String) string - the string to possibly be converted
	//     (Number) num - the number of things described by _string_ that there
	//                    are
	//
	// Returns:
	//     (String) a properly-inflected string
	pluralize: function locale_pluralize(string, num) {
		if (this.parent)
			return this.parent.pluralize(string, num);
		return string;
	},
	
	// Method: setString
	setString: function locale_set_string(name, value) {
		this.strings[name] = value;
		return string;
	},
	
	// Method: setStrings
	setStrings: function locale_set_strings(strings) {
		Loki.Object.extend(this.strings, strings);
		return this;
	},
	
	// Method: setNumberFormatter
	setNumberFormatter: function locale_set_number_formatter(formatter) {
		if (typeof(formatter) != 'function') {
			throw new TypeError("The number formatter must be a function.");
		} else if (typeof(formatter.call(this, 1)) != 'string') {
			throw new TypeError("The number formatter must accept a number " +
				"and return a string.");
		}
		
		this.formatNumber = formatter;
		return this;
	},
	
	// Method: setNumberFormat
	setNumberFormat: function locale_set_number_format(dec_sep, group_sep,
		group_size)
	{
		return this.setNumberFormatter(function locale_format_number(num) {
			if (!isFinite(num))
				return String(num);
			
			var neg = num < 0;
			var parts = String(num).split(".");
			var int_part = parts[0];
			var dec_part = Number(parts[1]) || 0;
			
			if (!group_sep || !group_size) {
				return (dec_part == 0)
					? int_part
					: int_part + dec_sep + dec_part;
			}
			
			var group_count = Math.floor(int_part.length / group_size);
			var leftover = int_part.length % group_size;
			var groups = [];
			
			if (leftover > 0) {
				groups.push(int_part.substr(0, leftover));
			}
			
			for (var i = 0; i < group_count; i++) {
				groups.push(int_part.substr(leftover + (i * group_size),
					group_size));
			}
			
			groups = groups.join(group_sep);
			return (dec_part == 0)
				? groups
				: groups + dec_sep + dec_part;
		});
	},
	
	toString: function locale_to_string() {
		return this.code;
	}
});

// Function: get
Loki.Locale.get = function get_locale(code) {
	code = code.split(/[_-]/);
	return (code.length > 1)
		? new Loki.Locale(code[0], code[1])
		: new Loki.Locale(code[0]);
	// return Loki.locales[code] || null;
};

// Function: getNative
Loki.Locale.getNative = function get_native_locale() {
	return new Loki.Locale("en", "US");
}

Loki.locales = {};

Loki.currentLocale = (navigator.language || navigator.userLanguage)
	? Loki.Locale.get(navigator.language || navigator.userLanguage)
	: Loki.Locale.getNative();

#import "locales/english.js"
