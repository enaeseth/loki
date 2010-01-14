Loki.add_component('hr', 'default power', function horizontal_rules() {
	var hr = new UI.Component('hr', 'Horizontal rules');
	
	function create_container(hr) {
		var div = hr.ownerDocument.createElement('DIV');
		Util.Element.add_class(div, 'loki__hr_container');
		div.setAttribute('loki:fake', 'true');
		div.setAttribute('loki:container', 'hr');
		return div;
	}
	
	function wrap_hr(hr) {
		var container = create_container(hr);
		container.appendChild(hr)
		add_delete_button(container);
		return container;
	}
	
	function add_delete_button(container) {
		var doc = container.ownerDocument;
		var link = doc.createElement('A');
		link.title = 'Click to remove this horizontal line.'
		Util.Element.add_class(link, 'loki__delete');
		
		Util.Event.add_event_listener(container, 'mouseover', function() {
			link.style.display = 'block';
		});
		
		Util.Event.add_event_listener(container, 'mouseout', function() {
			link.style.display = '';
		});
		
		Util.Event.add_event_listener(link, 'click', function(e) {
			if (!e) var e = window.event;
			
			container.parentNode.removeChild(container);
			
			return Util.Event.prevent_default(e);
		})
		
		container.appendChild(link);
	}
	
	function get_contained_hr(container) {
		return Util.Node.get_last_child_node(container,
			Util.Node.curry_is_tag('HR'));
	}
	
	hr.add_command_set('hr', {
		is_selected: function is_a_hr_selected() {
			return !!this.get_selected();
		},
		
		get_selected: function get_selected_hr() {
			var range = this.env.get_selected_range();
			return Util.Range.get_nearest_ancestor_element_by_tag_name(rng,
				'HR');
		},
		
		insert: function insert_hr() {
			var hr = this.editor.document.createElement('HR');
			this.env.transform.insert_block(wrap_hr(hr));
		}
	});
	
	function insert_hr(editor) {
		editor.env.hr.insert();
	}
	
	hr.create_button('hr.png', 'Horizontal rule', insert_hr);
	
	hr.add_masseuse({
		massage_node_descendants: function(node) {
			Util.Array.for_each(node.getElementsByTagName('HR'),
				self.massage_node, self);
		},

		unmassage_node_descendants: function(node) {
			var div_elements = Util.Array.from(
				node.getElementsByTagName('DIV'));

			div_elements.each(function(div) {
				if (div.getAttribute('loki:container') == 'hr') {
					this.unmassage_node(div);
				}
			}, this);
		},

		massage_node: function massage_hr_node(node) {
			var container = create_container(node);
			node.parentNode.replaceChild(container, node);
			container.appendChild(node);
			add_delete_button(container);
		},

		unmassage_node: function unmassage_hr_node(node) {
			var real = get_contained_hr(node) ||
				node.ownerDocument.createElement('HR');
			node.parentNode.replaceChild(real, node);
		}
	});
	
	return hr;
});
