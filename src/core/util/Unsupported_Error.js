/**
 * @class Indicates that an operation is unsupported by the browser.
 * @constructor
 * @param {string}	call
 * @author Eric Naeseth
 */
Util.Unsupported_Error = function UnsupportedError(call)
{
	var error = new Error('No known implementation of ' + call +
		' is available from this browser.');
	error.name = 'Util.Unsupported_Error';
	return error;
}
