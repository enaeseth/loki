/**
 * @class Manages the display of bubbles.
 * @author Eric Naeseth
 * @constructor
 * @param {UI.Loki}	loki
 */
UI.Bubble_Manager = function BubbleManager(loki)
{
	var doc = loki.document;
	var dh = new Util.Document(doc);
	var bubbles = {};
	var next_bubble_id = 0;
	
	/**
	 * Creates a new bubble.
	 * @type UI.Bubble
	 */
	this.create = function create_bubble(id)
	{
		if (!id)
			id = next_bubble_id++;
		var bubble = new UI.Bubble(this, loki);
		bubble.id = id;
		bubbles[id] = bubble;
		return bubble;
	}
	
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
		if (typeof(bubble) != 'object' || typeof(element) != 'object') {
			throw new TypeError();
		}
		
		if (element.ownerDocument != doc) {
			throw new Error('The element must be owned by the Loki editing ' +
				'document.');
		}
		
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

			bubble.materialize(body);
			bubble.container = body;

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
		if (typeof(bubble) != 'object' || typeof(bubble.container) != 'object') {
			throw new TypeError();
		}
		
		var c = bubble.container;
		c.parentNode.removeChild(c);
		delete bubbles[bubble.id];
		delete bubble.id;
		return bubble;
	}
	
	/**
	 * Checks if this manager is managing a particular bubble.
	 * @param {UI.Bubble}	bubble
	 * @type boolean
	 */
	this.is_managing = function is_managing(bubble)
	{
		if (typeof(bubble) != 'object' || typeof(bubble.container) != 'object') {
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
