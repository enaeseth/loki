UI.Media_Double_Click = function Media_Double_Click(loki) {
	UI.Double_Click.call(this, loki); // superclass constructor
	
	this.helper = new UI.Media_Helper(loki);
};

Util.OOP.bless(UI.Media_Double_Click, UI.Double_Click);
Util.OOP.mixin(UI.Media_Double_Click, {
	double_click: function media_double_click() {
		var element = this.helper.get_selected();
		
		if (element)
			this.helper.open_dialog(element);
	}
});
