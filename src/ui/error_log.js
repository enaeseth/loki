// Class: Loki.UI.ErrorLog
// Provides two views to a log of errors (really, <Loki.Notice> objects):
//     - a one-line "information bar" that appears only when one or more errors
//       have been logged
//     - a full-blown error console window
//
// Events:
//     add - Fired when a new <Loki.Notice> has been added to the log.
//           The notice object is passed as a parameter to handlers.
Loki.UI.ErrorLog = Loki.Class.create({
	// Constructor: initialize
	// Creates a new error log.
	//
	// Parameters:
	//     (Object) options - settings object
	//
	// Options:
	//     (String) minimumLevel - if set, notices below this level will be
	//              ignored
	initialize: function ErrorLog(options) {
		options = Loki.UI.ErrorLog._settings.process(options);
		
		this.minimumLevel = null;
		this.minimumIntensity = (this.minimumLevel)
			? Loki.Notice.levels[this.minimumLevel]
			: 0;
		
		this.notices = [];
		this.dialog = null;
	},
	
	// Method: log
	// Logs a notice. If the notice is below the minimum level set in the
	// error log constructor, the notice will be ignored.
	//
	// Parameters:
	//     (Loki.Notic) notice - the notice to log
	log: function log_notice(notice) {
		if (notice.intensity < this.minimumIntensity)
			return;
		
		this.notices.push(notice);
		this.fireEvent("add", notice);
	},
	
	// Method: createBar
	// Creates an information bar associated with the error log.
	//
	// Returns:
	//     (Loki.UI.Widget) - the information bar widget
	createBar: function error_log_create_info_bar() {
		return new Loki.UI.ErrorLog.Bar(this);
	}
});
Loki.Class.mixin(Loki.UI.ErrorLog, Loki.EventTarget);

Loki.UI.ErrorLog.Bar = Loki.Class.create(Loki.UI.Widget, {
	initialize: function InfoBar(log) {
		InfoBar.superclass.call(this);
		
		this.log = log;
		log.addEventListener("add", this, "noticeLogged");
		
		this.bar = null;
	},
	
	create: function create_info_bar_body(document) {
		if (this.bar)
			return this.bar;
		
		this.bar = document.build("div", {
			className: "infobar",
			style: {display: "none"}
		});
	},
	
	noticeLogged: function info_bar_notice_logged(notice) {
		
	}
});

Loki.UI.ErrorLog._settings = (function create_err_log_settings() {
	var cfg = new Loki.Configuration();
	cfg.define("minimumLevel", null, function(level) {
		var intensity = Loki.Notice.levels[level];
		if (typeof(intensity) == "undefined") {
			throw Loki.error("ArgumentError", "notice:invalid level", level);
		}
	});
})();
