/**
 * @class Displays informative messages to the user.
 * @author Eric Naeseth
 */
UI.Messenger = {
	/**
	 * Displays a message.
	 * @param {string}  message  the message to be displayed
	 * @return {void}
	 */
	display: function display_message(message)
	{
		// It'd be nice to have a non-alert implementation of this someday. -EN
		alert(message);
	},
	
	/**
	 * Displays a message only once for the current user session.
	 * This works by setting a session cookie when the message is first
	 * displayed. If, when this function is called again, the cookie already
	 * exists, the message is not displayed.
	 * @param {string}  id       a fixed ID that can be used to identify this
	 *                           message in a cookie name
	 * @param {string}  message  the message to be displayed
	 * @return {boolean} true if the message was actually displayed, false if
	 *                   not
	 */
	display_once: function display_message_once_per_session(id, message)
	{
		return this.display_once_per_duration(id, message, null);
	},
	
	/**
	 * Displays a message only once for at least some number of days.
	 * This works by setting a cookie with an expiration date when the message
	 * is first displayed. If, when this function is called again, the cookie
	 * already exists, the message is not displayed.
	 * @param {string}  id       a fixed ID that can be used to identify this
	 *                           message in a cookie name
	 * @param {string}  message  the message to be displayed
	 * @param {number}  days     the number of days for which the message should
	 *                           not be shown
	 * @return {boolean} true if the message was actually displayed, false if
	 *                   not
	 */
	display_once_per_duration:
		function display_message_once_per_duration(id, message, days)
	{
		var cookie_name = '_loki2_pmsg_' + id.replace(/\W+/g, '_');
		
		if (Util.Cookie.get(cookie_name)) {
			// Already displayed this session.
			return false;
		}
		
		this.display(message);
		
		Util.Cookie.set(cookie_name, 'displayed', days);
		return true;
	}
}