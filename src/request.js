// Class: Loki.Request
// Asynchronus HTTP requests (an XMLHttpRequest wrapper).
// Mixes in <Loki.EventTarget>.
//
// Events:
//     
Loki.Request = Loki.Class.create({
	// Constructor: Request
	// Creates and sends a new HTTP request.
	//
	// Parameters:
	//     (String) url - the URL to request, or null to delay sending it
	//     (Object) [options] - request options
	//
	// Throws:
	//     UnsupportedError - if the user's browser lacks XMLHttpRequest support
	initialize: function Request(url, options) {
		this.options = Loki.Request._configuration.process(options);
		
		this.transport = this._createTransport();
		
		this.url = null;
		this.method = null;
		
		base2.forEach(Loki.Request._easyEvents, function(ev_name) {
			if (!this.options[ev_name])
				return;
			
			this.addEventListener(ev_name.substr(2).toLowerCase(),
				this.options[ev_name]);
		}, this);
		
		if (url)
			this.request(url);
	},
	
	_createTransport: function _create_request_transport() {
		if (typeof(XMLHttpRequest) != 'undefined') {
			return new XMLHttpRequest();
		} else if (typeof(ActiveXObject) != 'undefined') {
			try {
				return new ActiveXObject('Msxml2.XMLHTTP');
			} catch (e) {
				try {
					return new ActiveXObject('Microsoft.XMLHTTP');
				} catch (f) {
					throw Loki.error("UnsupportedError", "request:no xhr");
				}
			}
		} else {
			throw Loki.error("UnsupportedError", "request:no xhr");
		}
	},
	
	// Method: request
	// Sends the request. It is only necessary to call this method if a null
	// URL was passed to the constructor.
	//
	// Parameters:
	//     (String) url - the URL to request
	request: function send_http_request(url) {
		this.url = url;
		this.method = this.options.method;
		
		var params = Loki.Object.clone(this.options.parameters);
		this.parameters = params;
		
		var query = Loki.URL.buildQuery(params);
		if (query) {
			// Query parameters should be appended to the URL when making a GET
			// request.
			if (this.method == "GET") {
				this.url = this.url + (this.url.indexOf('?') >= 0 ? '&' : '?')
					+ query;
			} else if (/Konqueror|Safari|KHTML/.test(navigator.userAgent)) {
				query += '&_=';
			}
		}
		
		this.fireEvent("create");
		
		if (this.options.timeout) {
			function request_timed_out() {
				this._abort(false);
				this.fireEvent("timeout", this._response);
				this.fireEvent("failure", this._response);
			}
			this._timeout = setTimeout(base2.bind(request_timed_out, this),
				this.options.timeout);
		}
		
		try {
			this.transport.open(this.method, this.url,
				this.options.asynchronus);
			this._response = new Loki.Response(this);
			if (this.options.asynchronus)
				setTimeout(base2.bind(this._respondToReadyState, this), 1);
		
			function request_ready_state_changed() {
				var state = this.transport.readyState;
				if (state > 1 && !(this._completed && state == 4))
					this._respondToReadyState(state);
			}
			this.transport.onreadystatechange =
				base2.bind(request_ready_state_changed, this);
		
			this._setHeaders();
		
			var body = this.options.postBody || query;
			if (this.method == "POST" || this.method == "PUT")
				this.transport.send(body);
			else
				this.transport.send(null);
		} catch (e) {
			if (this._timeout) {
				clearTimeout(this._timeout);
				delete this._timeout;
			}
			throw e;
		}
	},
	
	// Method: abort
	// Aborts the request.
	//
	// Returns:
	//     (void) - Nothing.
	abort: function abort_request() {
		this._abort(true);
	},
	
	_respondToReadyState: function _respond_to_request_ready_state(code) {
		var state = Loki.Request.events[code];
		var response = this._response;
		
		if (state == "complete") {
			if (this._timeout) {
				clearTimeout(this._timeout);
				delete this._timeout;
			}
			
			this._completed = true;
			this.fireEvent(String(response.getStatus()), response);
			this.fireEvent(response.successful() ? "success" : "failure",
				response);
		}
		
		if (state)
			this.fireEvent(state, response);
		
		if (state == "complete") {
			this.transport.onreadystatechange = base2.Undefined;
			this._response = null; // kill reference cycle, just in case
		}
	},
	
	_abort: function _abort_request(notify) {
		this.transport.onreadystatechange = base2.Undefined;
		
		try {
			if (notify)
				this.fireEvent("abort", this._response);
			
			if (this._timeout) {
				clearTimeout(this._timeout);
				delete this._timeout;
			}
			
			this.transport.abort();
		} catch (e) {
			// ignore
		}
	},
	
	_setHeaders: function _set_request_headers() {
		var headers = {
			'X-Requested-With': 'XMLHttpRequest', // prototype compat.
			'X-Loki': Loki.version,
			'Accept':
				'text/javascript, text/html, application/xml, text/xml, */*'
		};
		
		if (this.method == "POST" || this.method == "PUT") {
			var ctype = this.options.contentType;
			if (this.options.encoding)
				ctype += '; charset=' + this.options.encoding;
		}
		
		if (typeof(this.options.requestHeaders) == "object") {
			Loki.Object.enumerate(this.options.requestHeaders, function(k, v) {
				headers[k] = [v];
			});
		}
		
		var transport = this.transport;
		Loki.Object.enumerate(headers, function(name, value) {
			transport.setRequestHeader(name, value);
		});
	}
});
Loki.Class.mixin(Loki.Request, Loki.EventTarget);

Loki.Request.events =
	['uninitialized', 'ready', 'send', 'interactive', 'complete'];
Loki.Request._easyEvents = [
	'onCreate', 'onUninitialized', 'onReady', 'onSend', 'onInteractive',
	'onComplete', 'onSuccess', 'onFailure'
];

// Class: Loki.Response
// Respresents a response by a server to a <Loki.Request>.
Loki.Response = Loki.Class.create({
	// var: (Loki.Request) request
	// The request object that generated this response.
	request: null,
	
	// var (XMLHttpRequest) transport
	// The XMLHttpRequest object that generated this response.
	transport: null,
	
	initialize: function Response(request) {
		this.request = request;
		this.transport = request.transport;
	},
	
	getStatus: function get_response_status() {
		try {
			return this.transport.status || 0;
		} catch (e) {
			return 0;
		}
	},
	
	getStatusText: function get_response_status_text() {
		try {
			return this.transport.statusText || '';
		} catch (e) {
			return '';
		}
	},
	
	getText: function get_response_text() {
		try {
			return this.transport.responseText || '';
		} catch (e) {
			return '';
		}
	},
	
	successful: function was_request_successful() {
		var status = this.getStatus();
	    return !status || (status >= 200 && status < 300);
	},
	
	getHeader: function get_response_header(name) {
		try {
			return this.transport.getResponseHeader(name) || null;
		} catch (e) {
			return null;
		}
	},
	
	getHeaders: function get_all_response_headers() {
		try {
			return this.transport.getAllResponseHeaders() || null;
		} catch (e) {
			return null;
		}
	},
	
	evaluate: function eval_response() {
		return eval(this.getText());
	}
});

(function setup_request_config_spec() {
	var cfg = new Loki.Configuration();
	
	function capitalize(name) {
		return name.charAt(0).toUpperCase() + name.substr(1);
	}
	
	cfg.define("method", "POST", function(method) {
		if (typeof(method) != 'string')
			throw new TypeError("The request HTTP method must be a string.");
		return method.toUpperCase();
	});
	cfg.define("asynchronus", true).alias("asynchronus", "async");
	cfg.define("contentType", "application/x-www-form-urlencoded");
	cfg.define("encoding", "UTF-8").alias("encoding", "charset");
	cfg.define("parameters", {}, function(params) {
		if (typeof(params) == "string")
			return Loki.URL.parseQuery(params);
	}).alias("parameters", "params");
	cfg.define("requestHeaders", {}, function(headers) {
		if (headers === null)
			return {};
		if (typeof(headers) != 'object')
			throw Loki.error("TypeError", "request:non-object headers");
	});
	cfg.define("timeout", null);
	cfg.define("postBody", null);
	
	cfg.define("onCreate", null).alias("onCreate", "onCreation");
	base2.forEach(Loki.Request.events, function(ev) {
		cfg.define("on" + capitalize(ev), null);
	});
	cfg.define("onSuccess", null);
	cfg.define("onFailure", null);
	
	Loki.Request._configuration = cfg;
})();
