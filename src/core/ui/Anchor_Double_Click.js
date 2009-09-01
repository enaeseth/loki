UI.Anchor_Double_Click = function AnchorDoubleClick() {
	Util.OOP.inherits(this, UI.Double_Click);
	this.helper = null;
	
	this.init = function(loki)
	{
		this.superclass.init.call(this, loki);
		this.helper = (new UI.Anchor_Helper).init(loki);
		return this;
	};
	
	this.double_click = function() {
		if (this.helper.is_selected())
			this.helper.open_dialog();
	};
};
