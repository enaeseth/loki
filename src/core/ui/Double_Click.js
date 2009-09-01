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
	
	this.double_click = function() {
		throw new Error('unimplemented');
	};
};
