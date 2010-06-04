UI.Media_Masseuse = function Media_Masseuse() {
	var self = this;
	Util.OOP.inherits(this, UI.Masseuse);
	
	var targets = ['OBJECT', 'VIDEO', 'AUDIO'];
	var placeholder_class = UI.Media_Masseuse.placeholder_class;
	
	this.init = function init_media_masseuse(loki)
	{
		this.superclass.init.call(this, loki);
		
		if (!loki._massaged_media)
			loki._massaged_media = {};
		this.massaged = loki._massaged_media;
		
		return this;
	};
	
	this.massage_node_descendants = function(node) {
		var elements;
		
		if (node.querySelectorAll) {
			elements = node.querySelectorAll('object, video, audio');
			Util.Array.for_each(elements, this.massage, this);
		} else {
			Util.Array.for_each(targets, function(tag) {
				Util.Array.for_each(node.getElementsByTagName(tag),
					this.masssage, this);
			}, this);
		}
	};
	
	this.unmassage_node_descendants = function(node) {
		var elements;
		
		if (node.querySelectorAll) {
			elements = node.querySelectorAll('img.' + placeholder_class);
		} else if (node.getElementsByClassName) {
			elements = node.getElementsByClassName(placeholder_class);
		} else {
			elements = node.getElementsByTagName('IMG');
			elements = Util.Array.find_all(elements, function(elem) {
				return elem.className == placeholder_class;
			});
		}
		
		Util.Array.for_each(elements, this.unmassage, this);
	};
	
	this.massage = function massage_media_element(node) {
		var doc = node.ownerDocument;
		var placeholder = Util.Document.create_element(doc, 'img', {
			className: placeholder_class,
			src: this._loki.settings.base_uri + 'images/media/placeholder.gif',
			width: node.width,
			height: node.height,
			'loki:fake': true
		});
		
		var id = this.assign_fake_id(placeholder);
		this.massaged[id] = node;
		
		node.parentNode.replaceChild(placeholder, node);
	};
	
	this.unmassage = function unmassage_media_element(node) {
		var actual = this.massaged[node.id];
		
		if (!actual)
			return;
		
		node.parentNode.replaceChild(actual, node);
	};
	
	this.get_original_element = function get_original_media_element(placeholder) {
		return this.massaged[placeholder.id];
	};
};

UI.Media_Masseuse.placeholder_class = 'loki__media_placeholder';
