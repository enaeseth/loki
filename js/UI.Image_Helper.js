/**
 * Declares instance variables.
 *
 * @constructor
 *
 * @class A class for helping insert an image. Contains code
 * common to both the button and the menu item.
 */
UI.Image_Helper = function()
{
	var self = this;
	Util.OOP.inherits(self, UI.Helper);

	this.init = function(loki)
	{
		this._loki = loki;
		this._image_masseuse = (new UI.Image_Masseuse()).init(this._loki);
		return this;
	};
	
	this.get_selected_image = function get_selected_image()
	{
		var sel = Util.Selection.get_selection(self._loki.window);
		var rng = Util.Range.create_range(sel);
		
		var images;
		var image;
		var real_image;
		
		function is_valid_image(node) {
			if (!Util.Node.is_tag(node, 'IMG'))
				return false;
			
			return !node.getAttribute('loki:fake');
		}
		
		images = Util.Range.find_nodes(rng, is_valid_image, true);
		
		if (!images || !images.length) {
			return null;
		} else if (images.length > 1) {
			throw new UI.Multiple_Items_Error('Multiple images are currently ' +
				'selected.');
		}
		
		image = images[0];
		
		return this._image_masseuse.realize_elem(image);
	};
	
	this.get_selected_item = function get_selected_image_info()
	{
		var image = this.get_selected_image();
		if (!image)
			return null;
		
		return {
			uri: image.src,
			alt: image.alt,
			align: image.align
		};
	};

	this.is_selected = function image_is_selected()
	{
		try {
			return !!this.get_selected_image();
		} catch (e) {
			if (e.name == 'UI.Multiple_Items_Error')
				return true;
			throw e;
		}
	};
	
	this.open_dialog = function open_image_dialog()
	{
		var selected_image;
		
		try {
			selected_image = this.get_selected_item();
		} catch (e) {
			if (e.name == 'UI.Multiple_Items_Error') {
				alert('Multiple images are currently selected. Please narrow ' +
					'down your selection so that it only contains one image.');
				return;
			} else {
				throw e;
			}
		}
		
		if (!this._image_dialog)
			this._image_dialog = new UI.Image_Dialog();
		
		this._image_dialog.init({
			data_source: self._loki.settings.images_feed,
			base_uri: self._loki.settings.base_uri,
			submit_listener: self.insert_image,
			remove_listener: self.remove_image,
			selected_item: selected_image
		});
		this._image_dialog.open();
	};
	
	this.insert_image = function insert_image(params)
	{
		var image, clean_src, selected_image, sel, rng;
		
		image = self._loki.document.createElement('IMG');
		clean_src = UI.Clean.clean_URI(params.uri);
		
		image.src = clean_src;
		image.alt = params.alt;
		
		if (params.align)
			image.align = params.align;
		
		image = self._image_masseuse.get_fake_elem(image);
		
		self._loki.window.focus();
		selected_image = self.get_selected_image();
		if (selected_image) {
			selected_image.parentNode.replaceChild(image, selected_image);
		} else {
			sel = Util.Selection.get_selection(self._loki.window);
			rng = Util.Range.create_range(sel);
			
			Util.Range.delete_contents(rng);
			Util.Range.insert_node(rng, image);
		}
	};

	this.remove_image = function remove_image()
	{
		var image, sel;
		
		image = self.get_selected_image();
		
		if (!image)
			return false;
		
		sel = Util.Selection.get_selection(self._loki.window);

		// Move cursor
		Util.Selection.select_node(sel, image);
		Util.Selection.collapse(sel, false); // to end
		self._loki.window.focus();

		if (image.parentNode)
			image.parentNode.removeChild(image);
		return true;
	};
};
