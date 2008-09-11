pr.add("Creating a parser with a string", function() {
	new Loki.Parser("foo");
});

pr.add("Creating a parser with nothing to parse", function() {
	new Loki.Parser();
}, 'Error');

pr.add("Creating a parser with a non-string", function() {
	new Loki.Parser({});
}, 'TypeError');

pr.add("Scanning one character", function() {
	var p = new Loki.Parser("ab");
	this.assertEqual("a", p.scan());
	this.assertEqual("b", p.scan());
});

pr.add("Scanning a number of characters", function() {
	var p = new Loki.Parser("foobarbaz");
	this.assertEqual("foo", p.scan(3));
	this.assertEqual("barbaz", p.scan(6));
});

pr.add("Scanning a specific string", function() {
	var p = new Loki.Parser("barbaz");
	this.assertSame(null, p.scan("foo"));
	this.assertEqual("bar", p.scan("bar"));
	this.assertEqual("baz", p.scan("baz"));
});

pr.add("Scanning beyond the end of a string", function() {
	var p = new Loki.Parser("foo");
	this.assertEqual("foo", p.scan(6));
	this.assert(p.terminated(), "parser has terminated");
});

pr.add("Beginning a scan past the end of a string", function() {
	var p = new Loki.Parser("foo");
	this.assertEqual("foo", p.scan(6));
	this.assert(p.terminated(), "parser has terminated");
	this.assertSame("", p.scan());
});

pr.add("Unscanning", function() {
	var p = new Loki.Parser("abcdefg");
	this.assertEqual("abcd", p.scan(4));
	p.unscan();
	this.assertEqual("def", p.scan(3));
	p.unscan(4);
	this.assertEqual("cdefg", p.scan(5));
});

pr.add("Unscanning too far", function() {
	var p = new Loki.Parser("abcdefg");
	p.unscan();
}, "RangeError");

pr.add("Scanning until a string", function() {
	var p = new Loki.Parser("foobarbaz");
	this.assertEqual("foo", p.scanUntil("bar"));
	this.assertEqual("barbaz", p.scan(6));
});

pr.add("Scanning until a string that never comes", function() {
	var p = new Loki.Parser("foobarbaz");
	this.assertEqual("foo", p.scanUntil("bar"));
	this.assertEqual("barbaz", p.scanUntil("death"));
});

pr.add("Scanning until characters", function() {
	var p = new Loki.Parser("foo,bar;baz");
	this.assertEqual("foo", p.scanUntilChars(";,"));
	this.assertEqual(",", p.scan());
	this.assertEqual("bar", p.scanUntilChars(";,"));
	this.assertEqual(";", p.scan());
	this.assertEqual("baz", p.scanUntilChars(";,"));
	this.assert(p.terminated(), "parser has terminated");
});

pr.add("Skipping whitespace", function() {
	var p = new Loki.Parser("foo	bar  baz\r\nquux");
	p.skipWhitespace();
	this.assertEqual("foo", p.scan("foo"));
	p.skipWhitespace();
	this.assertEqual("bar", p.scan("bar"));
	p.skipWhitespace();
	this.assertEqual("baz", p.scan("baz"));
	p.skipWhitespace();
	this.assertEqual("quux", p.scan("quux"));
});
