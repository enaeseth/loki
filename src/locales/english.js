// Date and time formatting is based on the default Apple Mac OS X settings.
(function create_english_locales() {
	var us = Loki.Locale.get("en-US");
	var ca = Loki.Locale.get("en-CA");
	var uk = Loki.Locale.get("en-GB");
	var ie = Loki.Locale.get("en-IE");
	var au = Loki.Locale.get("en-AU");
	var nz = Loki.Locale.get("en-NZ");
	var g = Loki.Locale.get("en");
	
	var ends_sis = /sis$/;
	var ends_s = /[xs]$/;
	
	// XXX: Verify these pluralization rules.
	g.pluralize = function en_pluralize(string, num) {
		var plural;
		
		if (num == 1) {
			return string;
		}
		
		plural = this.getString("plural:" + string);
		if (plural)
			return plural;
		
		if (ends_sis.test(string))
			return string.substr(0, string.length - 2) + "es";
		else if (ends_s.test(string))
			return string + "es";
		else
			return string + "s";
	};
	g.setStrings({
		"plural:child": 'children'
	});
	
	// XXX: Temporary! Move strings into special files.
	g.setStrings({
		"chooser:unknown name": 'Unknown item or set "{0}".',
		"chooser:invalid selector compoment":
			'Invalid selector component "{0}".',
		"chooser:invalid operator": 'Invalid operator "{0}".'
	});
	
	g.setNumberFormat(".", ",", 3);
	
	var weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday",
		"Friday", "Saturday"];
	var months = ["January", "February", "March", "April", "May", "June",
		"July", "August", "September", "November", "December"];
		
	function parse_date(date) {
		var hour = date.getHours();
		
		return {
			year: date.getFullYear(),
			month: date.getMonth() + 1,
			day: date.getDate(),
			
			weekday: weekdays[date.getDay()],
			monthName: months[date.getMonth()]
		};
	}
	
	function parse_time(time) {
		return {
			hour: hour,
			hour_12: (hour == 0 ? 12 : hour % 12),
			minute: date.getMinutes(),
			second: date.getSeconds(),
			
			am_pm: (hour >= 12 ? 'PM' : 'AM')
		};
	}
	
	// I am an American, but I do think the British system would be the most
	// widely understood, so I'm using that as the English default.
	g.formatDate = function en_default_format_date(date, format) {
		date = parse_date(date);
		
		if (format == "short") {
			format = "{day|02d}-{month|02d}-{year|04d}";
		} else if (format == "medium") {
			date.monthName = date.monthName.substr(0, 3);
			format = "{day|d} {monthName} {year|d}";
		} else if (format == "long") {
			format = "{day|d} {monthName} {year|d}";
		} else if (format == "full") {
			format = "{weekday}, {day|d} {monthName} {year|d}";
		}
		
		return $vformat(format, null, date);
	};
	uk.formatDate = g.formatDate;
	
	ie.formatDate = function en_ie_format_date(date, format) {
		date = parse_date(date);
		
		if (format == "short") {
			format = "{day|02d}-{month|02d}-{year|04d}";
		} else if (format == "medium") {
			date.monthName = date.monthName.substr(0, 3);
			format = "{day|d} {monthName} {year|d}";
		} else if (format == "long") {
			format = "{day|d} {monthName} {year|d}";
		} else if (format == "full") {
			format = "{weekday} {day|d} {monthName} {year|d}";
		}
		
		return $vformat(format, null, date);
	};
	
	us.formatDate = function en_us_format_date(date, format) {
		date = parse_date(date);
		
		if (format == "short") {
			format = "{month|d}/{day|d}/{year|d}";
		} else if (format == "medium") {
			date.monthName = date.monthName.substr(0, 3);
			format = "{monthName} {day|d}, {year|d}";
		} else if (format == "long") {
			format = "{monthName} {day|d}, {year|d}";
		} else if (format == "full") {
			format = "{weekday}, {monthName} {day|d}, {year|d}";
		}
		
		return $vformat(format, null, date);
	};
	
	ca.formatDate = function en_ca_format_date(date, format) {
		date = parse_date(date);
		
		if (format == "short") {
			format = "{day|d}/{month|d}/{year|d}";
		} else if (format == "medium") {
			date.monthName = date.monthName.substr(0, 3);
			format = "{day|d}-{monthName}-{year|d}";
		} else if (format == "long") {
			format = "{monthName} {day|d}, {year|d}";
		} else if (format == "full") {
			format = "{weekday}, {monthName} {day|d}, {year|d}";
		}
		
		return $vformat(format, null, date);
	};
	
	au.formatDate = function en_au_format_date(date, format) {
		date = parse_date(date);
		
		if (format == "short") {
			format = "{day|d}/{month|02d}/{year|04d}";
		} else if (format == "medium") {
			format = "{day|02d}/{month|02d}/{year|d}";
		} else if (format == "long") {
			format = "{day|d} {monthName} {year|d}";
		} else if (format == "full") {
			format = "{weekday}, {day|d} {monthName} {year|d}";
		}
		
		return $vformat(format, null, date);
	};
	
	nz.formatDate = function en_nz_format_date(date, format) {
		date = parse_date(date);
		
		if (format == "short" || format == "medium") {
			format = "{day|d}/{month|02d}/{year|04d}";
		} else if (format == "long") {
			format = "{day|d} {monthName} {year|d}";
		} else if (format == "full") {
			format = "{weekday}, {day|d} {monthName} {year|d}";
		}
		
		return $vformat(format, null, date);
	};
	
	function en_12h_format_time(time, format) {
		time = parse_time(time);
		
		if (format == "long") {
			format = "{hour_12|d}:{minute|02d}:{second|02d} {am_pm}";
		} else {
			format = "{hour_12|d}:{minute|02d} {am_pm}";
		}
		
		return $vformat(format, null, time);
	}
	
	us.formatTime = ca.formatTime = au.formatTime = nz.formatTime =
		en_12h_format_time;
})();
