pr.add("Creating a locale", function() {
	var l = new Loki.Locale("fr", "CA");
	this.assertSame("fr", l.language);
	this.assertSame("CA", l.country);
});