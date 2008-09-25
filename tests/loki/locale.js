pr.add("Creating a locale", function() {
	var l = new Loki.Locale("fr", "CA");
	this.assertSame("fr", l.language);
	this.assertSame("CA", l.country);
	this.assertSame("fr-CA", l.code);
});

pr.add("Locale object reuse", function() {
	this.assertSame(new Loki.Locale("fr", "CH"), new Loki.Locale("fr", "CH"));
});

pr.add("Automatic creation of language-only locales", function() {
	var l = new Loki.Locale("fr", "CA");
	this.assertSame(Loki.Locale.get("fr"), l.parent);
});

pr.add("Getting locales by code", function() {
	this.assert(Loki.Locale.get("en-US"), "en-US");
	this.assert(Loki.Locale.get("en"), "en");
	this.assert(Loki.Locale.get("ca_ES"), "ca_ES");
});
