/**
 * Declares instance variables.
 *
 * @constructor
 *
 * @class A class for inserting an image.
 */
UI.Image_Masseuse = function()
{
	var self = this;
	Util.OOP.inherits(self, UI.Masseuse);
			
	this.init = function(loki)
	{
		this.superclass.init.call(this, loki);
		this._unsecured = /^http:/;
		return this;
	};

	/**
	 * Massages the given node's descendants.
	 */
	this.massage_node_descendants = function(node)
	{
		self.secure_node_descendants(node);
	};
	
	this.secure_node_descendants = function(node)
	{
		Util.Array.for_each(node.getElementsByTagName('IMG'),
			self.secure_node, self);
	};
	
	this.secure_node = function(img)
	{
		var placeholder = self.get_fake_elem(img);
		if (placeholder.src !== img.src)
			img.parentNode.replaceChild(placeholder, img);
	};
	
	this.get_fake_elem = function(img)
	{
		var placeholder, src = img.getAttribute('src');
		if (src == null)
			return;
		
		var my_url = self._loki.owner_window.location;
		if (!self._unsecured.test(my_url) && self._unsecured.test(src)) {
			placeholder = img.cloneNode(false);
			
			if (Util.URI.extract_domain(src) == self._loki.editor_domain()) {
				new_src = Util.URI.strip_https_and_http(src);
			} else if (self._loki.settings.sanitize_unsecured) {
				new_src = self._loki.settings.base_uri +
					'images/insecure_image.gif';
				placeholder.setAttribute('loki:src', img.src);
				placeholder.setAttribute('loki:fake', 'true');
			} else {
				return img;
			}
			
			placeholder.src = new_src;
			
			return placeholder;
		}
		
		return img;
	};

	/**
	 * Unmassages the given node's descendants.
	 */
	this.unmassage_node_descendants = function(node)
	{
		Util.Array.for_each(node.getElementsByTagName('IMG'),
			self.unmassage_node, self);
	};
	
	this.unmassage_node = function(img)
	{
		var real = self.get_real_elem(img);
		if (real && real.src != img.src)
			img.parentNode.replaceChild(real, img);
	};
	
	this.get_real_elem = function(img)
	{
		var src, real;
		
		if (!img)
			return null;
		
		src = img.getAttribute('loki:src');
		if (!src)
			return null;
		
		real = img.ownerDocument.createElement('IMG');
		if (img.title)
			real.title = img.title;
		if (img.alt)
			real.alt = img.alt;
		real.src = src;
		
		return real;
	};
	
	/**
	 * If "img" is a fake element, returns its corresponding real element,
	 * otherwise return the element itself.
	 */
	this.realize_elem = function(img)
	{
		return this.get_real_elem(img) || img;
	}
};
