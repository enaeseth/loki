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
		
		this.minimumLevel = options.minimumLevel;
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
	// Parameters:
	//     (HTMLDocument) document - the document to create the bar's node on
	//
	// Returns:
	//     (Node) - the information bar widget
	createBar: function error_log_create_info_bar(document) {
		return new Loki.UI.ErrorLog.Bar(this).create(document);
	},
	
	// Method: showConsole
	// Displays the error console. The console window is created if it doesn't
	// already exist, otherwise it is focused on.
	showConsole: function error_log_show_console() {
		// TODO: implement error log console
	}
});
Loki.Class.mixin(Loki.UI.ErrorLog, Loki.EventTarget);

Loki.UI.ErrorLog.Bar = Loki.Class.create(Loki.UI.Widget, {
	bar: null,
	message: null,
	closeLink: null,
	cross: null,
	
	activeNotice: null,
	
	initialize: function InfoBar(log) {
		InfoBar.superclass.call(this);
		
		this.log = log;
		log.addEventListener("add", this, "noticeLogged");
	},
	
	create: function create_info_bar_body(document) {
		if (this.bar)
			return this.bar;
		
		this.bar = document.build("div", {
			className: "infobar",
			style: {display: "none"}
		});
		
		function show_console(event) {
			this.log.showConsole();
			this.close(event); // prevents the default action
		}
		this.message = document.build("a", {
			className: "message",
			href: "#"
		});
		this.message.addEventListener("click", base2.bind(show_console, this),
			false);
		this.bar.appendChild(this.message);
		
		this.cross = document.build("img", {
			className: "cross_icon",
			src: $format("{0}/plugins/core/icons/cross.png", Loki.baseURL)
		});
		
		this.closeLink = document.build("a", {
			className: "close",
			href: "#"
		});
		this.closeLink.appendChild(this.cross);
		this.closeLink.addEventListener("click", base2.bind(this.close, this),
			false);
		this.bar.appendChild(this.closeLink);
		
		return this.bar;
	},
	
	close: function close_info_bar(event) {
		if (event !== false) {
			// XXX: this behavior is quite magical
			this.bar.style.display = "none";
		}
		
		while (this.message.firstChild)
			this.message.removeChild(this.message.firstChild);
		
		this.bar.removeClass(this.activeNotice.level);
		this.activeNotice = null;
		
		if (event) {
			event.preventDefault();
		}
		return false;
	},
	
	noticeLogged: function info_bar_notice_logged(notice) {
		if (this.activeNotice) {
			if (notice.intensity <= this.activeNotice.intensity) {
				// just ignore it
				return;
			}
			this.close(false);
		}
		this.activeNotice = notice;
		
		this.bar.addClass(notice.level);
		
		var text_node = this.message.ownerDocument.createTextNode(
			notice.getMessageSummary()
		);
		this.message.appendChild(text_node);
		
		this.bar.style.display = "";
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
	return cfg;
})();
