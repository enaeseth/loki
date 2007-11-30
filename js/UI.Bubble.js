/**
 * Constructs a new bubble.
 * @class Bubbles.
 * @constructor
 * @author Eric Naeseth
 * @param {UI.Loki}	loki	the Loki instance
 */
UI.Bubble = function Bubble(loki)
{
	var sections = [];
	var bubble = this;
	var body = null;
	var doc = loki.document;
	var dh = new Util.Document(doc);
	
	this.clear = function clear()
	{
		if (body) {
			if (body.parentNode)
				body.parentNode.removeChild(body);
			body = null;
		}
		
		if (sections.length)
			sections = [];
	}
	
	this.add_section = function add_section()
	{
		var frag = doc.createDocumentFragment();
		
		sections.push(frag);
		
		frag.appendAction = function appendAction(text, action, context)
		{
			var faux_anchor = '#' + text.replace(/\W+/, '_').toLowerCase();
			
			var action_link = dh.create_element('a',
				{
					className: 'loki__action', 
					href: faux_anchor,
					style: '-moz-user-select: none;'
				},
				[text]);
			Util.Event.observe(action_link, 'click', function do_action(ev)
			{
				action.call(context, bubble);
				bubble.hide();
				return Util.Event.prevent_default(ev);
			});
			
			return this.appendChild(action_link);
		}
		
		frag.appendText = function appendText(text)
		{
			return this.appendChild(doc.createTextNode(text));
		}
		
		frag.appendEditable = function appendEditable(name, value)
		{
			var display_tn = doc.createTextNode(value);
			var display = dh.create_element('span',
				{
					className: 'loki__editable_display',
					title: 'Double-click to edit.'
				},
				[display_tn]
			);
			
			var input = dh.create_element('input',
				{
					type: 'text', 
					className: 'loki__editable_input',
					name: name,
					value: ''
				}
			);
			
			function edit()
			{
				input.value = value;
				display.parentNode.replaceChild(input, display);
				input.focus();
			}
			
			var keybinder = new UI.Keybinding_Manager(input);
			keybinder.bind('Enter', function accept_new_value(ev) {
				value = display_tn.nodeValue = input.value;
				return Util.Event.prevent_default(ev);
			});
			keybinder.bind('Escape', function cancel_edit(ev) {
				input.parentNode.replaceChild(display, input);
				return Util.Event.prevent_default(ev);
			});
			
			Util.Event.observe(display, 'dblclick', function start_editing(ev) {
				edit.defer();
				return Util.Event.prevent_default(ev);
			});
			
			this.appendChild(display);
			
			return {
				display: display,
				input: input,
				edit: edit,
				
				get_value: function get_value() {
					return value;
				},
				
				get_displayed_value: function get_displayed_value() {
					return (display.parentNode)
						? display_tn.nodeValue
						: input.value;
				}
			};
		}
		
		frag.appendLink = function appendLink(text, url)
		{
			var params = arguments[2] || {};
			params.href = url;
			params.target = '_blank';
			
			return this.appendChild(dh.create_element('a', params, [text]));
		}
		
		frag.appendURL = function appendURL(url)
		{
			return this.appendLink(url, url);
		}
		
		return frag;
	}
	
	this.display = function display(element)
	{
		if (typeof(element) != 'object') {
			throw new TypeError();
		}
		
		if (element.ownerDocument != doc) {
			throw new Error('The element must be owned by the Loki editing ' +
				'document.');
		}
		
		if (body) {
			body.parentNode.removeChild(body);
			body = null;
		}
		
		body = dh.create_element('div', {
			className: 'loki__bubble',
			style: {
				top: '-5em', 
				left: '-5em', 
				position: 'absolute',
				MozUserSelect: 'none'}
		});
		
		for (var i = 0; i < sections.length; i++) {
			if (i > 0) {
				body.appendChild(dh.create_element('span',
					{className: 'loki__bubble_divider'},
					['-']
				));
			}
			
			body.appendChild(sections[i]);
		}
		
		var d = dh.get_dimensions();
		doc.body.appendChild(body);
		
		function insert()
		{
			if (body.offsetWidth == 0 || body.offsetHeight == 0) {
				// Wait until we know the dimensions of the bubble's body.
				insert.defer();
				return;
			}
			
			// Figure out where to put the bubble.
			
			var offset = {h: 1, v: 2};
			var b = {x: 0, y: 0, w: body.offsetWidth, h: body.offsetHeight};
			
			var e = {
				x: element.offsetLeft,
				y: element.offsetTop,
				w: element.offsetWidth,
				h: element.offsetHeight,
				sx: element.offsetLeft - d.scroll.left,
				sy: element.offsetTop - d.scroll.top
			};
			
			if (e.sx + b.w > d.client.width || e.sx < 0) {
				// Anchor the bubble to the bubbled element's right side.
				b.x = e.x + e.w - b.w - offset.h;
			} else {
				// Anchor the bubble to the bubbled element's left side.
				b.x = e.x + offset.h;
			}
			
			if (e.sy + b.h < d.client.height || e.sy < 0) {
				// Anchor the element to the bubbled element's bottom.
				b.y = e.y + e.h + offset.v;
			} else {
				// Anchor the element to the bubbled element's top.
				b.y = e.y - b.h - offset.v;
			}
			
			body.style.left = b.x + 'px';
			body.style.top = b.y + 'px';
		}
		
		insert.defer();
	}
}

