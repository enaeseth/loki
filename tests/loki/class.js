pr.add("Creating a class", function() {
	var Foo = Loki.Class.create({
		initialize: function Foo() {
			this.baz = true;
		},
		
		bar: true
	});
	
	if (typeof(Foo.name) != 'undefined')
		this.assertEqual("Foo", Foo.name);
	
	var f = new Foo();
	this.assertSame(true, f.bar);
	this.assertSame(true, f.baz);
});

pr.add("Invalid class prototype", function() {
	Loki.Class.create(null);
}, 'TypeError');

pr.add("Invalid superclass", function() {
	Loki.Class.create(false, {});
}, 'TypeError');

pr.add("Mixing in an object", function() {
	var Foo = Loki.Class.create({
		initialize: function Foo() {
			this.bar = true;
		}
	});
	
	Loki.Class.mixin(Foo, {baz: true});
	this.assertSame(true, Foo.prototype.baz);
});
