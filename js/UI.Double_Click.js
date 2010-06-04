/**
 * Declares instance variables.
 * @class A body double-click listener. For extending only.
 */
UI.Double_Click = function DoubleClick()
{
	this.init = function(loki)
	{
		this._loki = loki;
		return this;
	};
};

UI.Double_Click.prototype.double_click = function _no_double_click() {
	throw new Error('unimplemented');
};
