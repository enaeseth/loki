/**
 * A toolbar button that calls up a whole world of media.
 */
UI.Media_Button = function MediaButton() {
	var self = this;
	
	Util.OOP.inherits(this, UI.Button);
	
	this.image = 'media.png';
	this.title = 'Insert Media';
	
	var helper = null;
	
	this.init = function(loki) {
		this.superclass.init.call(this, loki);
		helper = new UI.Media_Helper(this._loki);
		return this;
	};
	
	this.click_listener = function open_media_dialog() {
		helper.open_dialog();
	};
};
