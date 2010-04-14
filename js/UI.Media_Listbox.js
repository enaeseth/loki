/**
 * Displays media resources in a paged grid.
 */
UI.Media_Listbox = function Media_Listbox(loki) {
	Util.OOP.inherits(this, UI.Listbox);
	
	var media_image_base = loki.settings.base_uri + 'images/media/';
	var default_thumb_uri = media_image_base + 'blank_thumbnail.png';
	
	this._create_item_chunk = function create_media_item_chunk(item) {
		var parts = {}
		var doc = this._doc_obj;
		var chunk = Util.Document.build(doc,
			'<a href="#" class="item_chunk">' +
			'<div class="media_avatar"><img src="" />' +
			'<div class="media_types"></div>' +
			'</div>' +
			'<div class="media_title"><span></span></div></a>',
			{title: 'span', thumb: 'img', types: '.media_types'}, parts);
		
		parts.title.appendChild(doc.createTextNode(item.title));
		
		parts.thumb.src = item.thumbnail || default_thumb_uri;
		parts.thumb.alt = '[' + item.type + ': ' + item.title + ']';
		Util.Image.set_max_size(parts.thumb, 125, 125);
		Util.Event.observe(parts.thumb, 'load', function() {
			Util.Image.set_max_size(parts.thumb, 125, 125);
		});
		
		function add_type_icon(title, icon) {
			var icon = Util.Document.create_element(doc, 'img', {
				src: media_image_base + icon,
				alt: title,
				title: title
			});
			
			parts.types.appendChild(icon);
		}
		
		var types = Util.Array.map(item.types || [], function normcase(s) {
			return s.toLowerCase()
		});
		
		// display the video and audio types icons before any possible other
		// types
		if (Util.Array.contains(types, 'video'))
			add_type_icon('Video', 'video.png');
		if (Util.Array.contains(types, 'audio'))
			add_type_icon('Audio', 'audio.png');
		
		var misc_shown = false;
		Util.Array.for_each(types, function(type_name) {
			if (type_name == 'video' || type_name == 'audio')
				return;
			
		});
		
		return chunk;
	};
};
