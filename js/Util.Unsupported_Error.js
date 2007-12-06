/**
 * @class Indicates that an operation is unsupported by the browser.
 * @constructor
 * @param {string}	call
 * @author Eric Naeseth
 */
Util.Unsupported_Error = function UnsupportedError(call)
{
	Util.OOP.inherits(this, Error, 'No known implementation of ' + call +
		' is available from this browser.');
	this.name = 'Util.Unsupported_Error';
}