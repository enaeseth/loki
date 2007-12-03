/**
 * Do not call this method directly; instead use
 * UI.Bubble_Manager.create_bubble().
 * @class Bubbles.
 * @constructor
 * @author Eric Naeseth
 * @param {UI.Bubble_Manager}	manager	the bubble's manager
 * @param {UI.Loki}	loki	the Loki instance
 */
UI.Bubble = function Bubble(loki)
{
	if (typeof(loki) != 'object')
		throw new TypeError('Please provide a Loki instance to UI.Bubble.');
	
	var bubble = this;
	this.visible = false;
	
	this.materialize = Util.Function.unimplemented;
	
	this._create_element = function create_element(name, attributes, children)
	{
		return Util.Document.create_element(loki.document, name, attributes,
			children);
	}
	
	this._create_element_ns = function create_element_ns(name, attributes, children)
	{
		function make_non_selectable(attrs)
		{
			if (!attrs.style) {
				attrs.style = '-moz-user-select: none';
			} else {
				attrs.style.MozUserSelect = 'none';
			}
			
			return attrs;
		}
		
		return this._create_element(name, make_non_selectable(attributes || {}),
			children);
	}
	
	this._separator = function create_separator()
	{
		return this._create_element_ns('span', {className: 'loki__separator'},
			['-']);
	}
	
	this._text = function create_span_text_wrapper(text)
	{
		return this._create_element_ns('span', {className: 'loki__text'},
			[text]);
	}
	
	this._link = function create_link(text, url)
	{
		if (!text) {
			text = url.length > 30
				? url.substr(0, 14) + '…' + url.substr(url.length - 14)
				: url;
		}
		
		var l = this._create_element_ns('a', {
			className: 'loki__bubble__link',
			href: url,
			target: '_blank'
		}, [text]);
		
		Util.Event.observe(l, 'click', function bubble_link_clicked(e) {
			window.open(url);
			return Util.Event.prevent_default(e);
		});
		
		return l;
	}
	
	this._action = function create_action_link(text, action, context)
	{
		var bubble = this;
		var l = this._create_element_ns('a', {
			className: 'loki__bubble__action',
			href: '#',
		}, [text]);
		
		Util.Event.observe(l, 'click', function bubble_action_link_clicked(e) {
			var action_func = (typeof(action) == 'string')
				? context[action]
				: action;
			action_func.call(context || null);
			bubble.manager.close(bubble);
			return Util.Event.prevent_default(e);
		});
		
		return l;
	}
	
	function is_function()
	{
		for (var i = 0; i < arguments.length; i++) {
			if (typeof(arguments[i]) != 'function')
				return false;
		}
		
		return true;
	}
}

/**
 * Convenience function for creating a new bubble class.
 * @param {object}
 * @type function
 */
UI.Bubble.create = function create_bubble_class(prototype)
{
	var new_bubble = function AnonymousBubble(loki)
	{
		UI.Bubble.call(this, loki);
		
		if (typeof(this.initialize) == 'function')
			this.initialize.apply(this, arguments);
			
		for (var name in prototype)
			this[name] = prototype[name];
	}
	
	return new_bubble;
}
