/**
 * Declares instance variables.
 *
 * @constructor
 *
 * @class Represents a button. For extending only.
 */
UI.Button = function()
{
	this.image; // string to location in base_uri/img/
	this.title; // string
	this.click_listener; // function
	this.state_querier; // function (optional)
	this.show_on_source_toolbar = false; // boolean (optional)

	this.init = function(loki)
	{
		this._loki = loki;
		return this;
	};
	
	this.create = function create_button_element(document) {
		var self = this;
		var doc = new Util.Document(document);
		var button = doc.create_element('a', {href: '#'});
		var img;
		
		function class_adder(class_name) {
			return function() {
				Util.Element.add_class(button, class_name);
			};
		}
		function class_remover(class_name) {
			return function() {
				Util.Element.remove_class(button, class_name);
			};
		}
		
		Util.Event.observe(button, 'mouseover', class_adder('hover'));
		Util.Event.observe(button, 'mouseout', class_remover('hover'));
		Util.Event.observe(button, 'mousedown', class_adder('active'));
		Util.Event.observe(button, 'mouseup', class_remover('active'));
		
		Util.Event.observe(button, 'click', function button_clicked(ev) {
			self.click_listener();
			return Util.Event.prevent_default(ev);
		});

		var base = this._loki.settings.base_uri;
		var img_src = base + 'static/images/toolbar/' + this.image;

		// Apply PNG fix.
		if (Util.Browser.IE && /MSIE 6/.test(navigator.userAgent)) {
			button.title = this.title;
			img_src = Util.URI.build(Util.URI.normalize(img_src));
			img = doc.create_element('span', {
				className: 'loki_filtered_button',
				style: {
					filter: "progid:" +
						"DXImageTransform.Microsoft.AlphaImageLoader(src='" +
					    img_src + "', sizingMethod='image')"
				}
			});
		} else {
			img = doc.create_element('img', {
				src: img_src,
				title: this.title,
				style: {border: 'none'}
			});
		}
		img.setAttribute('unselectable', 'on')
		
		button.appendChild(img);
		return button;
	};
};
