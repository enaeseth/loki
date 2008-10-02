// Class: Loki.URL
// Represents a uniform resource locator (URL).
//
// The general form of a URL is:
// > scheme://authority/path?query#fragment
// The authority consists of:
// > username:password@host:port
Loki.URL = Loki.Class.create({
	// var: scheme
	// The URL's scheme.
	scheme: null,
	
	// var: authority
	// The URL's authority.
	authority: null,
	
	// var: user
	// The URL's user.
	user: null,
	
	// var: password
	// The URL's password.
	password: null,
	
	// var: host
	// The URL's host.
	host: null,
	
	// var: port
	// The URL's port.
	port: null,
	
	// var: path
	// The URL's path.
	path: null,
	
	// var: query
	// The URL's query part.
	query: null,
	
	// var: fragment
	// The URL's fragment (i.e., anchor).
	fragment: null,
	
	// Constructor: URL
	// Parses a URL string.
	//
	// Parameters:
	//     (String) unparsed - the raw URL
	initialize: function URL(unparsed) {
		var match, authority_match;

		if (!unparsed)
			return;

		match = Loki.URL.pattern.exec(unparsed);

		if (!match) {
			throw new Error('Invalid URL: "' + unparsed + '".');
		}

		authority_match = (typeof(match[4]) == 'string' && match[4].length)
			? Loki.URL.authority_pattern.exec(match[4])
			: [];

		// this wouldn't need to be so convulted if JScript weren't so crappy!
		function get_match(source, index) {
			if (arguments.length == 1) {
				index = source;
				source = match;
			}

			try {
				if (typeof(source[index]) == 'string' && source[index].length) {
					return source[index];
				}
			} catch (e) {
				// ignore and return null below
			}

			return null;
		}

		var port = get_match(authority_match, 7);

		this.scheme = get_match(2);
		this.authority = get_match(4);
		this.user = get_match(authority_match, 2);
		this.password = get_match(authority_match, 4);
		this.host = get_match(authority_match, 5);
		this.port = (port) ? Number(port) : port;
		this.path = get_match(5);
		this.query = get_match(7);
		this.fragment = get_match(9);
	},
	
	// Method: parseQuery
	// Parses the URL's query portion into its constituent variables.
	//
	// Returns:
	//     (Object) - the parsed query string
	parseQuery: function parse_url_query() {
		return Loki.URL.parseQuery(this.query);
	},
	
	// Method: build
	// Encodes this URL into a string.
	//
	// Returns:
	//     (String) - the URL
	build: function build_url() {
		var uri = this.scheme || '';
		if (this.authority) {
			uri += '://' + this.authority;
		} else if (this.host) {
			uri += '://';
			if (this.user) {
				uri += this.user;
				if (this.password)
					uri += ':' + this.password;
				uri += '@';
			}

			uri += this.host;
			if (this.port)
				uri += ':' + this.port;
		} else {
			uri += ':///';
		}

		if (this.path)
			uri += this.path;
		if (this.query)
			uri += '?' + this.query;
		if (this.fragment)
			uri += '#' + this.fragment;

		return uri;
	},
	
	toString: function url_to_string() {
		return this.build();
	},
	
	// Method: appendToQuery
	// Appends the given parameters to this URL's query. If the URL already has
	// parameters with the same name as some in _params_, they will be
	// overwritten.
	//
	// Parameters:
	//     (Object) params - the query parameters to add
	//
	// Returns:
	//     (Loki.URL) - this URL
	appendToQuery: function url_append_to_query(params) {
		params = Loki.Object.extend(this.parseQuery(), params)
		this.query = Loki.URL.buildQuery(params);
		return this;
	},
	
	// Method: normalize
	// Expands the URL to absolute form, converts the hostname to lower case,
	// and removes redundant port information.
	//
	// Parameters:
	//     (String|Loki.URL) [base] - an explicit base URI; if not provided,
	//                                the current location will be used
	//
	// Returns:
	//     (Loki.URL) - this URL
	//
	// Throws:
	//     TypeError - if an invalid base URI is given
	normalize: function normalize_url(base) {
		if (typeof(base) == 'string') {
			base = new Loki.URL(base);
		} else {
			if (!base)
				base = new Loki.URL(window.location);
			else if (Loki.Object.isObject(base))
				base = Loki.Object.clone(base);
			else if (typeof(base) != 'object' || !base.path)
				throw new TypeError("Invalid base URI.");

			// take the path's basename and add a trailing slash:
			base.path = base.path.split('/').slice(0, -1).join('/') + '/';
		}

		if (!this.scheme) {
			this.scheme = base.scheme;
		}

		this.host = (this.host || base.host || '').toLowerCase();

		if (this.path.charAt(0) != '/') {
			this.path = base.path + this.path;
		}

		if (this.scheme == 'http' && this.port == 80)
			this.port = null;
		else if (this.scheme == 'https' && this.port == 443)
			this.port = null;

		return this;
	},
	
	// Method: equals
	// Checks to see if this URL is equal to another URL. This method normalizes
	// both URL's.
	//
	// Parameters:
	//     (Loki.URL) other - the URL being compared to this URL
	//
	// Returns:
	//     (Boolean) - true if the two URL's are equal, false if they are not
	equals: function url_equals(other) {
		this.normalize();
		other.normalize();
		
		if (!Loki.Object.equal(this.parse_query(), other.parse_query()))
			return false;
		
		return (this.scheme == other.scheme && this.host == other.host &&
			this.port == other.port && this.user == other.user &&
			this.password == other.password && this.path == other.path &&
			this.fragment == other.fragment);
	}
});

// Function: parseQuery
// Parse a URL query portion into its constituent variables.
//
// Parameters:
//     (String) query - the query portion to parse
//
// Returns:
//     (Object) - the parsed query string
Loki.URL.parseQuery = function parse_query(query) {
	var vars = {};
	
	if (!query)
		return vars;
	
	base2.forEach(query.replace(/^\?/, '').split(/[;&]/), function (part) {
		var keyvalue = part.split('='); // we can't simply limit the number of
		                                // splits or we'll lose any parts beyond
		                                // the first =
		var key = keyvalue.shift();
		var value = keyvalue.join('='); // undo any damage from the split
		
		vars[key] = value;
	});
	
	return vars;
};

// Function: buildQuery
// Builds a query fragment from an object.
//
// Parameters:
//     (Object) variables - the query variables/parameters
//     (String) [separator="&"] - the variable separator character
//
// Returns:
//     (String) - the query fragment
Loki.URL.buildQuery = function build_query(variables, separator) {
	var parts = [];
	
	Loki.Object.enumerate(variables, function(name, value) {
		parts.push(name + '=' + value);
	});
	
	return parts.join(separator || '&');
};

// Method: stripHTTP
// Strips a leading "http:" or "https:" from a URL string.
//
// Parameters:
//     (String) url - the URL
//
// Returns:
//     (String) - the protocol-stripped URL
Loki.URL.stripHTTP = function strip_http_from_url(url) {
	return (Object.is_string(url))
		? url.replace(/^https?:/, '')
		: null;
};

Loki.URL.pattern =
	new RegExp('^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?');
Loki.URL.authority_pattern =
	new RegExp('^(([^:@]+)(:([^@]+))?@)?([^:]+)(:(\\d+))?$');
