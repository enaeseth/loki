// Class: Loki.Configuration
// Provides an easy way to process option dictionaries.
Loki.Configuration = Loki.Class.create({
	// Constructor: Configuration
	// Creates a new configuration spec.
	//
	// Parameters:
	//     (Boolean) [translate_names=true] - Loki uses camelCase names
	//               internally, but many users may be more comfortable with
	//               underscore_separated names. If translate_names is set to
	//               true, camelCase option names will automatically receive
	//               underscored aliases. (For example,
	//               contentType => content_type, responseXML => response_xml.)
	initialize: function Configuration(translate_names) {
		this.translateNames = (!Loki.Object.isValid(translate_names))
			? true
			: translate_names;
		this.options = {};
		this.aliases = {};
	},
	
	// Method: define
	// Defines a new option.
	//
	// Parameters:
	//     (String) name - the option name
	//     (any) [default_val=null] - the option's default value
	//     (Function) [validator] - a function that will be called to validate
	//                              the option's value; it should throw an
	//                              exception if the value is invalid. If this
	//                              function returns a value, that value will
	//                              be used in place of the provided value.
	//
	// Returns:
	//     (Loki.Configuration) this
	define: function define_config_option(name, default_val, validator) {
		if (!name) {
			throw Loki.error("ArgumentError", "config:option without name");
		}
		
		this.options[name] = {
			defaultValue: default_val || null,
			validator: validator || base2.Undefined
		};
		
		if (this.translateNames) {
			var alt_name = this._translateName(name);
			if (alt_name != name)
				this.alias(name, alt_name);
		}
		
		return this;
	},
	
	// Method: alias
	// Defines an alias for an option.
	//
	// Parameters:
	//     (String) actual - the option's actual name
	//     (String) alias - the new alias
	//
	// Returns:
	//     (Loki.Configuration) - this
	alias: function create_config_alias(actual, alias) {
		this.aliases[alias] = actual;
	},
	
	// Method: process
	// Processes an option dictionary, perfoming validation, alias resolution,
	// and default value insertion.
	//
	// Parameters:
	//     (Object) options - the caller-specified options
	//
	// Returns:
	//     (Object) - the processed option object
	//
	// Throws:
	//     ConfigurationError - if any validation fails
	process: function process_configuration(options) {
		if (typeof(options) != 'object' || options === null)
			options = {};
		
		var name, real_name, spec, value, ce, new_value;
		var out = {};
		
		for (name in this.options) {
			out[name] = this.options[name].defaultValue;
		}
		
		for (name in options) {
			real_name = this._dealias(name);
			spec = this.options[real_name];
			
			if (!spec) {
				throw Loki.error("ConfigurationError", "config:unknown option");
			}
			
			value = options[name];
			try {
				new_value = this.options[real_name].validator.call(this, value);
				if (typeof(new_value) != 'undefined')
					value = new_value;
			} catch (e) {
				if (e.name == "ConfigurationError")
					throw e;
				
				ce = new Error(e.message || "Invalid " + real_name +
					" option.");
				ce.name = "ConfigurationError";
				throw ce;
			}
			
			out[real_name] = value;
		}
		
		return out;
	},
	
	_dealias: function _config_dealias_name(name) {
		var dealised;
		while (dealised = this.aliases[name]) {
			name = dealised;
		}
		return name;
	},
	
	_translateName: function _config_translate_name(name) {
		var camel = /([a-z])([A-Z]+)/g;
		
		function change_part(overall, small, big) {
			return small + "_" + big.toLowerCase();
		}
		
		return name.replace(camel, change_part);
	}
});
