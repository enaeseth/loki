/**
 * @class Manages the display of bubbles.
 * @author Eric Naeseth
 * @constructor
 * @param {UI.Loki}	loki
 */
UI.Bubble_Manager = function BubbleManager(loki)
{
	var dh = new Util.Document(function get_doc() { return loki.document; });
	var bubbles = {};
	var next_bubble_id = 0;
	
	/**
	 * Adds a bubble to this manager. 
	 * @param {UI.Bubble}	bubble	the bubble
	 * @param {string}		id		a unique ID for the bubble, if desired
	 * @type boolean
	 */
	this.add = function add(bubble, id)
	{
		if (bubble.manager) {
			var msg = 'This bubble is already managed by another manager.';
			throw new Error(msg);
		}
		
		if (!id) {
			id = next_bubble_id++;
		} else if (id in bubbles) {
			return false;
		}
		
		bubble.manager = this;
		bubble.id = id;
		bubbles[id] = bubble;
		return true;
	}
	
	/**
	 * @param {string}	id
	 * @type UI.Bubble
	 */
	this.get = function get(id)
	{
		return bubbles[id];
	}
	
	/**
	 * Displays the given bubble on the given element.
	 * @param {UI.Bubble}	bubble
	 * @param {HTMLElement}	element
	 * @return the bubble
	 * @type UI.Bubble
	 */
	this.show = function show_bubble(bubble, element)
	{
		if (typeof(element) != 'object') {
			throw new TypeError('Please provide an HTML element to ' + 
				'UI.Bubble_Manager.show().');
		}
		
		if (typeof(bubble) != 'object') {
			if (bubble in bubbles) {
				bubble = bubbles[bubble]; // ID provided
			} else {
				throw new Error('No bubble exists in this manager with the ' +
					'ID of "' + bubble + '".');
			}
		} else if (!bubble.manager) {
			throw new Error('Add the bubble to this manager before trying ' +
				'to show it.');
		} else if (bubble.manager != this) {
			throw new Error('Cannot show a bubble that is managed by ' +
				'another bubble manager.');
		}
		
		if (element.ownerDocument != loki.document) {
			throw new Error('The element must be owned by the Loki editing ' +
				'document.');
		}
		
		if (bubble.visible)
			this.close(bubble);
		
		function show()
		{
			if (bubble.container) {
				if (bubble.container.parentNode)
					bubble.container.parentNode.removeChild(bubble.container);
				bubble.container = null;
			}

			var body = dh.create_element('div', {
				className: 'loki__bubble',
				style: {
					top: '-5em', 
					left: '-5em', 
					position: 'absolute',
					MozUserSelect: 'none'
				}
			});
			
			bubble.materialize(body, element);
			bubble.visible = true;
			bubble.container = body;

			var d = Util.Document.get_dimensions(loki.document);
			loki.document.body.appendChild(body);

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
		
		show.defer();
		return bubble;
	}
	
	/**
	 * Closes the given bubble.
	 * @param {UI.Bubble}	bubble
	 * @return the bubble
	 * @type UI.Bubble
	 */
	this.close = function close_bubble(bubble)
	{
		if (typeof(bubble) != 'object') {
			throw new TypeError('No bubble to close.');
		}
		
		bubble.dematerialize();
		bubble.visible = false;
		
		var c = bubble.container;
		if (c && c.parentNode)
			c.parentNode.removeChild(c);
		return bubble;
	}
	
	/**
	 * Checks if this manager is managing a particular bubble.
	 * @param {UI.Bubble}	bubble
	 * @type boolean
	 */
	this.is_managing = function is_managing(bubble)
	{
		if (typeof(bubble) != 'object') {
			throw new TypeError();
		}
		
		return typeof(bubble.id) != 'undefined' && !!bubbles[bubble.id];
	}
	
	function close_all_bubbles()
	{
		for (var id in bubbles) {
			this.close(bubbles[id]);
		}
	}
	
	loki.add_event_listener('submit', close_all_bubbles, this);
	loki.add_event_listener('begin_source_view_switch', close_all_bubbles,
		this);
}
