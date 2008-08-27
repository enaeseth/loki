/**
 * Declares instance variables.
 *
 * @constructor
 *
 * @class Represents "source" toolbar button.
 */
UI.Source_Button = function()
{
	var self = this;
	Util.OOP.inherits(self, UI.Button);

	this.image = 'source.png';
	this.title = 'Toggle HTML source view';
	this.show_on_source_toolbar = true;
	this.click_listener = function() {
		try {
			self._loki.toggle_iframe_textarea(); 
		} catch (e) {
			alert("An error occurred that prevented your document's HTML " +
				"from being generated.\n\nTechnical details:\n" +
				e);
		}
		
	};
};
