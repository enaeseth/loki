UI.Loki_Options = function()
{
	this._all = null;
	this._sel = null;
};

/**
 * Both pluses and minuses can be either arrays or strings. E.g.:
 * new Loki_Options( 'all' );
 * new Loki_Options( 'default', ['table', 'hrule'] );
 * new Loki_Options( ['strong', 'em', 'linebreak'] );
 *
 * @param 	pluses (mixed)   Array or string of options to include. See _init_all for available values.
 * @param 	minuses (mixed)  Array or string of options to exclude. See _init_all for available values.
 */
UI.Loki_Options.prototype.init = function(pluses, minuses)
{
	this._init_all();
	this._init_sel(pluses, minuses);
	
	return this;
};

/**
 * Tests whether the given option is set.
 *
 * @param	option 	(string) Must be a string containing the name of one option
 */
UI.Loki_Options.prototype.test = function(option)
{
	return ( this._all[option] != null &&
			 (this._sel & this._all[option]) > 0 );
};

/**
 * Gets all the avilable options.
 *
 * @return	An array with all available options
 */
UI.Loki_Options.prototype.get_all = function()
{
	return this._all;
};
	
/**
 * Initializes the array of all the options
 *
 * NOTE: Be sure to keep this list synced with that in ../Loki_Options.php
 */
UI.Loki_Options.prototype._init_all = function()
{
	this._all = { strong : 1,
				  em : 2,
				  headline : 4,
				  linebreak : 8,
				  align : 16,
				  blockquote : 32,
				  highlight : 64,
				  olist : 128,
				  ulist : 256,
				  indenttext : 512,
				  findtext : 1024,
				  link : 2048,
				  table : 4096,
				  image : 8192,
				  cleanup : 16384,
				  source : 32768,
				  anchor : 65536,
				  hrule : 131072,
				  spell : 262144,  
				  merge : 524288,  // This shouldnt be included in default or all
				  pre : 1048576,
				  //highlight : 2097152,  // available for reassignment
				  clipboard : 4194304,
				  underline : 8388608
				  //asdf : 16777216
	};

	var all = 0;
	for ( var i in this._all )
		if ( i != 'merge' )
			all |= this._all[i];
	this._all.all = all & ~this._all.source; // we never want to assign the ability to edit source on a site-wide basis
	//this._all.all = this._all["default"] | this._all.lists | this._all.align | this._all.headline | this._all.indenttext | this._all.findtext | this._all.image | this._all.assets | this._all.spell | this._all.table | this._all.pre;
					  
	// (we need to use the bracket syntax to access default because default is a reserved word in js)
	this._all["default"] = this._all.strong | this._all.em | this._all.linebreak | this._all.hrule | this._all.link | this._all.anchor | this._all.clipboard;
	this._all.lists = this._all.olist | this._all.ulist;

	this._all.all_minus_pre = this._all.all & ~this._all.pre;
	this._all.notables = this._all.all_minus_pre & ~this._all.table;
	this._all.notables_plus_pre = this._all.notables | this._all.pre;
};

UI.Loki_Options.prototype._init_sel = function(pluses, minuses)
{
	var i;
	
	pluses = (typeof(pluses) == 'string')
		? pluses.split(/s+/)
		: pluses || ['default'];
	minuses = (typeof(minuses) == 'string')
		? minuses.split(/s+/)
		: minuses || [];

	this._sel = 0;
	
	for (i = 0; i < pluses.length; i++) {
		this._sel |= this._all[pluses[i]] || 0;
	}
	
	for (i = 0; i < minuses.length; i++) {
		this._sel &= ~(this._all[minuses[i]] || 0);
	}
};
