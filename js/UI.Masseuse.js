/**
 * Declares instance variables.
 *
 * @constructor
 *
 * @class Represents a body masseuse, to replace elements 
 * inconvenient to edit with fake elements that are convenient 
 * to edit. For extending only.
 */
UI.Masseuse = function()
{
	this._loki;

	/**
	 * Massages the given node's descendants, replacing any elements inconvenient 
	 * to edit with convenient ones.
	 */
	this.massage_node_descendants = function(node)
	{
	};
	
	/**
	 * Unmassages the given node's descendants, replacing any convenient but fake
	 * elements with real ones.
	 */
	this.unmassage_node_descendants = function(node)
	{
	};

	/**
	 * For convenience.
	 */
	this.massage_body = function()
	{
		this.massage_node_descendants(this._loki.document);
	};

	/**
	 * For convenience.
	 */
	this.unmassage_body = function()
	{
		this.unmassage_node_descendants(this._loki.document);
	};
};

UI.Masseuse.prototype.init = function(loki)
{
	this._loki = loki;
	return this;
};

UI.Masseuse.fake_id_pattern = /^_loki_[a-z]+$/;

UI.Masseuse.prototype.assign_fake_id = function assign_fake_element_id(elem) {
	var base = 'az';
	
	function random_int(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	
	function generate_id(length) {
		var i, id = '_loki_', c;
		if (!length)
			length = 6
		for (i = 0; i < length; ++i) {
			c = random_int(base.charCodeAt(0), base.charCodeAt(1));
			id += String.fromCharCode(c);
		}
		return (elem.ownerDocument.getElementById(id))
			? generate_id(length)
			: id;
	}
	
	if (!elem.id)
		elem.id = generate_id();
	return elem.id;
};

UI.Masseuse.prototype.is_fake = function is_element_take(elem) {
	if (elem.getAttribute('loki:fake'))
		return true;
	
	return (elem.id && UI.Masseuse.fake_id_pattern.test(elem.id))
};

UI.Masseuse.prototype.remove_fake_id = function remove_fake_element_id(elem) {
	if (elem.id && UI.Masseuse.fake_id_pattern.test(elem.id))
		elem.removeAttribute('id');
};
