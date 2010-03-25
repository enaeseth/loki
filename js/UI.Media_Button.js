/**
 * A toolbar button that calls up a whole world of media.
 */
UI.Media_Button = function MediaButton() {
	var self = this;
	
	Util.OOP.inherits(this, UI.Button);
	
	this.image = 'media.png';
	this.title = 'Insert Media';
	
	this.click_listener = function open_media_dialog() {
		var dialog = new UI.Media_Dialog(self._loki, {
			default_source: 'reason',
			sources: {
				reason: {
					label: 'Carleton',
					url: 'media.json?_=' + Math.floor(new Date().getTime() / 1000),
					// url: '//eric.test.carleton.edu/test/media/media.php?site=122870'
				},
				
				youtube: {
					label: 'YouTube'
				}
			}
		});
		dialog.open();
	};
};
