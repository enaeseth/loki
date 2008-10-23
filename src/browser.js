// Namespace: Loki.Browser
// Browser information.
Loki.Browser = {
	// var: (Boolean) IE
	// True if the user's browser is Internet Explorer.
	IE:     !!(window.attachEvent && !window.opera),
	
	// var: (Boolean) Opera
	// True if the user's browser is Opera.
	Opera:  !!window.opera,
	
	// var: (Boolean) WebKit
	// True if the user's browser uses Apple WebKit for rendering.
	WebKit: (navigator.userAgent.indexOf('AppleWebKit/') > -1),
	
	// var: (Boolean) Safari
	// True if the user's browser is Apple Safari.
	Safari: (navigator.userAgent.indexOf('Safari/') > -1 &&
		navigator.userAgent.indexOf('Chrome/') == -1),
		
	// var: (Boolean) Chrome
	// True if the user's browser is Google Chrome.
	Chrome: (navigator.userAgent.indexOf('Chrome/') > -1),
	
	// var: (Boolean) Gecko
	// True if the user's browser uses Mozilla Gecko for rendering.
	Gecko:  (navigator.userAgent.indexOf('Gecko') > -1 &&
		navigator.userAgent.indexOf('KHTML') == -1),
		
	// var: (Boolean) Windows
	// True if the user's browser is running under Microsoft Windows.
	Windows: (navigator.platform.indexOf('Win') > -1),
	
	// var: (Boolean) Mac
	// True if the user's browser is running under Mac OS.
	Mac: (navigator.platform.indexOf('Mac') > -1),
	
	getVersion: function get_browser_version() {
		var pattern, match;
		
		if (Loki.Browser.IE) {
			pattern = /MSIE\s+([\d+\.]+)/;
		} else if (Loki.Browser.Gecko) {
			pattern = /rv:([\d+\.]+)/;
		} else if (Loki.Browser.WebKit) {
			if (/Safari/.test(navigator.userAgent)) {
				match = /Version\/([\d+\.]+)/.exec(navigator.userAgent);
				if (match && match.length >= 1) {
					return match[1];
				}
				match = /Safari\/([\d+\.]+)/.exec(navigator.userAgent);
				if (match && match.length >= 1) {
					if (Loki.Browser._safari_versions[match[1]]) {
						return Loki.Browser._safari_versions[match[1]];
					}
				}
			}
			return '';
		} else if (Loki.Browser.Opera) {
			pattern = /Opera[\/ ]([\d+\.]+)/;
		}
		
		match = pattern.exec(navigator.userAgent);
		return (match && match.length >= 1) ? match[1] : '';
	},
	
	_safari_versions: {
		'525.19': '3.1.2',
		'525.18': '3.1.1',
		'525.7': '3.1',
		'523': '3.0.4',
		'418.8': '2.0.4',
		'417.9': '2.0.3',
		'416': '2.0.2',
		'412.7': '2.0.1',
		'412': '2.0',
		'312.8': '1.3.2',
		'312.5': '1.3.1',
		'312.1': '1.3',
		'125.5.5': '1.2.4',
		'125.4': '1.2.3',
		'125.2': '1.2.2',
		'100': '1.1',
		'85.8.2': '1.0.3',
		'85.7': '1.0.2'
	}
};
