/**
 * Tools for opening new browser windows.
 */
Util.Window = {
	/** 
	 * Opens a new browser window.
	 *
	 * You should always specify a URI to open, or security warnings will
	 * result in some browsers if the parent window's document was loaded over
	 * HTTPS.
	 *
	 * This function accepts the following options:
	 *   - alert_if_blocked: display an alert() message if the window opening
	 *                       was blocked [default: true]
	 *   - display:          an option string or an object representation of
	 *                       the parameters that should be passed to the
	 *                       underlying window.open() function
	 *   - name:             the name of the new window [default: "_blank"]
	 *   - sync:             overwrite whatever document was loaded with a
	 *                       mostly-blank page [default: false]
	 *
	 * Returns the newly-opened popup window object, or a false value if
	 * the popup was blocked.
	 */
	open: function open_window(uri, options) {
		// defaults
		uri = uri || '';
		options = options || {};
		
		if (typeof(options.alert_if_blocked) == 'undefined')
			options.alert_if_blocked = true;
		
		if (options.display && typeof(options.display) != 'string') {
			options.display =
				Util.Window._build_display_string(options.display);
		}
		
		if (!options.display) {
			options.display = 'status=1,scrollbars=1,resizable,' +
				'width=600,height=300';
		}
		
		var popup = window.open(uri, options.name || '_blank',
			options.display);
		
		if (!popup) {
			// blocked!
			
			if (options.alert_if_blocked) {
				alert("I couldn't open a popup window. Please disable any " +
					"popup blockers and try again.");
			}
			return popup;
		}
		
		if (!uri || options.sync || options.force_sync) {
			popup.document.write(Util.Window._palate_cleanser);
			popup.document.close();
			
			var if_reload = popup.document.getElementById('util_window_error');
			if_reload.style.display = 'none';
		}
		
		return popup;
	},
	
	_build_display_string: function _build_display_string(options) {
		function stringify_part(name, value) {
			if (value === true)
				value = 1;
			else if (value === false)
				value = 0;
			
			return name + '=' + value;
		}
		
		var strings = [];
		
		for (var name in options) {
			strings.push(stringify_part(name, options[name]));
		}
		
		return strings.join(',');
	},
	
	_palate_cleanser: '<!DOCTYPE html PUBLIC ' +
		'"-//W3C//DTD XHTML 1.0 Transitional//EN" ' +
		'"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">' +
		'<html>' +
		'<head>' +
		'<title>Loki</title>' +
		'<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />' +
		'</head>' +
		'<body>' +
		'<div id="util_window_error">Sorry, you can\'t reset this dialog by ' +
		'reloading it. Please close me and open the dialog again.</div>' +
		'<script type="text/javascript">' +
		'if (window.opener) window.opener._loki_dialog_postback(window);' +
		'</script>' +
		'</body></html>'
};

/**
 * Alerts a message. Supercedes window.alert, since allows scrolling,
 * accepts document nodes rather than just strings, etc.
 *
 * @param	alertandum	the string or document chunk (i.e., node with
 *                      all of its children) to alert
 * @static
 */ 
Util.Window.alert = function(alertandum)
{
	// Open window
	var alert_window = Util.Window.open('', {
		display: 'status=1,scrollbars=1,resizable,width=600,height=300'
	});

	// Add the alertatandum to a document chunk
	var doc_chunk = alert_window.document.createElement('DIV'); // use a div because document frags don't work as expected on IE
	if ( typeof(alertandum) == 'string' )
	{
		var text = alertandum.toString();
		var text_arr = text.split("\n");
		for ( var i = 0; i < text_arr.length; i++ )
		{
			doc_chunk.appendChild(
				alert_window.document.createElement('DIV')
			).appendChild(
				alert_window.document.createTextNode(text_arr[i].toString())
			);
		}
	}
	else
	{
		doc_chunk.appendChild(
			Util.Document.import_node(alert_window.document, alertandum, true)
		);
		alert(doc_chunk.firstChild.nodeName);
	}

	// Append the document chunk to the window
	alert_window.document.body.appendChild(doc_chunk);
};

Util.Window.alert_debug = function(message)
{
	var alert_window = Util.Window.open('', {
		display: 'status=1,scrollbars=1,resizable,width=600,height=300'
	});
	
	var text_chunk = alert_window.document.createElement('P');
	text_chunk.style.fontFamily = 'monospace';
	text_chunk.appendChild(alert_window.document.createTextNode(message));
	alert_window.document.body.appendChild(text_chunk);
}
