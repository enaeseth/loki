/**
 * Creates a dialog for selecting media (video, audio, etc.) to insert into
 * a Loki document.
 *
 * In addition to the options supported for all dialog windows, media dialogs
 * support the following ones:
 *   - sources:         an object mapping media source names to their details
 *   - default_source:  the key of the media source to show by default when
 *                      inserting a new resource
 */
UI.Media_Dialog = function MediaDialog(loki, options) {
	options = Util.OOP.extend({
		width: 700,
		height: 600,
		root_id: 'media_dialog'
	}, options || {});
	options.style_sheets = [
		'css/Listbox.css',
		'css/Tabset.css',
		'css/Media_Dialog.css'
	].concat(options.style_sheets || []);
	
	// call superclass constructor
	UI.Dialog_Window.call(this, loki, options);
	
	this.sources = options.sources || {};
	this.default_source = options.default_source;
	
	// Make a clone of the source objects we get, as we add properties to them:
	Util.Object.enumerate(this.sources, function clone_source(name, source) {
		this.sources[name] = Util.Object.clone(source);
	}, this);
	
	this.helper = new UI.Media_Helper(loki);
	this.selection = null;
};

// UI.Media_Dialog inherits from UI.Dialog_Window.
Util.OOP.bless(UI.Media_Dialog, UI.Dialog_Window);

// Media dialog methods:
Util.OOP.mixin(UI.Media_Dialog, {
	/**
	 * Dialog_Window callback function: constructs the dialog contents.
	 */
	construct: function construct_media_dialog() {
		this.title = this.append('<h1>Insert media from:</h1>');
		
		this.tabset = this._create_tabset();
		
		this.views = {};
		this._create_custom_panel();
		
		Util.Object.enumerate(this.sources,
			Util.Function.bind(this._create_source_panel, this));
		
		this.use_submit_and_cancel();
	},
	
	/**
	 * Dialog_Window callback function: populates the values on the dialog.
	 */
	populate: function populate_media_dialog(element) {
		this._fill_custom_panel(element);
		
		if (element) {
			this.selection = {
				element: element,
				urls: this.helper.extract_urls(element),
				source: null,
				resource: null,
				file: null
			};
			
			Util.Object.enumerate(this.sources,
				Util.Function.bind(this._locate_selected_media, this));
		} else {
			this.selection = null;
		}
	},
	
	submit: function submit_media_dialog() {
		var selected_tab = this.tabset.get_selected_tab().name;
		var markup;
		var selection;
		
		if (selected_tab == 'custom') {
			markup = this.views.custom.markup;
			
			if (!markup) {
				alert("No valid media HTML has been entered.");
				return;
			}
		} else {
			selection = this.sources[selected_tab].selection;
			
			if (!selection || !selection.resource) {
				alert("No media resource is selected.");
				return;
			} else if (!selection.file) {
				alert("Please select which file you wish to insert.");
				return;
			}
			
			markup = selection.file.markup;
		}
		
		this.helper.insert(markup);
		this.close();
	},
	
	_create_tabset: function create_media_tabset() {
		var tabset = new Util.Tabset(this.document);
		
		Util.Object.enumerate(this.sources, function(name, info) {
			tabset.add_tab(name, info.label || name);
		});
		tabset.add_tab('custom', 'another site');
		
		tabset.select_tab(this.default_source || 'custom');
		this.root.appendChild(tabset.root);
		
		return tabset;
	},
	
	_create_source_panel: function create_media_source_panel(name, source) {
		var self = this;
		var panel = this.tabset.get_tab(name).panel;
		var dh = new Util.Document(this.document);
		
		var listbox = source.listbox = new UI.Media_Listbox(this.loki);
		listbox.init(name + '_listbox', this.document);
		panel.appendChild(listbox.get_listbox_elem());
		
		if (source.media) {
			this._fill_source_media(name, source, source.media);
		} else if (source.url) {
			this._download_source_media(name, source);
		} else {
			source.active_media = null;
			listbox._report_error('No media is available from ' +
				source.label + '.');
			return;
		}
		
		var fieldset = this.build('<div class="empty media fieldset">' +
			'<div class="media_preview"></div>' +
			'<form class="file_selection">' +
			'<p><select name="files"></select></p>' +
			'<div class="media_file_info"></div>' +
			'</div>', {
				preview: '.media_preview',
				file_selector: 'select',
				metadata_display: '.media_file_info'
			}, source);
		panel.appendChild(fieldset);
		
		source.selection = null;
		
		listbox.add_event_listener('change', function resource_changed() {
			var resource = listbox.get_selected_item();
			var selector = source.file_selector;
			
			source.selection = {resource: resource, file: null};
			
			Util.Element.add_class(fieldset, 'empty');
			if (!resource)
				return;
			
			while (selector.firstChild)
				selector.removeChild(selector.firstChild);
			while (source.preview.firstChild)
				source.preview.removeChild(source.preview.firstChild);
			
			var files = resource.files;
			if (files.length > 1) {
				selector.appendChild(dh.create_element('option', {
					value: ''
				}, ['Choose a file…']));
			}
			
			Util.Array.for_each(files, function(file, i) {
				var title = file.title;
				
				if (file.type)
					title += ' (' + file.type + ')';
				
				selector.appendChild(dh.create_element('option', {
					value: String(i)
				}, [title]));
			});
			
			Util.Element.remove_class(fieldset, 'empty');
			
			if (files.length == 1)
				file_changed();
		});
		
		function file_changed() {
			var resource = listbox.get_selected_item();
			var index = source.file_selector.selectedIndex;
			var option = source.file_selector.options[index];
			var file = resource.files[Number(option.value)];
			
			source.selection.file = file;
			
			var temp = self.document.createElement('DIV');
			temp.innerHTML = file.markup;
			var media = temp.firstChild;
			var dest = source.preview;
			
			while (dest.firstChild)
				dest.removeChild(dest.firstChild);
			
			self.helper.resize(media, dest.clientWidth, dest.clientHeight);
			dest.appendChild(media);
		}
		
		Util.Event.observe(source.file_selector, 'change', file_changed);
	},
	
	_fill_source_media: function fill_source_media(name, source, media) {
		source.active_media = media;
		
		Util.Array.for_each(media, function(resource) {
			source.listbox.append_item(resource);
		});
		
		source.listbox.refresh();
	},
	
	_download_source_media: function download_source_media(name, source) {
		var request;
		var dialog = this;
		
		function no_valid_result(message) {
			request.abort();
			source.listbox._report_error(message || 'No media is available ' +
				'from ' + source.label + '.');
		}
		
		function handle_error_response() {
			var server_type = request.get_header('Content-Type');
			
			if (server_type && server_type.indexOf('text/plain') === 0) {
				no_valid_result(request.transport.responseText);
			} else {
				no_valid_result('An error occurred while getting media. ' +
					'(' + request.get_status_text() + ')');
			}
		}
		
		function check_content_type() {
			var acceptable = ['text/plain', 'application/json'];
			var server_type = request.get_header('Content-Type');
			
			if (!server_type) {
				no_valid_result('The server did not indicate the content-' +
					'type of the media data.');
				return false;
			}
			
			var valid = Util.Array.find(acceptable, function(type) {
				return server_type.indexOf(type) === 0;
			});
			
			if (!valid) {
				no_valid_result('The server responded with data of an ' +
					'invalid type. (' + server_type + ')');
				return false;
			}
			
			return true;
		}
		
		var options = {
			method: 'get',
			timeout: 12,
			
			on_failure: function(request) {
				handle_error_response();
			},
			
			on_success: function(request, transport) {
				if (!check_content_type())
					return;
				
				try {
					var media = JSON.parse(transport.responseText);
				} catch (e) {
					no_valid_result('The server did not respond with a ' +
						'valid JSON object.');
					return;
				}
				
				dialog._fill_source_media(name, source, media);
				if (dialog.selection && !dialog.selection.source) {
					dialog._locate_selected_media(name, source);
				}
			}
		};
		
		request = new Util.Request(source.url, options);
	},
	
	_locate_selected_media: function locate_selected_media(name, source) {
		if (!source.active_media)
			return;
		
		var selection_urls = this.selection.urls;
		
		// find the resource file that has one of the URL's of the selected
		// media
		Util.Array.find(source.active_media, function(resource) {
			return Util.Array.find(resource.files, function(file) {
				var file_urls = this.helper.extract_urls(file.markup, true);
				
				var match = Util.Array.find(selection_urls, function(url) {
					return (url in file_urls);
				});
				
				if (!match)
					return false;
				
				try {
					var i = source.listbox.get_index_of_item(resource);
				} catch (e) {
					return false;
				}
				
				// omg we found it
				
				this.selection.source = name;
				this.selection.resource = resource;
				this.selection.file = file;
				
				source.listbox.select_item_by_index(i);
				this.tabset.select_tab(name);
				this._fill_custom_panel(null);
				return true;
			}, this);
		}, this);
	},
	
	_create_custom_panel: function create_custom_media_panel() {
		var view = this.views.custom = {};
		
		var contents = this.build('<div id="custom_preview" class="empty">' +
			'<div class="prompt">Paste the HTML to embed your media in the ' +
			'box to the right.</div>' +
			'<div class="invalid">Sorry, that doesn&rsquo;t look like valid ' +
			'code.</div><div id="embed_target"></div></div>' +
			'<form id="custom_entry">' +
			'<label for="custom_html">Media embedding HTML:</label>' +
			'<textarea id="custom_html" name="html"></textarea></form>',
			{
				preview: '#custom_preview',
				prompt: '.prompt',
				invalid_msg: '.invalid',
				input: '#custom_entry > textarea',
				target: '#embed_target'
			}, this.views.custom);
		
		Util.Event.observe(view.input, 'change', function() {
			var html = Util.trim(view.input.value);
			var temp;
			
			view.target.innerHTML = '';
			view.markup = null;
			
			if (html.length == 0) {
				view.preview.className = 'empty';
			} else {
				Util.Element.remove_class(view.preview, 'empty');
				
				if (this.helper.validate(html)) {
					temp = this.document.createElement('DIV');
					temp.innerHTML = html;
					
					this.helper.resize(temp.firstChild,
						view.target.clientWidth, view.target.clientHeight);
					
					Util.Element.remove_class(view.preview, 'problem');
					view.target.appendChild(temp.firstChild);
					view.markup = html;
				} else {
					Util.Element.add_class(view.preview, 'problem');
				}
			}
		}, this);
		
		this.tabset.get_tab('custom').panel.appendChild(contents);
	},
	
	_fill_custom_panel: function fill_custom_media_panel(element) {
		if (!element) {
			this.views.custom.input.value = '';
		} else {
			var gen = new Util.HTML_Generator({indent_text: '  '});
			this.views.custom.input.value = gen.generate(element);
		}
	}
});
