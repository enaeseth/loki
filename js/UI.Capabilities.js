/**
 * @class Manages the collection of Loki's capabilities.
 * @author Eric Naeseth
 * @extends Util.Chooser
 */
UI.Capabilities = new Util.Chooser();

/**
 * Registers the capabilities that are bundled with Loki. This happens in
 * this file to easily allow external scripts to figure out the list of
 * bundled capabilities.
 * @type void
 */
UI.Capabilities._add_bundled = function add_bundled_capabilities()
{
	// WARNING: This function contains "magical" lines; specially-formatted
	//          lines that dumb external scripts can detect to create lists
	//          of bundled capabilities and/or sets. Do not edit them.
	//          Do not insert whitespace lines in the magic.
	
	// ----- BEGIN BUNDLED CAPABILITIES -----
	this.add('bold', UI.Bold_Capability);
	this.add('italic', UI.Italic_Capability);
	this.add('underline', UI.Underline_Capability);
	this.add('headings', UI.Heading_Capability);
	this.add('pre', UI.Preformatting_Capability);
	this.add('clipboard', UI.Clipboard_Capability);
	this.add('styles', UI.Style_Capability);
	this.add('links', UI.Link_Capability);
	this.add('anchors', UI.Anchor_Capability);
	this.add('source', UI.Source_Capability);
	// ----- END BUNDLED CAPABILITIES -----
	
	// ----- BEGIN BUNDLED SETS -----
	this.put_set('default', ['bold', 'italic', 'headings', 'clipboard',
		'styles', 'links', 'anchors']);
	// ----- END BUNDLED SETS -----
};