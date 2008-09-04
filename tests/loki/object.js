pr.add("Extending an object", function() {
	var a = {foo: 'bar'};
	var b = {bar: 'baz'};
	Loki.Object.extend(a, b);
	
	this.assertEqual({bar: 'baz'}, b);
	this.assertEqual({foo: 'bar', bar: 'baz'}, a);
});

pr.add("Extending without overwriting", function() {
	var a = {foo: 'bar', bar: 'baz'};
	var b = {bar: false, baz: 'quux'};
	Loki.Object.extend(a, b, false);
	
	this.assertEqual({bar: false, baz: 'quux'}, b);
	this.assertEqual({foo: 'bar', bar: 'baz', baz: 'quux'}, a);
});

pr.add("Getting an object's keys", function() {
	Object.prototype.foo = 'bar';
	try {
		this.assertEqual(['bar', 'baz'], Loki.Object.keys({bar: 1, baz: 2}));
	} finally {
		delete Object.prototype.foo;
	}
});

pr.add("Getting an object's values", function() {
	Object.prototype.foo = 'bar';
	try {
		this.assertEqual([1, 2], Loki.Object.values({bar: 1, baz: 2}));
	} finally {
		delete Object.prototype.foo;
	}
});

pr.add("Enumerating an object", function() {
	var seen = {};
	var o = {bar: 1, baz: 2};
	Object.prototype.foo = 'bar';
	try {
		function enumerator(k, v) {
			seen[k] = v;
		}
		Loki.Object.enumerate(o, enumerator);
		this.assertEqual(o, seen);
	} finally {
		delete Object.prototype.foo;
	}
});

pr.add("Enumerating an object with a context", function() {
	var seen = {};
	var o = {bar: 1, baz: 2};
	Object.prototype.foo = 'bar';
	try {
		function enumerator(k, v) {
			this[k] = v;
		}
		Loki.Object.enumerate(o, enumerator, seen);
		this.assertEqual(o, seen);
	} finally {
		delete Object.prototype.foo;
	}
});

pr.add("Cloning an object", function() {
	var a = {foo: 'bar', bar: 42};
	var b = Loki.Object.clone(a);
	
	this.assert(a !== b, "the clone should not be the same as the original");
	this.assertEqual(a, b);
});

pr.add("Shallow cloning", function() {
	var a = {foo: 'bar', bar: {baz: 'quux'}};
	var b = Loki.Object.clone(a);
	
	this.assert(a !== b, "the clone should not be the same as the original");
	this.assertEqual(a, b);
	this.assert(a.bar === b.bar, "the descendant objects should still be " +
		"the same");
});

pr.add("Deep cloning", function() {
	var a = {foo: 'bar', bar: {baz: 'quux'}};
	var b = Loki.Object.clone(a, true);
	
	this.assert(a !== b, "the clone should not be the same as the original");
	this.assertEqual(a, b);
	this.assert(a.bar !== b.bar, "the descendant objects should not be " +
		"the same");
	this.assertEqual(a.bar, b.bar);
});

pr.add("Cannot clone a scalar", function() {
	Crucible.Object.clone(42);
}, "TypeError");

pr.add("Object equality", function() {
	this.assert(Loki.Object.equal(12, 12), "numbers");
	this.assert(Loki.Object.equal(12, "12"), "numbers with coercion");
	this.assert(Loki.Object.equal("foo", "foo"), "strings");
	this.assert(Loki.Object.equal(true, true), "booleans");
	this.assert(Loki.Object.equal({foo: 'bar', bar: 'baz'},
		{bar: 'baz', foo: 'bar'}), "objects");
});
