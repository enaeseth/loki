




var Crucible = {
	



	version: "0.2a1",
	
	



	base: null,
	
	



	handlers: [],
	
	




	addSourceHandler: function add_source_handler(handler) {
		Crucible.handlers.push(handler);
	},
	
	





	getHandler: function get_source_handler(source) {
		var i, len;
		for (i = 0, len = Crucible.handlers.length; i < len; ++i) {
			if (Crucible.handlers[i].handles(source))
				return Crucible.handlers[i];
		}
		
		throw new Error('No source handler accepted the given source.');
	},
	
	







	augment: function augment_object(destination, source, overwrite) {
		if (typeof(overwrite) == 'undefined' || overwrite === null)
			overwrite = true;
		for (var name in source) {
			if (overwrite || !(name in destination))
				destination[name] = source[name];
		}
		return destination;
	},
	
	



	equal: function objects_equal(a, b) {
		var seen;
		if (typeof(a) != 'object') {
			return (typeof(b) == 'object')
				? false
				: (a == b);
		} else if (typeof(b) != 'object') {
			return false;
		}

		seen = {};

		for (var name in a) {
			if (name in Object.prototype)
				continue;
			if (!(name in b && Crucible.equal(a[name], b[name])))
				return false;
			seen[name] = true;
		}

		for (var name in b) {
			if (name in Object.prototype)
				continue;
			if (!(name in seen))
				return false;
		}

		return true;
	},
	
	arrayFrom: function array_from_iterable(iterable) {
		if (!iterable) return [];

		var length = iterable.length || 0
		var results = new Array(length);
		for (var i = 0; i < length; i++)
			results[i] = iterable[i];
		return results;
	},
	
	observeEvent: function observe_event(target, name, handler) {
		if (target.addEventListener) {
			target.addEventListener(name, handler, false);
		} else if (target.attachEvent) {
			function ie_event_wrapper(ev) {
				if (!ev)
					ev = window.event;
				if (!ev.target && ev.srcElement)
					ev.target = ev.srcElement;
				if (!ev.relatedTarget) {
					if (ev.type == 'mouseover' && ev.fromElement)
						ev.relatedTarget = ev.fromElement;
					else if (ev.type == 'mouseout' && ev.toElement)
						ev.relatedTarget = ev.toElement;
				}
				if (!ev.stopPropagation) {
					ev.stopPropagation = function() {
						this.cancelBubble = true;
					}
				}
				if (!ev.preventDefault) {
					ev.preventDefault = function() {
						this.returnValue = false;
					}
				}
				
				handler.call(this, ev);
			}
			target.attachEvent('on' + name, ie_event_wrapper);
		} else {
			throw new Error('No modern event API available.');
		}
	},
	
	bind: function bind_function(function_, thisp) {
		if (typeof(thisp) == 'undefined')
			return function_; // no wrapping needed
		return function binder() {
			return function_.apply(thisp, arguments);
		};
	},
	
	delay: function delay_function(function_, timeout, thisp) {
		var args = Crucible.arrayFrom(arguments).slice(3);
		return window.setTimeout(function delayer() {
			return function_.apply(thisp || null, args);
		}, timeout * 1000);
	},
	
	defer: function defer_function(function_, thisp) {
		var args = [function_, 0.01, thisp || null], i;
		for (i = 2; i < arguments.length; i++)
			args.push(arguments[i]);
		return Crucible.delay.apply(Crucible, args);
	},
	
	addStyleSheet: function add_style_sheet(path) {
		var heads = document.getElementsByTagName('HEAD');
		var head, link;
		
		if (!heads.length)
			throw new Error('Document has no HEAD.');
		head = heads[0];
		
		link = document.createElement('LINK');
		link.rel = 'stylesheet';
		link.type = 'text/css';
		link.href = path;
		return head.appendChild(link);
	},
	
	determineBase: function determine_base_uri() {
		if (Crucible.base)
			return Crucible.base;
		
		var scripts = document.getElementsByTagName('SCRIPT');
		var pattern = /\bcrucible\.js(\?[^#]*)?(#\S+)?$/;
		
		for (var i = 0; i < scripts.length; i++) {
			if (pattern.test(scripts[i].src)) {
				// Found Crucible!
				return Crucible.base = scripts[i].src.replace(pattern, '');
			}
		}
		
		throw new Error('Unable to automatically determine the Crucible base ' +
			'URI. Please explicitly set the Crucible.base property.');
	},
	
	




	objectKeys: function object_keys(obj) {
		var keys = [];
		for (var name in obj)
			keys.push(name);
		return keys;
	},
	
	



	emptyFunction: function() {
		// do nothing
	},
	
	




	constantFunction: function(value) {
		return value;
	}
};


Crucible.Failure = function Failure(test, message) {
	var err = new Error('Failure in test "' + test.name + '": ' + message)
	
	err.name = "Crucible.Failure";
	err.description = message || null;
	err.test = test || null;
	
	err._crucible_failure = true;
	
	return err;
};

Crucible.ExpectationFailure =
	function ExpectationFailure(test, expected, actual) 
{
	var err;
	var expected_r = Crucible.Tools.inspect(expected);
	var actual_r = Crucible.Tools.inspect(actual);
	var message = 'Expected ' + expected_r + ' but actually got ' +
		actual_r + '.';
	var html_message = 'Expected <code>' + expected_r + '</code> but actually' +
		' got <code>' + actual_r + '</code>.';
	
	err = new Crucible.Failure(test, message);
	err.htmlDescription = html_message;
	err.name = "Crucible.ExpectationFailure";
	err.description = message;
	err.test = test;
	
	return err;
};

Crucible.AsyncCompletion = function AsyncCompletion() {
	Error.call(this, 'Test will be completed asynchronusly. (Not an error.)');
	this.name = "Crucible.AsyncCompletion";
};

Crucible.AsyncCompletion.prototype = new Error(null);

Crucible.UnexpectedError = function UnexpectedError(test, error) {
	Error.call(this, 'Unexpected ' + error.name + ' thrown from test "' +
		test.name + '": ' + error.message);
	this.name = "Crucible.UnexpectedError";
	this.error = error;
};

Crucible.UnexpectedError.prototype = new Error(null);

Crucible.Tools = {
	
	inspect: function inspect_object(obj) {
		return Crucible.Tools.inspect.handlers[typeof(obj)](obj);
	},
	
	
	gsub: function gsub(source, pattern, replacement) {
		var result = '', match, after;
		
		while (source.length > 0) {
			match = source.match(pattern)
			if (match) {
				result += source.slice(0, match.index);
				after = (typeof(replacement) == 'function')
					? replacement(match)
					: replacement;

				if (after)
					result += after;
				source = source.slice(match.index + match[0].length);
			} else {
				result += source;
				source = '';
			}
		}
		
		return result;
	},
	
	
	get_attributes: function get_element_attributes(elem)
	{
		var attrs = {};
		
		if (typeof(elem) != 'object' || !elem) {
			throw new TypeError('Cannot get the attributes of a non-object.');
		}
		
		if (elem.nodeType != 1 || !elem.hasAttributes())
			return attrs;
		
		for (var i = 0; i < elem.attributes.length; i++) {
			var a = elem.attributes[i];
			if (!a.specified || a.nodeName in attrs)
				continue;
				
			var v = (a.nodeValue.toString)
				? a.nodeValue.toString()
				: a.nodeValue;
			
			switch (a.nodeName) {
				case 'class':
					attrs.className = v;
					break;
				case 'for':
					attrs.htmlFor = v;
					break;
				default:
					attrs[a.nodeName] = v;
			}
		}
		
		return attrs;
	}
};

Crucible.Tools.inspect.handlers = {
	string: function(s) {
		for (var sp_char in this.string.chars) {
			s = Crucible.Tools.gsub(s, sp_char, this.string.chars[sp_char]);
		}
		return '"' + s + '"';
	},
	
	number: function(n) {
		return String(n);
	},
	
	boolean: function(b) {
		return String(b);
	},
	
	'function': function(f) {
		return 'function' + (f.name ? ' ' + f.name : '') + '()';
	},
	
	'object': function(o) {
		var reprs = [];
		
		if (o === null)
			return 'null';
		
		if (o.nodeType) {
			if (o.nodeType == 3)
				return this.string(o.nodeValue);
			else if (o.nodeType == 1)
				return this.element(o);
			else
				return '[Node]';
		}
		
		if (typeof(o.length) == 'number' && o.length >= 0)
			return this.array(o);
		
		for (var name in o) {
			if (name in Object.prototype)
				continue;
			reprs.push(name + ': ' + Crucible.Tools.inspect(o[name]));
		}
		
		return '{' + reprs.join(', ') + '}';
	},
	
	'array': function(a) {
		var reprs = [];
		
		for (var i = 0; i < a.length; i++) {
			reprs.push(Crucible.Tools.inspect(a[i]));
		}
		
		return '[' + reprs.join(', ') + ']';
	},
	
	'undefined': function() {
		return 'undefined';
	},
	
	element: function(el) {
		var attrs, name, tag;
		
		tag = '<' + el.tagName.toLowerCase();
		
		attrs = Crucible.Tools.get_attributes(el);
		for (var name in attrs) {
			tag += ' ' + name + '="' + attrs[name] + '"';
		}
		
		return tag + '>';
	}
};

Crucible.Tools.inspect.handlers.string.chars = {
	"\b": '\\b',
	"\t": '\\t',
	"\n": '\\n',
	"\v": '\\v',
	"\f": '\\f',
	"\r": '\\r',
	'"': '\\"'
};

Crucible.Delegator = function Delegator(name) {
	if (name)
		this.name = name;
	this.listeners = [];
};

Crucible.augment(Crucible.Delegator.prototype,
	
{
	
	name: null,
	
	
	listeners: null,
	
	
	call: function call_delegates() {
		var i, len, l;
		for (i = 0, len = this.listeners.length; i < len; i++) {
			l = this.listeners[i];
			if (typeof(l.listener) == 'function')
				l.listener.apply(l.context, arguments);
			else
				l.listener[l.context].apply(l.listener, arguments);
		}
	},
	
	
	add: function add_listener_to_delegator(listener, context) {
		if (typeof(listener) == 'function') {
			this.listeners.push({
				listener: listener,
				context: context || null
			});
		} else if (typeof(listener) == 'object') {
			this.listeners.push({
				listener: listener,
				context: context || 'handleEvent'
			});
		} else {
			throw new TypeError('Cannot add a "' + typeof(listener) + '" ' +
				'as a delegation listener.');
		}
	},
	
	
	remove: function remove_listener_from_delegator(listener, context) {
		var i, l;
		
		if (typeof(listener) == 'function') {
			if (!context)
				context = null;
		} else if (typeof(listener) == 'object') {
			if (!context)
				context = 'handleEvent';
		} else {
			return false;
		}
		
		for (i = 0; i < this.listeners.length; i++) {
			l = this.listeners[i];
			if (l.listener == listener && l.context == context) {
				this.listeners.splice(i, 1);
				return true;
			}
		}
		
		return false;
	}
});


 

Crucible.SourceHandler = function SourceHandler(class_) {
	if (typeof(class_) == 'function') {
		this.handles = function source_instance_of_handle(source) {
			return (source instanceof class_);
		}
	} else if (class_) {
		throw new TypeError('To generate a default "handles" method, the ' +
			'class_ parameter must be a function to which instanceof can be ' +
			'applied.');
	}
};

Crucible.augment(Crucible.SourceHandler.prototype,
	
{
	
	handles: function(source) {
		throw new Error('Abstract function.');
	},
	
	
	getTests: function(source) {
		throw new Error('Abstract function.');
	},
	
	
	run: function(parent, source, runner) {
		throw new Error('Abstract function.');
	}
});

Crucible.Test = function Test(name, test, expected) {
	if (!name) {
		throw new Error("Cannot create a test with no name.");
	} else if (typeof(name) != 'string') {
		throw new TypeError("A test's name must be a string.");
	} else if (!test) {
		throw new Error("Cannot create a test with no test code.");
	} else if (typeof(test) != 'function') {
		throw new TypeError("A function must be provided as the test routine.");
	} else if (expected) {
		if (expected !== true && typeof(expected) != 'string') {
			throw new TypeError("Indicate that a test expects an exception " +
				"to be thrown by passing either a boolean true or the name " +
				"of the exception as the option.");
		}
	}
	
	this.name = name;
	this.test = test;
	this.expected = expected || false;
};

Crucible.augment(Crucible.Test.prototype,
	
{
	
	name: null,
	
	
	expected: false,
	
	
	test: null,
	
	
	
	run: function test_run(runner, context) {
		var unit;
		this.context = context || null;
		unit = new Crucible.Test.Unit(this, this.test, this.expected);
		unit.run(runner);
	}
});


Crucible.Test.Unit = function TestUnit(test, unit, expected) {
	this._test = test;
	this._unit = unit;
	this._expected = expected;
	
	if (test.context) {
		Crucible.augment(this, test.context);
		this._context_keys = Crucible.objectKeys(test.context);
	}
};

Crucible.augment(Crucible.Test.Unit.prototype,
	
{
	
	_runner: null,
	
	
	_context_keys: null,
	
	
	run: function run_test_unit(runner) {
		var ex_desc;
		var test = this._test;
		var i, len, key;
		
		if (typeof(runner) != 'object' || typeof(runner.report) != 'function') {
			throw new TypeError("Cannot run a test without a Crucible test " +
				"runner to pass the results to.");
		}
		
		this._runner = runner;
		
		function pass() {
			runner.report(test, true);
		}
		function fail(message) {
			runner.report(test, new Crucible.Failure(test, message));
		}
		function unexpected_error(error) {
			runner.report(test, new Crucible.UnexpectedError(test, error));
		}
		
		try {
			try {
				this._unit(runner);
				
				if (this._context_keys) {
					for (i = 0, len = this._context_keys.length; i < len; ++i) {
						key = this._context_keys[i];
						if (typeof(this[key]) == 'undefined') {
							delete this._test.context[key];
						} else {
							this._test.context[key] = this[key];
							delete this[key];	
						}
					}
				}
			} catch (e) {
				if (e._crucible_failure) {
					this._runner.report(this._test, e);
					return;
				} else if (e.name == 'Crucible.AsyncCompletion') {
					return;
				} else if (this._expected) {
					if (this._expected === true) {
						pass();
					} else if (this._expected == e.name) {
						pass();
					} else {
						unexpected_error(e);
					}
					return;
				} else {
					unexpected_error(e);
					return;
				}
			}
	
			if (this._expected) {
				ex_desc = (this._expected === true)
					? "an exception"
					: 'a "' + this._expected + '" exception';
				fail("Expected " + ex_desc + ' to be thrown, but none ' +
					'was.');
				return;
			}
			
			this._runner.report(this._test, true);
		} finally {
			this._runner = null; // cleanup
		}
	},
	
	assertEqual: function assert_equal(expected, actual, message) {
		if (!Crucible.equal(expected, actual)) {
			throw new Crucible.ExpectationFailure(this._test, expected, actual);
		}
	},
	
	assertSame: function assert_same(expected, actual, message) {
		if (expected !== actual) {
			throw new Crucible.ExpectationFailure(this._test, expected, actual);
		}
	},
	
	assertType: function assert_type(expected_type, object, message) {
		if (typeof(object) != expected_type) {
			throw new Crucible.Failure(this._test, message ||
				'Object should be of type "' + expected_type + '".');
		}
	},
	
	assertDefined: function assert_defined(object, message) {
		if (typeof(object) == 'undefined') {
			throw new Crucible.Failure(this._test, message ||
				'Object should not be undefined.');
		}
	},
	
	assertNull: function assert_null(object, message) {
		if (object !== null) {
			throw new Crucible.Failure(this._test, message ||
				'Object should be null.');
		}
	},
	
	assertNotNull: function assert_not_null(object, message) {
		if (object === null || typeof(object) == 'undefined') {
			throw new Crucible.Failure(this._test, message ||
				'Object should not be null.');
		}
	},
	
	assert: function assert(condition, message) {
		if (!condition) {
			throw new Crucible.Failure(this._test, message ||
				'(unspecified reason)');
		}
	},
	
	assertFalse: function assert_false(condition, message) {
		if (condition) {
			throw new Crucible.Failure(this._test, message ||
				'(unspecified reason)');
		}
	},
	
	fail: function fail(message) {
		throw new Crucible.Failure(this._test, message ||
			'(unspecified reason)');
	},
	
	forked: function forked() {
		throw new Crucible.AsyncCompletion();
	},
	
	promptUser: function prompt_user(message, on_accept, label, expected) {
		var buttons = {};
		
		if (!message)
			throw new Error('No message to prompt with.');
		else if (typeof(on_accept) != 'function')
			throw new Error('Must provide a post-accept function for prompt.');
			
		buttons[label || 'OK'] = new Crucible.Test.Unit(this._test, on_accept,
			expected || null);
		
		this._runner.displayMessage(message, buttons);
		throw new Crucible.AsyncCompletion();
	},
	
	verify: function verify(question, on_ok, labels, description, expected) {
		var buttons = {};
		
		if (!question)
			throw new Error('No question to verify.');
		else if (typeof(on_ok) != 'function')
			throw new Error('Must provide something to do upon verification.');
		
		if (!labels)
			labels = ['Yes', 'No'];
			
		function fail() {
			this.fail(description || 'Verification failed.');
		}
		
		buttons[labels[0]] = new Crucible.Test.Unit(this._test, on_ok,
			expected || null);
		buttons[labels[1]] = new Crucible.Test.Unit(this._test, fail);
		
		this._runner.displayMessage(question, buttons);
		throw new Crucible.AsyncCompletion();
	},
	
	log: function log_information() {
		if (this._runner.log) {
			this._runner.log.apply(this._runner, arguments);
		}
	}
});


Crucible.Test.Handler = function TestHandler() {
	
};

Crucible.Test.Handler.prototype = new Crucible.SourceHandler(Crucible.Test);
Crucible.augment(Crucible.Test.Handler.prototype,
	
{
	getTests: function get_tests_from_test(test) {
		return [test];
	},
	
	run: function run_test(parent, test, runner) {
		runner.sourceOpened.call(parent, test);
		
		function test_finished(finished_test) {
			if (finished_test == test) {
				runner.testFinished.remove(test_finished, test);
				runner.sourceClosed.call(parent, test);
			}
		}
		
		runner.testFinished.add(test_finished, test);
		runner.testStarted.call(test);
		test.run(runner, (parent && parent.testContext) || null);
	}
});

Crucible.addSourceHandler(new Crucible.Test.Handler());

Crucible.Fixture = function Fixture(name) {
	this.name = name || null;
	this.tests = [];
};

Crucible.augment(Crucible.Fixture.prototype,
	
{
	
	name: null,
	
	
	tests: null,
	
	
	initialize: Crucible.emptyFunction,
	
	
	uninitialize: Crucible.emptyFunction,
	
	
	setUp: Crucible.emptyFunction,
	
	
	tearDown: Crucible.emptyFunction,
	
	add: function add_test_to_fixture(name, test, expected) {
		this.tests.push((typeof(name) == 'object')
			? name
			: new Crucible.Test(name, test, expected));
	}
});


Crucible.Fixture.Handler = function FixtureHandler() {
	
};

Crucible.Fixture.Handler.prototype =
	new Crucible.SourceHandler(Crucible.Fixture);
Crucible.augment(Crucible.Fixture.Handler.prototype,
	
{
	getTests: function get_tests_from_fixture(fixture) {
		return fixture.tests;
	},
	
	run: function run_fixture(parent, fixture, runner) {
		var cur_test = -1;
		
		runner.sourceOpened.call(parent, fixture);
		
		if (fixture.tests.length == 0) {
			runner.sourceClosed.call(parent, fixture);
			return;
		}
		
		fixture.testContext = {};
		fixture.initialize.call(fixture.testContext);
		
		function next_test() {
			cur_test++;
			if (cur_test >= fixture.tests.length) {
				return false;
			}
			
			fixture.setUp.call(fixture.testContext);
			
			Crucible.defer(function(test) {
				Crucible.getHandler(test).run(fixture, test, runner);
			}, null, fixture.tests[cur_test]);
			return true;
		}
		
		function source_closed(source_parent, closed_source) {
			if (closed_source == fixture.tests[cur_test]) {
				fixture.tearDown.call(fixture.testContext);
				
				if (!next_test()) {
					fixture.uninitialize.call(fixture.testContext);
					runner.sourceClosed.remove(source_closed, fixture);
					runner.sourceClosed.call(parent, fixture);
				}
			}
		}
		runner.sourceClosed.add(source_closed, fixture);
		
		next_test();
	}
});

Crucible.addSourceHandler(new Crucible.Fixture.Handler());

Crucible.Preferences = {
	_values: {},
	
	get: function get_preference(name) {
		var self = Crucible.Preferences;
		var process, value;
		
		if (self._values[name])
			return self._values[name];
			
		process = self._get_processor(name, 'get');
		value = self._get_cookie('crucible_' + name);
		
		return (value) ? process(value) : self._prefs[name].value;
	},
	
	set: function set_preference(name, value) {
		var self = Crucible.Preferences;
		var process;
		
		process = self._get_processor(name, 'set');
		
		self._values[name] = value;
		self._set_cookie('crucible_' + name, process(value), 730);
	},
	
	_get_cookie: function _get_cookie(name) {
		var cookies = document.cookie.split(';');
		var cookie_pattern = /(\S+)=(.+)$/;
		var i, match;
		
		for (i = 0; i < cookies.length; i++) {
			match = cookie_pattern.exec(cookies[i]);
			if (!match || !match[1] || !match[2])	
				continue;
			
			if (name && match[1] == name)
				return match[2];
		}
		
		return null;
	},
	
	_set_cookie: function _set_cookie(name, value, days) {
		var expires = '';
		
		if (days) {
			var date = new Date();
			date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
			
			expires = '; expires=' + date.toGMTString();
		}
		
		document.cookie = name + '=' + value + expires + '; path=/';
	},
	
	_get_processor: function _get_preference_processor(pref_name, which) {
		var pref = Crucible.Preferences._prefs[pref_name];
		var proc;
		
		if (!pref) {
			throw new Error('Unknown preference "' + pref_name + '".');
		}
		
		proc = pref.processor || 'string';
		
		if (which != 'get' && which != 'set')
			throw new Error('Invalid preference direction "' + which + '".');
		
		if (typeof(proc) == 'string') {
			if (!Crucible.Preferences._default_processors[proc]) {
				throw new Error('Unknown default preference processor "' +
					proc + '".');
			}
			proc = Crucible.Preferences._default_processors[proc];
		}
		
		if (!proc[which]) {
			throw new Error('Invalid preference processor for "' + pref_name +
				'".');
		}
		
		return proc[which];
	},
	
	_prefs: {
		pr_status: {
			value: 'closed'
		}
	},
	
	_default_processors: {
		'string': {
			get: Crucible.constantFunction,
			set: Crucible.constantFunction
		}
	}
};

Crucible.Runner = function Runner() {
	var i, length, ev;
	this.sources = [];
	for (i = 0, length = Crucible.Runner.events.length; i < length; i++) {
		ev = Crucible.Runner.events[i];
		this[ev] = new Crucible.Delegator(ev);
	}
};

Crucible.augment(Crucible.Runner.prototype,
	
{
	sources: null,
	source_index: null,
	current_test: null,
	
	add: function add_test_source_to_runner(name, test, expected) {
		this.sources.push((typeof(name) == 'object')
			? name
			: new Crucible.Test(name, test, expected));
	},
	
	doneAdding: function done_adding_sources_to_runner() {
		// default implementation does nothing
	},
	
	run: function runner_run() {
		this.sourceClosed.add(this._sourceClosed, this);
		
		this.started.call();
		this.runSource(0);
	},
	
	_sourceClosed: function _runner_source_closed(parent, source) {
		if (source == this.sources[this.source_index]) {
			this.runSource(this.source_index + 1);
		}
	},
	
	finish: function runner_cleanup() {
		this.sourceClosed.remove(this._sourceClosed, this);
		this.completed.call();
		this.source_index = null;
	},
	
	runSource: function runner_run_source(index) {
		this.source_index = index;
		if (this.source_index >= this.sources.length) {
			this.finish();
			return;
		}
		
		Crucible.getHandler(this.sources[index]).run(null, this.sources[index],
			this);
	},
	
	report: function report_result_to_runner(test, result) {
		if (result === true) {
			this.testPassed.call(test);
		} else if (result._crucible_failure) {
			this.testFailed.call(test, result);
		} else if (result.name == 'Crucible.UnexpectedError') {
			this.testError.call(test, result);
		} else {
			throw new Error('Unable to understand test result: ' + result);
		}
		this.testFinished.call(test, result);
	},
	
	displayMessage: function runner_display_message(message, buttons) {
		throw new Error('The base Crucible.Runner cannot display messages.');
	}
});


Crucible.Runner.events = ['started', 'sourceOpened', 'testStarted',
	'testFinished', 'testPassed', 'testFailed', 'testError',
	'sourceClosed', 'completed'];

Crucible.PrettyRunner = function PrettyRunner(product) {
	Crucible.Runner.call(this);
	if (product)
		this.product = product;
		
	for (var name in this._eventListeners) {
		this[name].add(this._eventListeners[name], this);
	}
	
	this._test_messages = [];
		
	this.draw();
};

Crucible.PrettyRunner.prototype = new Crucible.Runner();

Crucible.augment(Crucible.PrettyRunner.prototype,
	
{
	
	status: null,
	
	
	product: 'the product',
	
	doneAdding: function done_adding_tasks_to_pretty_runner() {
		var msg;
		this._done_adding = true;
		
		if (!this.root) {
			Crucible.defer(Crucible.bind(this.doneAdding, this));
			return;
		}
		
		function start() {
			this.tallies = {pass: 0, fail: 0, error: 0};
			this.run();
		}
		
		msg = this.addMessage('prompt', "Crucible is ready to test " +
			this.product + ".", {'Start': Crucible.bind(start, this)});
	},
	
	displayMessage: function pr_display_message(message, buttons) {
		this.addMessage('prompt', message, buttons);
	},
	
	log: function pr_log_message() {
		var message = [], i, length, arg, part;
		
		for (i = 0, length = arguments.length; i < length; ++i) {
			arg = arguments[i];
			part = (typeof(arg) == 'string')
				? arg
				: Crucible.Tools.inspect(arg);
				
			part = Crucible.Tools.gsub(part, '<', '&lt;');
			part = Crucible.Tools.gsub(part, '>', '&gt;');
				
			if (typeof(arg) != 'string')
				part = '<code>' + part + '</code>';
			message.push(part);
		}
		
		this.addMessage('log', message.join(' '));
	},
	
	_getMessage: function _get_message_for_test(test, remove) {
		var i, len, entry, message;
		for (i = 0, len = this._test_messages.length; i < len; ++i) {
			entry = this._test_messages[i];
			if (entry && entry.test == test) {
				message = entry.message;
				if (remove)
					this._test_messages.splice(i, 1);
				return message;
			}
		}
		
		return null;
	},
	
	_setMessage: function _set_message_for_test(test, message) {
		var old = this._getMessage(test, true);
		if (old && old.remove)
			old.remove();
		this._test_messages.push({test: test, message: message});
		return message;
	},
	
	_eventListeners: {
		testStarted: function pr_test_started(test) {
			var msg = this.addMessage('running', 'Testing &ldquo;' + test.name +
				'&rdquo;&hellip;');
			this._setMessage(test, msg);
		},
	
		testPassed: function pr_test_succeeded(test) {
			var message = this._getMessage(test);
			message.setType('pass');
			message.setMessage(test.name);
			this.tallies.pass++;
		},
	
		testFailed: function pr_test_failed(test, failure) {
			var message = this._getMessage(test);
			message.setType('fail');
			message.setMessage(test.name + ': ' +
				(failure.htmlDescription || failure.description));
			if (this.status == 'ok')
				this.setStatus('failure');
			this.tallies.fail++;
		},
	
		testError: function pr_test_error(test, error) {
			var message = this._getMessage(test), ex = error.error;
			message.setType('error');
			message.setMessage(ex.name + ' in test &ldquo;' + test.name +
				'&rdquo;: <br /><code>' + ex.message + '</code>');
			this.setStatus('error');
			this.tallies.error++;
		},
	
		completed: function pr_run_completed() {
			var doc = this.body.ownerDocument;
			var frag = doc.createDocumentFragment();
			var message = doc.createElement('P');
			var tally_table = doc.createElement('TABLE');
			var tallies = this.tallies;
			var total_tests = tallies.pass + tallies.fail + tallies.error;
			tally_table.id = "pr_tally";
			
			function round(number) {
				try {
					return String(number).match(/\d+(\.\d)?/)[0];
				} catch (e) {
					return '0';
				}
			}
			
			function make_row(title, count) {
				var row = doc.createElement('TR');
				var head = doc.createElement('TH');
				var number;
				var percent;
				head.appendChild(doc.createTextNode(title));
				row.appendChild(head);
				
				number = doc.createElement('TD');
				number.innerHTML = count + ' tests';
				row.appendChild(number);
				
				percent = doc.createElement('TD');
				percent.innerHTML =  '(' + round(100 * (count / total_tests)) +
					'%)';
				row.appendChild(percent);
				tally_table.appendChild(row);
			}
			
			message.innerHTML = "Crucible has finished testing "
				+ this.product + "."
			frag.appendChild(message);
			
			make_row('Passed:', tallies.pass);
			make_row('Failed:', tallies.fail);
			make_row('Errors:', tallies.error);
			frag.appendChild(tally_table);
			
			this.addMessage('done', frag);
		}
	},
	
	
	_drawn: false,
	
	
	_done_adding: false,
	
	
	_test_messages: null,
	
	
	tallies: null,
	
	
	base: null,
	
	
	root: null,
	
	
	titlebar: null,
	
	
	status_icon: null,
	
	
	body: null,
	
	
	results: null,
	
	addMessage: function add_message_to_table(type, message, buttons) {
		var doc, row, icon_cell, icon, message_cell, button_cell;
		var mo;
		var runner = this;
		if (!this.results)
			this.createResultTable();
		
		doc = this.results.ownerDocument;
		row = this.results.insertRow(-1);
		
		icon_cell = row.insertCell(-1);
		icon_cell.className = 'pr_result_icon';
		icon = Crucible.PrettyRunner._create_icon(doc);
		icon_cell.appendChild(icon);
		
		function set_icon(path) {
			Crucible.PrettyRunner._update_icon(icon, path);
		}
		
		message_cell = row.insertCell(-1);
		message_cell.className = 'pr_result_body';
		
		mo = {
			setType: function set_pr_message_type(type) {
				var params;
				if (!(params = Crucible.PrettyRunner._type_params[type]))
					throw new Error('Unknown message type "' + type + '".');
				row.className = params.row_class;
				set_icon(runner.base + 'assets/icons/' + params.icon);
			},
			
			setMessage: function set_pr_message_text(message) {
				if (typeof(message) == 'string') {
					message_cell.innerHTML = message;
				} else {
					while (message_cell.firstChild)
						message_cell.removeChild(message_cell.firstChild);
					message_cell.appendChild(message);
				}
			},
			
			setButtons: function set_pr_message_buttons(buttons) {
				var button;
				function click_listener(button) {
					return function (ev) {
						if (typeof(button.pr_action) == 'function')
							button.pr_action.call(null);
						else
							button.pr_action.run(runner);
						mo.remove();
						ev.preventDefault();
					};
				}
				
				message_cell.colSpan = (buttons) ? 1 : 2;
				
				if (!buttons && button_cell) {
					button_cell.parentNode.removeChild(button_cell);
					button_cell = null;
				} else if (buttons) {
					if (button_cell) {
						while (button_cell.firstChild)
							button_cell.removeChild(button_cell.firstChild);
					} else {
						button_cell = row.insertCell(-1);
						button_cell.className = 'pr_result_buttons';
					}
					
					for (var label in buttons) {
						button = doc.createElement('A');
						button.href = '#';
						button.innerHTML = label;
						button.pr_action = buttons[label];
						Crucible.observeEvent(button, 'click', 
							click_listener(button));
						button_cell.appendChild(button);
					}
				}
			},
			
			remove: function remove_pr_message() {
				row.parentNode.removeChild(row);
				row = null;
			}
		};
		
		mo.setType(type);
		mo.setMessage(message);
		mo.setButtons(buttons);
		
		row.scrollIntoView();
		return mo;
	},
	
	
	setStatus: function set_pretty_runner_status_icon(status) {
		var base = this.base + 'assets/icons/';
		switch (status) {
			case 'ok':
				Crucible.PrettyRunner._update_icon(this.status_icon,
					base + 'ok.png', 'OK', 'No errors.');
				break;
			case 'failure':
				Crucible.PrettyRunner._update_icon(this.status_icon,
					base + 'error.png', 'Failure(s)',
					'One or more tests have failed.');
				break;
			case 'error':
				Crucible.PrettyRunner._update_icon(this.status_icon,
					base + 'exclamation.png', 'Error(s)',
					'One or more tests have encountered errors.');
				break;
			default:
				throw new Error('Unknown runner status code "' + status + '".');
		}
		this.status = status;
	},
	
	toggleOpen: function toggle_pretty_runner_open() {
		var row;
		var new_state = !(this.body.className == 'pr_active');
		
		this.body.className = (new_state)
			? 'pr_active'
			: '';
		this.titlebar.title = (new_state)
			? 'Click to close.'
			: 'Click to open.';
		if (new_state == 'pr_active' && this.results) {
			row = this.results.rows[this.results.rows.length-1];
			Crucible.defer(function() {
				row.scrollIntoView();
			});
		}
		this._onScroll();
		Crucible.Preferences.set('pr_status', (new_state ? 'open' : 'closed'));
	},
	
	
	draw: function add_pretty_runner_stylesheet() {
		var base;
		
		if (this._drawn)
			return;
		
		if (!document.body) {
			Crucible.defer(this.draw, this);
			return;
		}
		
		this._drawn = true;
		
		base = this.base = Crucible.determineBase();
		Crucible.addStyleSheet(base + 'assets/css/pretty_runner.css');
		
		//this.appendUI();
		Crucible.defer(this.appendUI, this);
	},
	
	
	appendUI: function append_pretty_runner_ui() {
		if (this.root && this.titlebar && this.status_icon && this.body)
			return; // guard
		
		this.root = document.createElement('DIV');
		this.root.id = "pretty_runner";
		
		this.titlebar = document.createElement('DIV');
		this.titlebar.id = "pretty_runner_title";
		this.titlebar.title = 'Click to open.';
		
		this.status_icon = Crucible.PrettyRunner._create_icon(document);
		this.status_icon.className = 'pr_status';
		this.setStatus('ok');
		this.titlebar.appendChild(this.status_icon)
		this.titlebar.appendChild(document.createTextNode("\nCrucible"));
		this.root.appendChild(this.titlebar);
		
		Crucible.observeEvent(this.titlebar, 'click',
			Crucible.bind(this.toggleOpen, this));
		
		this.body = document.createElement('DIV');
		this.body.id = 'pretty_runner_body';
		this.root.appendChild(this.body);
		
		document.body.appendChild(this.root);
		
		Crucible.observeEvent(window, 'scroll',
			Crucible.bind(this._onScroll, this));
		
		if (Crucible.Preferences.get('pr_status') == 'open')
			this.toggleOpen();
	},
	
	
	_onScroll: function _pr_on_scroll() {
		var scrolled = (window.pageYOffset || document.body.scrollTop
			|| document.documentElement.scrollTop || 0);
		var window_height = (window.innerHeight
			|| document.documentElement.clientHeight
			|| document.body.clientHeight);
		var new_pos = scrolled + window_height - this.root.clientHeight;
		
		this.root.style.bottom = 'auto';
		this.root.style.top = new_pos + 'px';
	},
	
	
	createResultTable: function create_pretty_runner_result_table() {
		this.results = this.root.ownerDocument.createElement('TABLE');
		this.results.id = "pretty_runner_results";
		this.results.cellSpacing = 0;
		this.body.appendChild(this.results);
	}
});

Crucible.augment(Crucible.PrettyRunner, {
	_window_loaded: false,
	_pending_runners: [],
	
	_window_load: function _pretty_runner_onload() {
		var pending, i;
		
		Crucible.PrettyRunner._window_loaded = true;
		
		pending = Crucible.PrettyRunner._pending_runners;
		Crucible.PrettyRunner._pending_runners = [];
		for (i = 0; i < pending.count; i++) {
			pending[i].draw();
		}
	},
	
	_type_params: {
		'prompt': {
			row_class: 'pr_message',
			icon: 'bullet_go.png'
		},
		'running': {
			row_class: 'pr_running',
			icon: 'bullet_yellow.png'
		},
		'pass': {
			row_class: 'pr_passed',
			icon: 'tick.png'
		},
		'fail': {
			row_class: 'pr_failed',
			icon: 'cross.png'
		},
		'error': {
			row_class: 'pr_error',
			icon: 'exclamation.png'
		},
		'done': {
			row_class: 'pr_done',
			icon: 'flag_blue.png'
		},
		'log': {
			row_class: 'pr_log_message',
			icon: 'information.png'
		}
	}
});

Crucible.PrettyRunner.IE6 = /MSIE 6/.test(navigator.userAgent);


Crucible.PrettyRunner._create_icon = function _pr_create_icon(doc) {
	var tag = (Crucible.PrettyRunner.IE6) ? 'SPAN' : 'IMG';
	return (doc || document).createElement(tag);
};

Crucible.PrettyRunner._update_icon =
	function _pr_update_icon(icon, path, alt, title) 
{
	if (Crucible.PrettyRunner.IE6) {
		icon.style.filter = "progid:" +
			"DXImageTransform.Microsoft.AlphaImageLoader(src='" +
		    path + "', sizingMethod='image')";
	} else {
		icon.src = path;
		if (typeof(alt) != 'undefined')
			icon.alt = alt;
	}
	
	if (typeof(title) != 'undefined')
		icon.title = title;
};

Crucible.observeEvent(window, 'load', Crucible.PrettyRunner._window_load);
