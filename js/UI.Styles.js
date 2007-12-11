/**
 * @class A repository for paragraph styles.
 * @author Eric Naeseth
 * @extends Util.Chooser
 * @see UI.Style_Capability
 */
UI.Styles = new Util.Chooser();

/**
 * Adds a new style.
 * @param {string}	identifier	a short string used for selecting the style
 * @param {string}	name	a descriptive name for the style
 * @param {string}	tag		the name of the tag of the style's container
 * @param {object}	options	optional parameters for the style
 * @return the created style object
 * @type object
 */
UI.Styles.add = (function extend(add_to_chooser) {
	return function add(identifier, name, tag, options)
	{
		return add_to_chooser.call(this, identifier, {
			identifier: identifier,
			name: name,
			tag: tag.toUpperCase(),
			classes: (Util.is_string(options.classes)
				? options.classes.split(/\s+/)
				: options.classes || []),
			category: options.category || null,
			nestable: !!options.nestable,
			
			chosen: options.chosen || Util.Function.empty,
			selected: options.selected || Util.Function.empty,
			deselected: options.deselected || Util.Function.empty
		});
	}
})(UI.Styles.add);

/**
 * Convenience function for adding a paragraph style with a toolbar button.
 * @param {string}	identifier	a short string used for selecting the style
 * @param {string}	name	a descriptive name for the style
 * @param {string}	tag		the name of the tag of the style's container
 * @param {string}	icon	filename of the toolbar icon
 * @param {object}	options	optional parameters for the style
 * @return the created style object
 * @type object
 */
UI.Styles.add_with_button = function add_with_button(identifier, name, tag,
	icon, options)
{
	var loki;
	var styler;
	var active = false;
	
	var button = new UI.Toolbar.Button(icon, name, function toggle_style() {
		if (active) {
			styler.remove(identifier);
		} else {
			styler.apply(identifier);
		}
	});
	
	if (!options)
		options = {};
	
	options.chosen = function style_chosen(loki_instance, styler_instance)
	{
		loki = loki_instance;
		styler = styler_instance;
		
		styler.toolbar_items.push(button);
	}
	
	options.selected = function style_selected()
	{
		active = true;
		button.set_active(true);
	}
	
	options.deselected = function style_deselected()
	{
		active = false;
		button.set_active(false);
	}
	
	return UI.Styles.add(identifier, name, tag, options);
}

/**
 * @ignore
 */
UI.Styles._add_bundled = function add_bundled_styles()
{
	UI.Styles.add_with_button('blockquote', 'Block quotation', 'blockquote',
		'blockquote.gif', {nestable: true});
		
	UI.Styles.put_set('default', ['blockquote']);
}

