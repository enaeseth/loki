/**
 * @class Contains helper functions related to cookies.
 * @author Eric Naeseth
 */
Util.Cookie = {
	/**
	 * Gets either all available cookies or the value of a specific cookie.
	 * @param {string} [name] if only one cookie's value is desired, its name
	 *                        may be provided here
	 * @return {mixed} either an object whose keys are cookie names and values
	 *                 are the corresponding cookie values, or a string
	 *                 corresponding to the value of the cookie
	 */
	get: function get_cookies(name)
	{
		var cookies = document.cookie.split(';');
		var cookie_pattern = /(\S+)=(.+)$/;
		var data = {};
		
		for (var i = 0; i < cookies.length; i++) {
			var match = cookie_pattern.exec(cookies[i]);
			if (!match || !match[1] || !match[2])	
				continue;
			
			if (name && match[1] == name)
				return match[2];
			else if (!name)
				data[match[1]] = match[2];
		}
		
		if (!name)
			return data;
	},
	
	/**
	 * Sets a cookie.
	 * @param {string} name   the name of the cookie
	 * @param {string} value  the cookie's value
	 * @param {number} [days] the number of days for which the cookie should
	 *                        remain valid; if unspecified, the cookie remains
	 *                        valid only for the active browser session
	 * @return {void}
	 */
	set: function set_cookie(name, value, days)
	{
		var expires = '';
		
		if (days) {
			var date = new Date();
			date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
			
			expires = '; expires=' + date.toGMTString();
		}
		
		document.cookie = name + '=' + value + expires + '; path=/';
	},
	
	/**
	 * Deletes a cookie.
	 * @param {string} name   the name of the cookie to delete
	 * @return {void}
	 */
	erase: function erase_cookie(name)
	{
		this.set(name, '', -1);
	}
};