/**
 * @class A style that applies directly to a paragraph.
 * @constructor
 * @author Eric Naeseth
 * @extends UI.Style
 *
 * @param {string}	identifier	a short string used for selecting the style
 * @param {string}	name	a descriptive name for the style
 * @param {string}	class_name	the name of the CSS class that this style uses
 * @param {object}	options	optional style settings
 */
UI.Paragraph_Style = function ParagraphStyle(identifier, name, class_name,
	options)
{
	Util.OOP.inherits(this, identifier, name, 'P', class_name, options);
	
	this.apply = function apply_paragraph_style(context)
	{
		var paras = context.collect_paragraphs();
		var cn = this.class_name;
		
		paras.each(function apply_style_to_paragraph(p) {
			p.className = cn;
		});
	}
	
	this.remove = function remove_paragraph_style(context)
	{
		var paras = context.collect_paragraphs();
		
		paras.each(function remove_style_from_paragraph(p) {
			p.removeAttribute('class');
		});
	}
}