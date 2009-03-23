/**
 * @class Provides a nicely-formatted inline error display.
 * @constructor
 * @param {HTMLElement} the element into which the message will be inserted
 */
UI.Error_Display = function(message_container)
{
	var doc = message_container.ownerDocument;
	var dh = new Util.Document(doc);
	
	var self = this;
	
	this.display = null;
	
	function create(message, options)
	{
		if ('function' == typeof(options)) {
		    options = [['Retry.', options]];
		}
		
		self.display = dh.create_element('p', {className: 'error'});
		self.display.innerHTML = message;
		
		function add_action(text, action) {
		    var link = dh.create_element('a', {
				href: '#',
				className: 'action'
			});
			link.innerHTML = text;
			
			Util.Event.add_event_listener(link, 'click', function(e) {
				if (!e)
					var e = window.event;

				try {
					action();
				} catch (e) {
					self.show('That didn\'t work: ' + (e.message || e), action);
				} finally {
					return Util.Event.prevent_default(e);
				}
			});
			
			self.display.appendChild(link);
		}
		
		if (options) {
    		options.each(function (action) {
    		   add_action(action[0], action[1]); 
    		});
    	}
		
		message_container.appendChild(self.display);
	}
	
	function remove()
	{
		if (this.display.parentNode)
			this.display.parentNode.removeChild(this.display);
		this.display = null;
	}
	
	this.show = function(message, retry, retry_text)
	{
		if (!retry)
			var retry = null;
		
		if (this.display)
			remove.call(this);
		
		create.call(this, message, retry, retry_text);
	}
	
	this.clear = function()
	{
		if (this.display)
			remove.call(this);
	}
}
