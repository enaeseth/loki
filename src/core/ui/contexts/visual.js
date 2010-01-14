UI.VisualContext = function VisualContext(editor) {
	this.editor = editor;
	this._textarea_height = editor.textarea.clientHeight;
	
	this.append_part('toolbar', this._create_toolbar);
	this.append_part('document', this._create_frame);
};

UI.VisualContext.prototype = new UI.Context();

Util.OOP.mixin(UI.VisualContext, {
	_create_toolbar: function _vc_create_toolbar(document) {
		var doc = new Util.Document(document);
		var container = doc.create_element('div', {className: 'toolbar'});
		var editor = this.editor;
		
		this.editor.enumerate_components('buttons', function vc_add_button(b) {
			var button = new b().init(editor);
			container.appendChild(button.create(document));
		});
		
		this.toolbar = container;
		return container;
	},
	
	_create_frame: function _vc_create_frame(document) {
		var doc = new Util.Document(document);
		var wrapper = doc.create_element('div', {className: 'iframe_wrapper'});
		
		var hidden = doc.create_element('input', {type: 'hidden'});
		if (this.editor.textarea.id)
			hidden.id = this.editor.textarea.id;
		if (this.editor.textarea.name)
			hidden.name = this.editor.textarea.name;
		if (this.editor.textarea.value)
			hidden.value = this.editor.textarea.value;
		wrapper.appendChild(hidden);
		this.form_element = hidden;
		
		var frame = this.frame = doc.create_element('iframe', {
			src: 'javascript:""',
			frameBorder: 0, // for IE's benefit
			style: {height: this._textarea_height}
		});
		wrapper.appendChild(frame);
		
		this.frame_wrapper = wrapper;
		return wrapper;
	},
	
	get_document_html: function vc_get_document_html() {
		var document = this.frame.contentWindow.document;
		var body = document.body;
		
		this.editor.enumerate_masseuses(function(masseuse) {
			masseuse.unmassage_node_descendants(body);
		});
		UI.Clean.clean(body, this.editor.settings);
		
		var html = this.editor.serialize_node_children(body);
		
		this.editor.enumerate_masseuses(function(masseuse) {
			masseuse.massage_node_descendants(body);
		});
		
		return UI.Clean.clean_HTML(html, this.editor.settings);
	},
	
	set_document_html: function vc_set_document_html(html) {
		var document = this.frame.contentWindow.document;
		var body = document.body;
		
		body.innerHTML = html;
		UI.Clean.clean(body, this.editor.settings);
		this.editor.enumerate_components('masseuses', function(masseuse) {
			masseuse.massage_node_descendants(body);
		});
	},
	
	get_dirty_html: function vc_get_dirty_html() {
		return this.frame.contentWindow.document.body.innerHTML;
	},
	
	focus: function vc_focus() {
		if (this.body && this.body.setActive)
			this.body.setActive();
		this.window.focus();
	},
	
	enter: function enter_visual_context(root, completion_callback) {
		UI.Context.prototype.enter.call(this, root);
		
		this._initialize_frame(root, completion_callback);
	},
	
	_initialize_frame: function _vc_initialize_frame(root, callback) {
		var self = this;
		this._init_status = undefined;
		
		try {
			var frame = this.frame;
			var ready = (frame && frame.contentWindow &&
				frame.contentWindow.document &&
				frame.contentWindow.document.location);
			if (!ready) {
				Util.Function.defer(function retry_frame_init() {
					self._initialize_frame(root, callback);
				});
				return;
			}
			
			this._clear_document(frame.contentWindow.document);
			
			this.window = frame.contentWindow;
			this.document = this.window.document;
			this.body = this.document.getElementsByTagName('BODY')[0];
			
			Util.Document.make_editable(this.document);
			
			callback(this);
		} catch (e) {
			while (root.lastChild)
				root.removeChild(root.lastChild);
			root.appendChild(this.editor.textarea);
			
			throw e;
		}
	},
	
	_clear_document: function _vc_clear_document(document) {
		var html = '<!DOCTYPE html PUBLIC ' +
			'"-//W3C//DTD XHTML 1.0 Transitional//EN"\n'+
			'\t"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n'+
			'<html xmlns="http://www.w3.org/1999/xhtml">\n\t<head>\n'+
			'\t<title>Loki editing document</title>\n</head>\n'+
			'<body></body>\n</html>';
			
		document.open();
		document.write(html);
		document.close();
	}
});
