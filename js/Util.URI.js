/**
 * Does nothing.
 *
 * @class Container for functions relating to URIs.
 */
Util.URI = function()
{
	throw new Error("Util.URI objects may not be constructed.");
};

/**
 * Determines whether or not two URI's are equal.
 *
 * Special handling that this function performs:
 *	- Does not distinguish between http and https.
 * 	- Domain-relative links are assumed to be relative to the current domain.
 * @param {string|object}
 * @param {string|object}
 * @return {boolean}
 */
Util.URI.equal = function uri_equal(a, b)
{
	var normalize = Util.URI.normalize;
	
	a = normalize(a);
	b = normalize(b);
	
	if (!Util.Object.equal(this.parse_query(a.query), this.parse_query(b.query)))
		return false;
	
	return (a.scheme == b.scheme && a.host == b.host && a.port == b.port &&
		a.user == b.user && a.password == b.password && a.path == b.path &&
		a.fragment == b.fragment);
}

/**
 * Parses a URI into its constituent parts.
 */
Util.URI.parse = function parse_uri(uri)
{
	var match = Util.URI.uri_pattern.exec(uri);
	
	if (!match) {
		throw new Error('Invalid URI: "' + uri + '".');
	}
	
	var authority_match = (typeof(match[4]) == 'string' && match[4].length)
		? Util.URI.authority_pattern.exec(match[4])
		: [];
	
	// this wouldn't need to be so convulted if JScript weren't so crappy!
	function get_match(source, index)
	{
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
	
	return {
		scheme: get_match(match, 2),
		authority: get_match(match, 4),
		user: get_match(authority_match, 2),
		password: get_match(authority_match, 4),
		host: get_match(authority_match, 5),
		port: (port ? Number(port) : port),
		path: get_match(match, 5),
		query: get_match(match, 7),
		fragment: get_match(match, 9)
	};
}

/**
 * Parses a query fragment into its constituent variables.
 */
Util.URI.parse_query = function parse_query(fragment)
{
	var vars = {};
	
	if (!fragment)
		return vars;
	
	fragment.replace(/^\?/, '').split(/[;&]/).each(function (part) {
		var keyvalue = part.split('='); // we can't simply limit the number of
		                                // splits or we'll use any parts beyond
		                                // the first =
		var key = keyvalue.shift();
		var value = keyvalue.join('='); // undo any damage from the split
		
		vars[key] = value;
	});
	
	return vars;
}

/**
 * Builds a query fragment from an object.
 */
Util.URI.build_query = function build_query(variables)
{
	var parts = [];
	
	Util.Object.enumerate(variables, function(name, value) {
		parts.push(name + '=' + value);
	});
	
	return parts.join('&');
}

/**
 * Builds a URI from a parsed URI object.
 */
Util.URI.build = function build_uri_from_parsed(parsed)
{
	var uri = parsed.scheme || '';
	if (parsed.authority) {
		uri += '://' + parsed.authority;
	} else if (parsed.host) {
		uri += '://';
		if (parsed.user) {
			uri += parsed.user;
			if (parsed.password)
				uri += ':' + parsed.password;
			uri += '@';
		}
		
		uri += parsed.host;
		if (parsed.port)
			uri += ':' + parsed.port;
	}
	
	if (parsed.path)
		uri += parsed.path;
	if (parsed.query)
		uri += '?' + parsed.query;
	if (parsed.fragment)
		uri += '#' + parsed.fragment;
	
	return uri;
}

/**
 * Safely appends query parameters to an existing URI.
 * Previous occurrences of a query parameter are replaced.
 */
Util.URI.append_to_query = function append_params_to_query(uri, params)
{
	var parsed = Util.URI.parse(uri);
	var query_params = Util.URI.parse_query(parsed.query);
	
	Util.Object.enumerate(params, function(name, value) {
		query_params[name] = value;
	});
	
	parsed.query = Util.URI.build_query(query_params);
	return Util.URI.build(parsed);
}

/**
 * Normalizes a URI, expanding it to an absolute form and removing redundant
 * port information.
 * @param {string|object}	uri	a parsed URI object or a URI string
 * @param {string|object}	[base]	an explicit base URI to use
 * @return {object}	the parsed normalized URI
 */
Util.URI.normalize = function normalize_uri(uri, base)
{
	if (typeof(base) == 'string') {
		base = Util.URI.parse(base);
	} else {
		if (!base)
			base = Util.URI.parse(window.location);
		else if (Util.is_object(base))
			base = Util.Object.clone(base);
		else if (typeof(base) != 'object' || typeof(base.path) == 'undefined')
			throw new TypeError("Invalid base URI.");
		
		// take the path's basename and add a trailing slash:
		base.path = base.path.split('/').slice(0, -1).join('/') + '/';
	}
	
	if (typeof(uri) != 'string') {
		if (uri.scheme === undefined)
			throw TypeError();
		uri = Util.Object.clone(uri);
	} else {
		uri = Util.URI.parse(uri);
	}
	
	if (!uri.scheme) {
		uri.scheme = base.scheme;
	} else if (uri.scheme = 'https') {
		if (uri.port == 443)
			uri.port = null;
		uri.scheme = 'http';
	}
	
	if (!uri.host)
		uri.host = base.host;
	
	if (uri.path.charAt(0) != '/') {
		uri.path = base.path + uri.path;
	}
		
	if (uri.scheme == 'http' && uri.port == 80)
		uri.port = null;
		
	return uri;
}

/**
 * Strips leading "https:" or "http:" from a uri, to avoid warnings about
 * mixing https and http. E.g.: https://apps.carleton.edu/asdf ->
 * //apps.carleton.edu/asdf.
 * 
 * @param	{string}	uri			the uri
 */
Util.URI.strip_https_and_http = function strip_https_and_http(uri)
{
	return (typeof(uri) == 'string')
		? uri.replace(new RegExp('^https?:', ''), '')
		: null;
};

/**
 * Extracts the domain name from the URI.
 * @param	uri	the URI
 * @return	the domain name or null if an invalid URI was provided
 */
Util.URI.extract_domain = function extract_domain_from_uri(uri)
{
	var match = Util.URI.uri_pattern.exec(uri);
	return (!match || !match[4]) ? null : match[4].toLowerCase();
};

/**
 * Makes the given URI relative to its domain
 * (i.e. strips the protocol and domain).
 */
Util.URI.make_domain_relative = function make_uri_domain_relative(uri)
{
	return uri.replace(Util.URI.protocol_host_pattern, '');
}

Util.URI.uri_pattern =
	new RegExp('^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?',
	'i');
Util.URI.authority_pattern =
	new RegExp('^(([^:@]+)(:([^@]+))?@)?([^:]+)(:(\d+))?$');
Util.URI.protocol_host_pattern =
	new RegExp('^(([^:/?#]+):)?(//([^/?#]*))?', 'i');