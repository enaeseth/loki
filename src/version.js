// Namespace: Loki.Versions
// Contains functions for working with versions.
Loki.Versions = {
	// Method: parse
	// Parses a version into its constituent parts. Examples of valid versions:
	//    - 1.0
	//    - 2.0.45.2
	//    - 1.0.0a1
	//    - 2.0b3
	//    - 1.4rc5
	//
	// Parameters:
	//     (String) ver - the version string to parse
	//
	// Returns:
	//     (Object) - the parsed version
	//
	// Throws:
	//     SyntaxError - if _ver_ is not a valid version string
	parse: function parse_version(ver) {
		var pattern = Loki.Versions._versionPattern;
		var parts = pattern.exec(ver);
		var type;
		
		if (!parts) {
			throw Loki.error("SyntaxError", "version:invalid", ver);
		}
		
		type = (typeof(parts[2]) != 'undefined')
			? String(parts[2]).toLowerCase()
			: 'r';
		return {
			dotted: base2.map(parts[1].split('.'), function(v) { 
				return parseInt(v);
			}),
			type: Loki.Versions._versionTypeMap[type],
			modifier: (parts[3]) ? parseInt(parts[3]) : 0
		};
	},
	
	// Method: compare
	// Compares two versions.
	//
	// Parameters:
	//     (String) a - a version string
	//     (String) b - another version string
	//
	// Returns:
	//     (Number) - 0 if a and b are equal, < 0 if a < b, or > 0 if a > b
	compare: function compare_versions(a, b) {
		var i, diff, start, length;
		
		if (typeof(a) != 'object')
			a = Loki.Versions.parse(a);
		if (typeof(b) != 'object')
			b = Loki.Versions.parse(b);
			
		if (a.dotted.length != b.dotted.length) {
			// If the dotted parts of the versions are of unequal length,
			// pad the shorter one with 0's.
			start = Math.min(a.dotted.length, b.dotted.length);
			length = Math.max(a.dotted.length, b.dotted.length);
			for (i = start; i < length; i++) {
				if (!(i in b))
					b[i] = 0;
				else if (!(i in a))
					a[i] = 0;
			}
		}
		
		for (i = 0; i < a.dotted.length; i++) {
			diff = a.dotted[i] - b.dotted[i];
			if (diff != 0)
				return diff;
		}
		
		diff = a.type - b.type;
		if (diff != 0)
			return diff;
		
		return a.modifier - b.modifier;
	},
	
	_versionPattern: /^(\d+(?:\.\d+)*)[\s-]*(?:(a|b|g|rc)[\s-]*(\d+))?$/i,
	_versionTypeMap: {
		'a': 0,
		'b': 1,
		'g': 2,
		'rc': 3,
		'r': 4
	}
};
